import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserAnalytics } from '@/lib/analytics';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const analytics = await getUserAnalytics(userId);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('User analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
