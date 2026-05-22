import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAdmin } from '@/lib/admin';
import { encryptKey } from '@/lib/crypto';
import { redis } from '@/lib/redis';
import { invalidateKeyCache } from '@/lib/providers/keypool';
import { testKey, updateKeyHealth, PROVIDER_TEST_CONFIGS } from '@/lib/key-validation';
import { COMING_SOON_PROVIDERS } from '@/lib/providers/coming-soon-providers';
import type { ProviderKeyEntry } from '@/lib/providers/keypool';

export const runtime = 'nodejs';

const BASE_PROVIDERS = [
  { id: 'pollinations', name: 'Pollinations', envPrefix: 'POLLINATIONS' },
  { id: 'voidai',       name: 'VoidAI',       envPrefix: 'VOIDAI' },
  { id: 'airforce',     name: 'Airforce',     envPrefix: 'AIRFORCE' },
  { id: 'cerebras',     name: 'Cerebras',     envPrefix: 'CEREBRAS' },
  { id: 'groq',         name: 'Groq',         envPrefix: 'GROQ' },
  { id: 'aihorde',      name: 'AIHorde',      envPrefix: 'AIHORDE' },
  { id: 'tokenreply',   name: 'TokenReply',   envPrefix: 'TOKENREPLY' },
  { id: 'nagaai',       name: 'NagaAI',       envPrefix: 'NAGAAI' },
  { id: 'happupy',      name: 'Happupy',      envPrefix: 'HAPPUPY' },
] as const;

const ALL_PROVIDER_IDS = new Set([
  ...BASE_PROVIDERS.map(p => p.id),
  ...COMING_SOON_PROVIDERS.map(p => p.id),
]);

// Find the matching PROVIDER_TEST_CONFIGS key for a provider ID (case-insensitive, handles variations like mistral-ai → Mistral)
function findTestConfigKey(providerId: string): string | undefined {
  if (PROVIDER_TEST_CONFIGS[providerId]) return providerId;

  const normalize = (str: string) => str.toLowerCase().replace(/[-_]/g, '');
  const normalizedInput = normalize(providerId);

  // Try direct normalized match
  let match = Object.keys(PROVIDER_TEST_CONFIGS).find(
    k => normalize(k) === normalizedInput
  );
  if (match) return match;

  // Handle suffix variations: strip '-ai', '-models', '-nim', '-claude' and retry
  const suffixes = ['-ai', '-models', '-nim', '-claude', '-free', '-turbo'];
  for (const suffix of suffixes) {
    if (providerId.endsWith(suffix)) {
      const withoutSuffix = providerId.slice(0, -suffix.length);
      const normalizedWithoutSuffix = normalize(withoutSuffix);
      match = Object.keys(PROVIDER_TEST_CONFIGS).find(
        k => normalize(k) === normalizedWithoutSuffix
      );
      if (match) return match;
    }
  }

  return undefined;
}

function keyPreview(rawKey: string): string {
  if (rawKey.length <= 12) return rawKey;
  return `${rawKey.slice(0, 8)}...${rawKey.slice(-4)}`;
}

async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const isAdmin = await checkAdmin(userId);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return { userId };
}

async function getKeysForProvider(providerId: string) {
  const entries: Array<{
    id: string; preview: string; source: 'env' | 'kv';
    status: string; createdAt: number | null; tier?: string;
  }> = [];

  const baseProvider = BASE_PROVIDERS.find(p => p.id === providerId);
  if (baseProvider) {
    for (let i = 1; i <= 10; i++) {
      const rawKey = process.env[`${baseProvider.envPrefix}_KEY_${i}`];
      if (!rawKey) continue;
      const statusJson = await redis.get(`admin:key:status:${providerId}:env-${i}`);
      const status = statusJson ? (JSON.parse(statusJson) as { status: string }).status : 'unknown';
      entries.push({ id: `env-${i}`, preview: keyPreview(rawKey), source: 'env', status, createdAt: null });
    }
  }

  const listJson = await redis.get(`admin:provider:keys:${providerId}`);
  if (listJson) {
    const kvEntries: ProviderKeyEntry[] = JSON.parse(listJson);
    for (const entry of kvEntries) {
      const statusJson = await redis.get(`admin:key:status:${providerId}:${entry.id}`);
      const status = statusJson ? (JSON.parse(statusJson) as { status: string }).status : 'unknown';
      entries.push({ id: entry.id, preview: entry.preview, source: 'kv', status, createdAt: entry.createdAt, tier: entry.tier });
    }
  }

  return entries;
}

