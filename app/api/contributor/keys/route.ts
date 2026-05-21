import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redis } from '@/lib/redis';
import { getContributorKeyRefs, removeContributorKeyRef } from '@/lib/contributor';
import { invalidateKeyCache } from '@/lib/providers/keypool';
import type { ProviderKeyEntry } from '@/lib/providers/keypool';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const refs = await getContributorKeyRefs(userId);
  const keys: Array<{
    id: string;
    provider: string;
    preview: string;
    status: string;
    createdAt: number;
  }> = [];

  for (const ref of refs) {
    const listJson = await redis.get(`admin:provider:keys:${ref.provider.toLowerCase()}`);
    if (!listJson) continue;
    const list: ProviderKeyEntry[] = JSON.parse(listJson);
    const entry = list.find(e => e.id === ref.keyId && e.donorId === userId);
    if (!entry) continue;

    const statusJson = await redis.get(`admin:key:status:${ref.provider.toLowerCase()}:${ref.keyId}`);
    const status = statusJson ? JSON.parse(statusJson).status : 'unknown';

    keys.push({ id: entry.id, provider: ref.provider, preview: entry.preview, status, createdAt: entry.createdAt });
  }

  return NextResponse.json({ keys });
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') ?? '';
  const id = url.searchParams.get('id') ?? '';

  if (!provider || !id) return NextResponse.json({ error: 'provider and id required' }, { status: 400 });

  const providerKey = provider.toLowerCase();
  const listJson = await redis.get(`admin:provider:keys:${providerKey}`);
  if (!listJson) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

  const list: ProviderKeyEntry[] = JSON.parse(listJson);
  const entry = list.find(e => e.id === id);
  if (!entry) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  if (entry.donorId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await redis.set(`admin:provider:keys:${providerKey}`, JSON.stringify(list.filter(e => e.id !== id)));
  await redis.del(`admin:key:status:${providerKey}:${id}`);
  await removeContributorKeyRef(userId, id);

  // Invalidate key cache so removed key is immediately unavailable
  await invalidateKeyCache().catch(e => console.error('Failed to invalidate key cache:', e));

  return NextResponse.json({ success: true });
}
