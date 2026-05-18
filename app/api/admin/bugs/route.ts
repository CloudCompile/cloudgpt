import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAdmin } from '@/lib/admin';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all bug reports from queue
    const queue = await redis.lRange('bug_reports:queue', 0, -1);
    const bugs = [];

    for (const reportId of queue) {
      const report = await redis.hGetAll(`bug_report:${reportId}`);
      if (report) {
        bugs.push(report);
      }
    }

    // Sort by timestamp (newest first)
    bugs.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      bugs,
      total: bugs.length,
      pending: bugs.filter((b: any) => b.status === 'pending').length,
    });
  } catch (error) {
    console.error('Get bugs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
