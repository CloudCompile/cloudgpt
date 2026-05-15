import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { encryptKey } from '@/lib/crypto';
import { redis } from '@/lib/redis';
import { addContributorKeyRef, assignDiscordRole } from '@/lib/contributor';
import type { ProviderKeyEntry } from '@/lib/providers/keypool';

export const runtime = 'nodejs';

const PROVIDERS = [
  'AIHubMix', 'Pollinations', 'VoidAI', 'Airforce',
  'Cerebras', 'Groq', 'AIHorde', 'TokenReply', 'NagaAI',
] as const;

const PROVIDER_TEST_URLS: Record<string, string> = {
  AIHubMix:    'https://aihubmix.com/v1/models',
  Pollinations: 'https://gen.pollinations.ai/v1/models',
  VoidAI:      'https://api.voidai.app/v1/models',
  Airforce:    'https://api.airforce/v1/models',
  Cerebras:    'https://api.cerebras.ai/v1/models',
  Groq:        'https://api.groq.com/openai/v1/models',
  AIHorde:     'https://aihorde.net/api/v2/status/heartbeat',
  TokenReply:  'https://api.tokenreply.com/v1beta/models',
  NagaAI:      'https://api.naga.ac/v1/models',
};

function keyPreview(rawKey: string): string {
  if (rawKey.length <= 12) return rawKey;
  return `${rawKey.slice(0, 8)}...${rawKey.slice(-4)}`;
}

async function testKey(provider: string, rawKey: string): Promise<boolean> {
  const testUrl = PROVIDER_TEST_URLS[provider];
  if (!testUrl) return false;
  try {
    const res = await fetch(testUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${rawKey}` },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok || res.status === 429; // rate-limited = valid key
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const encKey = process.env.ENCRYPTION_KEY;
  if (!encKey) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  let body: { provider?: string; key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { provider, key: rawKey } = body;

  if (!provider || !PROVIDERS.includes(provider as any)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }
  if (!rawKey || typeof rawKey !== 'string' || rawKey.trim().length < 8) {
    return NextResponse.json({ error: 'API key must be at least 8 characters' }, { status: 400 });
  }

  const trimmedKey = rawKey.trim();

  const valid = await testKey(provider, trimmedKey);
  if (!valid) {
    return NextResponse.json(
      { error: 'Key validation failed — the provider rejected it or it appears invalid' },
      { status: 400 }
    );
  }

  const id = `donor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: ProviderKeyEntry = {
    id,
    encryptedKey: encryptKey(trimmedKey, encKey),
    preview: keyPreview(trimmedKey),
    createdAt: Date.now(),
    donorId: userId,
  };

  const providerKey = provider.toLowerCase();
  const listJson = await redis.get(`admin:provider:keys:${providerKey}`);
  const list: ProviderKeyEntry[] = listJson ? JSON.parse(listJson) : [];
  list.push(entry);
  await redis.set(`admin:provider:keys:${providerKey}`, JSON.stringify(list));

  await addContributorKeyRef(userId, provider, id);

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

  return NextResponse.json({ success: true, id, preview: entry.preview, discordRoleAssigned });
}
