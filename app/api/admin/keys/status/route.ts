import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAdmin } from '@/lib/admin';
import { decryptKey } from '@/lib/crypto';
import { redis } from '@/lib/redis';
import { testKey, PROVIDER_TEST_CONFIGS } from '@/lib/key-validation';
import type { ProviderKeyEntry } from '@/lib/providers/keypool';

export const runtime = 'nodejs';

// Find the matching PROVIDER_TEST_CONFIGS key for a provider ID (case-insensitive)
function findTestConfigKey(providerId: string): string | undefined {
  if (PROVIDER_TEST_CONFIGS[providerId]) return providerId;
  const lower = providerId.toLowerCase().replace(/[-_]/g, '');
  return Object.keys(PROVIDER_TEST_CONFIGS).find(
    k => k.toLowerCase().replace(/[-_]/g, '') === lower
  );
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
    // For env keys, try the uppercase provider prefix
    rawKey = process.env[`${provider.toUpperCase()}_KEY_${n}`] || null;
  } else if ((id.startsWith('kv-') || id.startsWith('donor-')) && encKey) {
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

  // Find test config (case-insensitive match)
  const testConfigKey = findTestConfigKey(provider);
  if (!testConfigKey) {
    // No test config — mark as unknown
    await redis.set(
      `admin:key:status:${providerKey}:${id}`,
      JSON.stringify({ status: 'unknown', lastChecked: Date.now() })
    );
    return NextResponse.json({ status: 'unknown' });
  }

  const status = await testKey(testConfigKey, rawKey);
  await redis.set(
    `admin:key:status:${providerKey}:${id}`,
    JSON.stringify({ status, lastChecked: Date.now() })
  );

  return NextResponse.json({ status });
}