// GET /api/admin/keys?provider={id} — list keys for a specific provider
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const url = new URL(request.url);
  const providerId = url.searchParams.get('provider');

  if (!providerId) {
    return NextResponse.json({ error: 'provider query param required' }, { status: 400 });
  }
  if (!ALL_PROVIDER_IDS.has(providerId)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  const keys = await getKeysForProvider(providerId);
  return NextResponse.json({ keys });
}

// POST /api/admin/keys — add a new KV-stored provider key
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const encKey = process.env.ENCRYPTION_KEY;
  if (!encKey) return NextResponse.json({ error: 'ENCRYPTION_KEY not configured' }, { status: 500 });

  const { provider, key: rawKey, tier } = await request.json();

  if (!provider || !ALL_PROVIDER_IDS.has(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }
  if (!rawKey || typeof rawKey !== 'string' || rawKey.trim().length < 8) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  }

  const trimmedKey = rawKey.trim();

  // Try to validate key if a test config exists; otherwise store with unknown status
  let status: string = 'unknown';
  const testConfigKey = findTestConfigKey(provider);
  if (testConfigKey) {
    const testResult = await testKey(testConfigKey, trimmedKey);
    if (testResult === 'error') {
      return NextResponse.json(
        { error: 'Key validation failed — provider rejected it or key appears invalid' },
        { status: 400 }
      );
    }
    status = testResult;
  }

  const id = `kv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const encryptedKey = encryptKey(trimmedKey, encKey);
  const entry: ProviderKeyEntry = {
    id,
    encryptedKey,
    preview: keyPreview(trimmedKey),
    createdAt: Date.now(),
    ...(tier && { tier }),
  };

  const listJson = await redis.get(`admin:provider:keys:${provider}`);
  const list: ProviderKeyEntry[] = listJson ? JSON.parse(listJson) : [];
  list.push(entry);
  await redis.set(`admin:provider:keys:${provider}`, JSON.stringify(list));

  await updateKeyHealth(provider, id, status as 'working' | 'rate_limited' | 'error').catch(e =>
    console.error('Failed to record key health:', e)
  );
  await invalidateKeyCache().catch(e => console.error('Failed to invalidate key cache:', e));

  return NextResponse.json({ success: true, id, preview: entry.preview, status });
}

// DELETE /api/admin/keys?provider={id}&id={keyId}
export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') || '';
  const id = url.searchParams.get('id') || '';

  if (!ALL_PROVIDER_IDS.has(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }
  // Allow deleting kv- and donor- prefixed keys (not env keys)
  if (!id.startsWith('kv-') && !id.startsWith('donor-')) {
    return NextResponse.json({ error: 'Can only delete KV-sourced keys' }, { status: 400 });
  }

  const listJson = await redis.get(`admin:provider:keys:${provider}`);
  if (!listJson) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

  const list: ProviderKeyEntry[] = JSON.parse(listJson);
  const filtered = list.filter((e) => e.id !== id);
  if (filtered.length === list.length) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  await redis.set(`admin:provider:keys:${provider}`, JSON.stringify(filtered));
  await redis.del(`admin:key:status:${provider}:${id}`);
  await invalidateKeyCache().catch(e => console.error('Failed to invalidate key cache:', e));

  return NextResponse.json({ success: true });
}
