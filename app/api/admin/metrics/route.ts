import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAdmin } from '@/lib/admin';
import { getMetrics, getMetricsForDate } from '@/lib/metrics';
import { getProviderKeyCount } from '@/lib/providers/keypool';

export const runtime = 'nodejs';

const PROVIDERS = [
  'Pollinations', 'VoidAI', 'Airforce', 'Cerebras', 'Groq', 'AIHorde',
  'TokenReply', 'NagaAI', 'Happupy',
] as const;

/**
 * Get system metrics and health status.
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const isAdmin = await checkAdmin(userId);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const metrics = getMetrics();

    // Get key counts per provider
    const keyCounts: Record<string, number> = {};
    for (const provider of PROVIDERS) {
      try {
        keyCounts[provider] = await getProviderKeyCount(provider);
      } catch {
        keyCounts[provider] = 0;
      }
    }

    // Get metrics for past 7 days
    const historicalMetrics: Array<{ date: string; metrics: any }> = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMetrics = await getMetricsForDate(dateStr);
      if (dayMetrics) {
        historicalMetrics.push({ date: dateStr, metrics: dayMetrics });
      }
    }

    return NextResponse.json({
      timestamp: Date.now(),
      current: metrics,
      keyCounts,
      historical: historicalMetrics,
      health: {
        status: metrics.failureRate < 0.05 ? 'healthy' : 'degraded',
        failureRate: `${(metrics.failureRate * 100).toFixed(2)}%`,
        cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(2)}%`,
        avgResponseTime: `${metrics.avgResponseTime.toFixed(0)}ms`,
      },
    });
  } catch (e) {
    console.error('Failed to get metrics:', e);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}
