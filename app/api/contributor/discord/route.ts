import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isContributor, assignDiscordRole } from '@/lib/contributor';

export const runtime = 'nodejs';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contributor = await isContributor(userId);
  if (!contributor) return NextResponse.json({ error: 'Not a contributor' }, { status: 403 });

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const discordAccount = user.externalAccounts.find(a => a.provider === 'oauth_discord');

    if (!discordAccount?.externalId) {
      return NextResponse.json({ error: 'Discord not connected to your account' }, { status: 400 });
    }

    const success = await assignDiscordRole(discordAccount.externalId, userId);
    return NextResponse.json({ success });
  } catch (e) {
    console.error('Discord role assignment error:', e);
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 });
  }
}
