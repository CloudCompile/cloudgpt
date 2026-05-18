import { NextRequest, NextResponse } from 'next/server';
import {
  getPendingBugs,
  classifyBugs,
  sendBugDigestEmail,
  triggerClaudeCodeRoutine,
  markBugsAsProcessed,
} from '@/lib/bug-reporting';

export const runtime = 'nodejs';

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bugs = await getPendingBugs();

    if (bugs.length < 5) {
      return NextResponse.json({
        message: `Only ${bugs.length} bugs pending (need 5+)`,
        status: 'waiting',
      });
    }

    // Classify bugs
    const classified = await classifyBugs(bugs);
    if (classified.length === 0) {
      return NextResponse.json(
        { error: 'Failed to classify bugs' },
        { status: 500 }
      );
    }

    // Send email digest
    const adminEmail = process.env.ADMIN_EMAIL || 'cj@openrelay.dev';
    const emailSent = await sendBugDigestEmail(adminEmail, classified);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Mark as processed
    await markBugsAsProcessed(bugs.map(b => b.id));

    return NextResponse.json({
      message: `Digest sent for ${bugs.length} bugs`,
      status: 'email_sent',
      bugs: classified,
    });
  } catch (error) {
    console.error('Cron bug digest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
