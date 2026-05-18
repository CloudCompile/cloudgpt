import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserKeys, validateApiKey } from '@/lib/api-keys';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const keyIds = await getUserKeys(userId);
    const keys = [];

    for (const keyId of keyIds) {
      const data = await validateApiKey(keyId);
      if (data) {
        keys.push({
          id: keyId,
          name: data.name,
          createdAt: data.createdAt,
        });
      }
    }

    return NextResponse.json({ keys });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
