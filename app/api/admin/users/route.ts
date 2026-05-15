import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { checkAdmin } from '@/lib/admin';
import { getUserKeys, deleteApiKey, validateApiKey } from '@/lib/api-keys';
import { getUserRequestStats } from '@/lib/analytics';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';

async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const isAdmin = await checkAdmin(userId);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return { userId };
}

// GET /api/admin/users — list all Clerk users with key counts and usage stats
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';

  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({ limit: 100 });

    const result = await Promise.all(
      users.map(async (user) => {
        const primaryEmail = user.emailAddresses.find(
          (e) => e.id === user.primaryEmailAddressId
        )?.emailAddress || '';
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown';

        const keyIds = await getUserKeys(user.id);
        const stats = await getUserRequestStats(user.id);

        return {
          id: user.id,
          email: primaryEmail,
          name,
          createdAt: user.createdAt,
          apiKeyCount: keyIds.length,
          requestsToday: stats.today,
          requestsWeek: stats.week,
          requestsTotal: stats.total,
        };
      })
    );

    // Filter by search if provided
    const filtered = search
      ? result.filter(
          (u) =>
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.name.toLowerCase().includes(search.toLowerCase())
        )
      : result;

    return NextResponse.json({ users: filtered });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users — revoke all API keys for a user
export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { userId: targetUserId } = await request.json();
  if (!targetUserId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    const keyIds = await getUserKeys(targetUserId);
    let deleted = 0;

    for (const keyId of keyIds) {
      const keyData = await validateApiKey(keyId);
      if (keyData) {
        await redis.del(`key:${keyId}`);
        deleted++;
      }
    }

    // Clear the user's key list
    await redis.del(`user:${targetUserId}:keys`);

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('Revoke keys error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke keys' },
      { status: 500 }
    );
  }
}
