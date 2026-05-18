import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { redis, getRedis } from '@/lib/redis';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Generate unique report ID
    const timestamp = Date.now();
    const reportId = `web_${userId}_${timestamp}`;

    // Store in Redis
    const reportData = {
      id: reportId,
      source: 'website',
      user_id: userId,
      description: description.trim(),
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    const client = await getRedis();
    await client.hSet(`bug_report:${reportId}`, reportData);
    await redis.lPush('bug_reports:queue', reportId);
    await redis.expire(`bug_report:${reportId}`, 86400 * 30); // 30 day expiry

    return NextResponse.json({
      success: true,
      id: reportId,
      message: 'Bug report submitted successfully',
    });
  } catch (error) {
    console.error('Bug report error:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's reports
    const queue = await redis.lRange('bug_reports:queue', 0, -1);
    const userReports = [];

    for (const reportId of queue) {
      const report = await redis.hGetAll(`bug_report:${reportId}`);
      if (report.user_id === userId) {
        userReports.push(report);
      }
    }

    return NextResponse.json({
      reports: userReports,
      total: userReports.length,
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
