import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAdmin } from '@/lib/admin';
import { encryptKey, decryptKey } from '@/lib/crypto';
import { redis } from '@/lib/redis';
import { invalidateKeyCache } from '@/lib/providers/keypool';
import { testKey, updateKeyHealth } from '@/lib/key-validation';
import type { ProviderKeyEntry } from '@/lib/providers/keypool';

export const runtime = 'nodejs';

const PROVIDERS = ['Pollinations', 'VoidAI', 'Airforce', 'Cerebras', 'Groq', 'AIHorde', 'TokenReply', 'NagaAI', 'Happupy'] as const;

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

// GET /api/admin/keys — list all keys (env + KV) per provider
export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const encKey = process.env.ENCRYPTION_KEY;
  const result: Record<string, Array<{
    id: string;
    preview: string;
    source: 'env' | 'kv';
    status: string;
    createdAt: number | null;
  }>> = {};

  for (const provider of PROVIDERS) {
    const providerKey = provider.toLowerCase();
    const entries: typeof result[string] = [];

    // Env-sourced keys
    const prefix = `${provider.toUpperCase()}_KEY_`;
    for (let i = 1; i <= 10; i++) {
      const rawKey = process.env[`${prefix}${i}`];
      if (!rawKey) continue;
      const statusJson = await redis.get(`admin:key:status:${providerKey}:env-${i}`);
      const status = statusJson ? JSON.parse(statusJson).status : 'unknown';
      entries.push({
        id: `env-${i}`,
        preview: keyPreview(rawKey),
        source: 'env',
        status,
        createdAt: null,
      });
    }

    // KV-sourced keys
    const listJson = await redis.get(`admin:provider:keys:${providerKey}`);
    if (listJson) {
      const kvEntries: ProviderKeyEntry[] = JSON.parse(listJson);
      for (const entry of kvEntries) {
        const statusJson = await redis.get(`admin:key:status:${providerKey}:${entry.id}`);
        const status = statusJson ? JSON.parse(statusJson).status : 'unknown';
        entries.push({
          id: entry.id,
          preview: entry.preview,
          source: 'kv',
          status,
          createdAt: entry.createdAt,
        });
      }
    }

    result[provider] = entries;
  }

  return NextResponse.json({ providers: result });
}

// POST /api/admin/keys — add a new KV-stored provider key
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const encKey = process.env.ENCRYPTION_KEY;
  if (!encKey) {
    return NextResponse.json(
      { error: 'ENCRYPTION_KEY not configured' },
      { status: 500 }
    );
  }

  const { provider, key: rawKey } = await request.json();

  if (!provider || !PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }
  if (!rawKey || typeof rawKey !== 'string' || rawKey.trim().length < 8) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  }

  const trimmedKey = rawKey.trim();

  const status = await testKey(provider, trimmedKey);
  if (status === 'error') {
    return NextResponse.json(
      { error: 'Key validation failed — key appears invalid or provider rejected it' },
      { status: 400 }
    );
  }

  const id = `kv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const encryptedKey = encryptKey(trimmedKey, encKey);
  const entry: ProviderKeyEntry = {
    id,
    encryptedKey,
    preview: keyPreview(trimmedKey),
    createdAt: Date.now(),
  };

  const providerKey = provider.toLowerCase();
  const listJson = await redis.get(`admin:provider:keys:${providerKey}`);
  const list: ProviderKeyEntry[] = listJson ? JSON.parse(listJson) : [];
  list.push(entry);
  await redis.set(`admin:provider:keys:${providerKey}`, JSON.stringify(list));

  // Record initial health status
  await updateKeyHealth(provider, id, status).catch(e =>
    console.error('Failed to record key health:', e)
  );

  // Invalidate key cache so new key is available immediately
  await invalidateKeyCache().catch(e => console.error('Failed to invalidate key cache:', e));

  return NextResponse.json({ success: true, id, preview: entry.preview, status });
}

// DELETE /api/admin/keys?provider=X&id=Y — remove a KV-stored key
export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') || '';
  const id = url.searchParams.get('id') || '';

  if (!PROVIDERS.includes(provider as any)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }
  if (!id.startsWith('kv-')) {
    return NextResponse.json({ error: 'Can only delete KV-sourced keys' }, { status: 400 });
  }

  const providerKey = provider.toLowerCase();
  const listJson = await redis.get(`admin:provider:keys:${providerKey}`);
  if (!listJson) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

  const list: ProviderKeyEntry[] = JSON.parse(listJson);
  const filtered = list.filter((e) => e.id !== id);
  if (filtered.length === list.length) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  await redis.set(`admin:provider:keys:${providerKey}`, JSON.stringify(filtered));
  await redis.del(`admin:key:status:${providerKey}:${id}`);

  // Invalidate key cache so removed key is immediately unavailable
  await invalidateKeyCache().catch(e => console.error('Failed to invalidate key cache:', e));

  return NextResponse.json({ success: true });
}
