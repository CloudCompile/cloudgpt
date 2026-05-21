import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redis } from '@/lib/redis';
import { checkAdmin } from '@/lib/admin';
import type { ProviderKeyEntry } from '@/lib/providers/keypool';

const PROVIDERS = [
  'Pollinations', 'VoidAI', 'Airforce',
  'Cerebras', 'Groq', 'AIHorde', 'TokenReply', 'NagaAI', 'Happupy',
] as const;

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await checkAdmin(userId);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const stats: Record<string, any> = {
      timestamp: Date.now(),
      providers: {},
      totalKeys: 0,
      estimatedRedisSize: 0,
      suspiciousPatterns: [] as string[],
    };

    for (const provider of PROVIDERS) {
      const listJson = await redis.get(`admin:provider:keys:${provider.toLowerCase()}`);
      const list: ProviderKeyEntry[] = listJson ? JSON.parse(listJson) : [];

      stats.providers[provider] = {
        count: list.length,
        avgKeyLength: list.length > 0
          ? Math.round(list.reduce((sum, e) => sum + (e.encryptedKey?.length || 0), 0) / list.length)
          : 0,
      };

      stats.totalKeys += list.length;

      // Estimate Redis memory: ~200 bytes per key entry
      stats.estimatedRedisSize += list.length * 200;

      // Detect spam: large number of keys from single user
      const userKeyCounts = new Map<string, number>();
      for (const entry of list) {
        if (!entry.donorId) continue;
        const count = userKeyCounts.get(entry.donorId) ?? 0;
        userKeyCounts.set(entry.donorId, count + 1);
      }

      for (const [userId, count] of userKeyCounts) {
        if (count > 10) {
          stats.suspiciousPatterns.push(
            `User ${userId} has ${count} keys for ${provider} (threshold: 10)`
          );
        }
      }
    }

    // Warn if estimated Redis size is growing too large
    if (stats.estimatedRedisSize > 100_000_000) { // 100MB
      stats.suspiciousPatterns.push(
        `Redis size estimate: ${Math.round(stats.estimatedRedisSize / 1_000_000)}MB (consider cleanup)`
      );
    }

    return NextResponse.json(stats);
  } catch (e) {
    console.error('Failed to get key stats:', e);
    return NextResponse.json(
      { error: 'Failed to retrieve statistics' },
      { status: 500 }
    );
  }
}
