import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getContributorKeyRefs, isContributor } from '@/lib/contributor';
import { getRecentErrors } from '@/lib/analytics';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contributor = await isContributor(userId);
  if (!contributor) return NextResponse.json({ error: 'Not a contributor' }, { status: 403 });

  const today = new Date().toISOString().split('T')[0];

  const totalStr = await redis.get(`analytics:req:total:${today}`);
  const requestsToday = totalStr ? (parseInt(totalStr, 10) || 0) : 0;

  const refs = await getContributorKeyRefs(userId);
  const contributedProviders = [...new Set(refs.map(r => r.provider))];

  const providerHash = (await redis.hGetAll(`analytics:req:provider:${today}`)) ?? {};
  const providerBreakdown: Record<string, number> = {};
  for (const prov of contributedProviders) {
    providerBreakdown[prov] = parseInt(providerHash[prov] ?? '0', 10) || 0;
  }

  const recentErrors = await getRecentErrors(5);

  // Discord status
  let discordConnected = false;
  const discordRoleAssignedStr = await redis.get(`contributor:discord:${userId}`);
  const discordRoleAssigned = discordRoleAssignedStr === '1';

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    discordConnected = user.externalAccounts.some(a => a.provider === 'oauth_discord');
  } catch {
    // Non-fatal — just hide Discord section
  }

  return NextResponse.json({
    requestsToday,
    contributedProviders,
    providerBreakdown,
    recentErrors,
    discordConnected,
    discordRoleAssigned,
  });
}
