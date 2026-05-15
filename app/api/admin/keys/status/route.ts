import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAdmin } from '@/lib/admin';
import { decryptKey } from '@/lib/crypto';
import { redis } from '@/lib/redis';
import type { ProviderKeyEntry } from '@/lib/providers/keypool';

export const runtime = 'nodejs';

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

async function testKey(provider: string, rawKey: string): Promise<'working' | 'rate_limited' | 'error'> {
  const testUrl = PROVIDER_TEST_URLS[provider];
  if (!testUrl) return 'error';
  try {
    const res = await fetch(testUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${rawKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 429) return 'rate_limited';
    if (res.status === 401 || res.status === 403) return 'error';
    if (res.ok) return 'working';
    return 'working';
  } catch {
    return 'error';
  }
}

// POST /api/admin/keys/status — refresh status for a specific key
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const isAdmin = await checkAdmin(userId);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { provider, id } = await request.json();
  if (!provider || !id) {
    return NextResponse.json({ error: 'provider and id required' }, { status: 400 });
  }

  const encKey = process.env.ENCRYPTION_KEY;
  const providerKey = provider.toLowerCase();
  let rawKey: string | null = null;

  if (id.startsWith('env-')) {
    const n = parseInt(id.replace('env-', ''), 10);
    if (!Number.isInteger(n) || n < 1 || n > 10) {
      return NextResponse.json({ error: 'Invalid key id' }, { status: 400 });
    }
    rawKey = process.env[`${provider.toUpperCase()}_KEY_${n}`] || null;
  } else if (id.startsWith('kv-') && encKey) {
    const listJson = await redis.get(`admin:provider:keys:${providerKey}`);
    if (listJson) {
      const list: ProviderKeyEntry[] = JSON.parse(listJson);
      const entry = list.find((e) => e.id === id);
      if (entry) {
        try {
          rawKey = decryptKey(entry.encryptedKey, encKey);
        } catch {
          return NextResponse.json({ error: 'Failed to decrypt key' }, { status: 500 });
        }
      }
    }
  }

  if (!rawKey) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  const status = await testKey(provider, rawKey);
  await redis.set(
    `admin:key:status:${providerKey}:${id}`,
    JSON.stringify({ status, lastChecked: Date.now() })
  );

  return NextResponse.json({ status });
}
