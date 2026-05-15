import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAdmin } from '@/lib/admin';
import { getSystemAnalytics } from '@/lib/analytics';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';

const PROVIDERS = ['AIHubMix', 'Pollinations', 'VoidAI', 'Airforce', 'Cerebras', 'Groq', 'AIHorde', 'TokenReply', 'NagaAI'];

// GET /api/admin/analytics — system-wide analytics
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const isAdmin = await checkAdmin(userId);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let analytics;
  try {
    analytics = await getSystemAnalytics();
  } catch (e) {
    console.error('getSystemAnalytics failed:', e);
    return NextResponse.json({ error: 'Analytics unavailable' }, { status: 500 });
  }
  const today = new Date().toISOString().split('T')[0];

  // Count active provider keys (env + KV)
  let totalActiveKeys = 0;
  const keyCountsByProvider: Record<string, number> = {};

  for (const provider of PROVIDERS) {
    let count = 0;
    // Env keys
    for (let i = 1; i <= 10; i++) {
      if (process.env[`${provider.toUpperCase()}_KEY_${i}`]) count++;
    }
    // KV keys
    const listJson = await redis.get(`admin:provider:keys:${provider.toLowerCase()}`);
    if (listJson) {
      const list = JSON.parse(listJson);
      count += list.length;
    }
    keyCountsByProvider[provider] = count;
    totalActiveKeys += count;
  }

  // Warnings: keys near daily Cerebras token limit
  const warnings: string[] = [];
  for (let i = 0; i < 10; i++) {
    const tokenStr = await redis.get(`cerebras:${i}:tokens:${today}`);
    const used = tokenStr ? parseInt(tokenStr) : 0;
    if (used > 900000) {
      warnings.push(`Cerebras key ${i + 1} is at ${Math.round(used / 10000) / 100}M tokens today (limit: 1M)`);
    } else if (used > 700000) {
      warnings.push(`Cerebras key ${i + 1} is at ${Math.round(used / 10000) / 100}M tokens today — approaching limit`);
    }
  }

  // Keys with error status
  for (const provider of PROVIDERS) {
    const providerKey = provider.toLowerCase();
    for (let i = 1; i <= 10; i++) {
      const statusJson = await redis.get(`admin:key:status:${providerKey}:env-${i}`);
      if (statusJson) {
        const { status } = JSON.parse(statusJson);
        if (status === 'error') {
          warnings.push(`${provider} key env-${i} is reporting errors`);
        } else if (status === 'rate_limited') {
          warnings.push(`${provider} key env-${i} is rate limited`);
        }
      }
    }
    const listJson = await redis.get(`admin:provider:keys:${providerKey}`);
    if (listJson) {
      const list = JSON.parse(listJson);
      for (const entry of list) {
        const statusJson = await redis.get(`admin:key:status:${providerKey}:${entry.id}`);
        if (statusJson) {
          const { status } = JSON.parse(statusJson);
          if (status === 'error') {
            warnings.push(`${provider} key ${entry.preview} is reporting errors`);
          } else if (status === 'rate_limited') {
            warnings.push(`${provider} key ${entry.preview} is rate limited`);
          }
        }
      }
    }
  }

  return NextResponse.json({
    ...analytics,
    totalActiveKeys,
    keyCountsByProvider,
    warnings,
  });
}
