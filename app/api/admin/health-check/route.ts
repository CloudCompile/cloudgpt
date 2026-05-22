import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAdmin } from '@/lib/admin';
import { runBackgroundHealthChecks } from '@/lib/key-validation';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 30; // Allow up to 30 seconds for health checks

/**
 * Endpoint for periodically checking key health.
 * Should be called via a cron job or scheduled task (e.g., every 5 minutes).
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const isAdmin = await checkAdmin(userId);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Allow at most 3 health-check triggers per 5-minute window to prevent DoS.
  const rl = await checkRateLimit(`health-check:${userId}`, { maxRequests: 3, windowMs: 300_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many health-check requests — retry after the current window expires' },
      { status: 429 }
    );
  }

  try {
    // Run health checks in the background (don't await)
    runBackgroundHealthChecks().catch(e =>
      console.error('Background health check failed:', e)
    );

    return NextResponse.json({
      success: true,
      message: 'Health check started in background',
    });
  } catch (e) {
    console.error('Failed to start health check:', e);
    return NextResponse.json(
      { error: 'Failed to start health check' },
      { status: 500 }
    );
  }
}
