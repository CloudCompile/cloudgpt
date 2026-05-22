import { redis, atomicUpdate } from './redis';

export interface ContributorKeyRef {
  provider: string;
  keyId: string;
}

export async function getContributorKeyRefs(userId: string): Promise<ContributorKeyRef[]> {
  try {
    const json = await redis.get(`contributor:keys:${userId}`);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function addContributorKeyRef(userId: string, provider: string, keyId: string): Promise<void> {
  const redisKey = `contributor:keys:${userId}`;
  const ok = await atomicUpdate(redisKey, (current) => {
    const refs: ContributorKeyRef[] = current ? JSON.parse(current) : [];
    refs.push({ provider, keyId });
    return JSON.stringify(refs);
  });
  if (!ok) throw new Error(`Failed to atomically add contributor key ref for ${userId}`);
}

export async function removeContributorKeyRef(userId: string, keyId: string): Promise<void> {
  const redisKey = `contributor:keys:${userId}`;
  await atomicUpdate(redisKey, (current) => {
    const refs: ContributorKeyRef[] = current ? JSON.parse(current) : [];
    const filtered = refs.filter(r => r.keyId !== keyId);
    return JSON.stringify(filtered);
  });
}

export async function isContributor(userId: string): Promise<boolean> {
  const refs = await getContributorKeyRefs(userId);
  return refs.length > 0;
}

export async function assignDiscordRole(discordUserId: string, userId: string): Promise<boolean> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_CONTRIBUTOR_ROLE_ID;

  if (!botToken || !guildId || !roleId) return false;

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
          'X-Audit-Log-Reason': 'OpenRelay contributor key donation',
        },
      }
    );
    const success = res.ok || res.status === 204;
    if (success) {
      await redis.set(`contributor:discord:${userId}`, '1');
    }
    return success;
  } catch (e) {
    console.error('Discord role assignment error:', e);
    return false;
  }
}
