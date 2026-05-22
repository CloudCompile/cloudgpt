import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { encryptKey } from '@/lib/crypto';
import { redis } from '@/lib/redis';
import { addContributorKeyRef, assignDiscordRole } from '@/lib/contributor';
import { invalidateKeyCache } from '@/lib/providers/keypool';
import { testKey, updateKeyHealth, getProviderKeyCount, PROVIDER_TEST_CONFIGS } from '@/lib/key-validation';
import { invalidateActiveProviderCache } from '@/lib/providers';
import type { ProviderKeyEntry } from '@/lib/providers/keypool';

const KEYS_REQUIRED_TO_ACTIVATE = 3;

export const runtime = 'nodejs';

// Derived from PROVIDER_TEST_CONFIGS — if a provider has a test config, keys can be validated and donated
const PROVIDERS = new Set(Object.keys(PROVIDER_TEST_CONFIGS));

// Find the matching PROVIDER_TEST_CONFIGS key for a provider ID (case-insensitive)
function findTestConfigKey(providerId: string): string | undefined {
  if (PROVIDER_TEST_CONFIGS[providerId]) return providerId;
  const lower = providerId.toLowerCase().replace(/[-_]/g, '');
  return Object.keys(PROVIDER_TEST_CONFIGS).find(
    k => k.toLowerCase().replace(/[-_]/g, '') === lower
  );
}

function keyPreview(rawKey: string): string {
  if (rawKey.length <= 12) return rawKey;
  return `${rawKey.slice(0, 8)}...${rawKey.slice(-4)}`;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const encKey = process.env.ENCRYPTION_KEY;
  if (!encKey) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  // Rate limit: max 5 keys per hour per user
  const rateLimitKey = `donate:ratelimit:${userId}`;
  const count = await redis.incr(rateLimitKey);
  if (count === 1) await redis.expire(rateLimitKey, 3600); // 1 hour
  if (count > 5) {
    return NextResponse.json(
      { error: 'Rate limited: max 5 keys per hour' },
      { status: 429 }
    );
  }

  // Per-user key limit: max 100 keys total
  const userKeysPattern = `contributor:keys:${userId}`;
  const existingKeysJson = await redis.get(userKeysPattern);
  const existingKeys = existingKeysJson ? JSON.parse(existingKeysJson) : [];
  if (existingKeys.length >= 100) {
    return NextResponse.json(
      { error: 'Key limit reached: maximum 100 keys per user' },
      { status: 400 }
    );
  }

  let body: { provider?: string; key?: string; tier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { provider, key: rawKey, tier } = body;

  const testConfigKey = provider ? findTestConfigKey(provider) : undefined;
  if (!provider || !testConfigKey) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }
  if (!rawKey || typeof rawKey !== 'string' || rawKey.trim().length < 8) {
    return NextResponse.json({ error: 'API key must be at least 8 characters' }, { status: 400 });
  }

  const trimmedKey = rawKey.trim();

  // Deduplication: check if this exact key already exists
  const providerKey = provider.toLowerCase();
  const listJson = await redis.get(`admin:provider:keys:${providerKey}`);
  const existingList: ProviderKeyEntry[] = listJson ? JSON.parse(listJson) : [];
  const encryptedToCheck = encryptKey(trimmedKey, encKey);
  if (existingList.some(entry => entry.encryptedKey === encryptedToCheck)) {
    return NextResponse.json(
      { error: 'This key has already been donated' },
      { status: 400 }
    );
  }

  const status = await testKey(testConfigKey, trimmedKey);
  if (status === 'error') {
    return NextResponse.json(
      { error: 'Key validation failed — the provider rejected it or it appears invalid' },
      { status: 400 }
    );
  }

  const id = `donor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: ProviderKeyEntry = {
    id,
    encryptedKey: encryptedToCheck, // Use already-encrypted key
    preview: keyPreview(trimmedKey),
    createdAt: Date.now(),
    donorId: userId,
    ...(tier && { tier }), // Include tier if provided (for Pollinations)
  };

  existingList.push(entry);
  await redis.set(`admin:provider:keys:${providerKey}`, JSON.stringify(existingList));

  await addContributorKeyRef(userId, provider, id);

  // Record initial health status
  await updateKeyHealth(provider, id, status).catch(e =>
    console.error('Failed to record key health:', e)
  );

  // Invalidate key cache so new key is available immediately
  await invalidateKeyCache().catch(e => console.error('Failed to invalidate key cache:', e));
  invalidateActiveProviderCache();

  // Assign Discord role if user has Discord connected via Clerk
  let discordRoleAssigned = false;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const discordAccount = user.externalAccounts.find(a => a.provider === 'oauth_discord');
    if (discordAccount?.externalId) {
      discordRoleAssigned = await assignDiscordRole(discordAccount.externalId, userId);
    }
  } catch (e) {
    console.error('Discord role assignment failed:', e);
  }

  // Return key count so client can show activation progress
  const providerKeyCount = await getProviderKeyCount(testConfigKey).catch(() => 1);
  const providerNowActive = providerKeyCount >= KEYS_REQUIRED_TO_ACTIVATE;

  // For Pollinations, also calculate total pollen/hour capacity
  let pollenPerHour = null;
  if (provider.toLowerCase() === 'pollinations') {
    const tierMap: Record<string, number> = {
      'Spore': 0.01,
      'Seed': 0.15,
      'Flower': 0.4,
      'Nectar': 0.8,
    };
    const pollenList = existingList.map(entry => tierMap[entry.tier || 'Seed'] || 0.15);
    pollenPerHour = pollenList.reduce((a, b) => a + b, 0);
  }

  return NextResponse.json({
    success: true,
    id,
    preview: entry.preview,
    discordRoleAssigned,
    providerKeyCount,
    providerNowActive,
    keysRequired: KEYS_REQUIRED_TO_ACTIVATE,
    tier: tier || null,
    pollenPerHour,
  });
}
