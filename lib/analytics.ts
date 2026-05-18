import { redis } from './redis';

function inferProvider(model: string): string {
  if (model.startsWith('pollinations/')) return 'Pollinations';
  if (model.startsWith('voidai/')) return 'VoidAI';
  if (model.startsWith('airforce/')) return 'Airforce';
  if (model.startsWith('cerebras/')) return 'Cerebras';
  if (model.startsWith('groq/')) return 'Groq';
  if (model.startsWith('aihorde/')) return 'AIHorde';
  if (model.startsWith('tokenreply/')) return 'TokenReply';
  if (model.startsWith('nagaai/')) return 'NagaAI';
  if (model.startsWith('happupy/')) return 'Happupy';
  return 'Pollinations';
}

export async function trackRequest(model: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const provider = inferProvider(model);

  const pipeline = await redis.multi();
  pipeline.incr(`analytics:req:total:${today}`);
  pipeline.expire(`analytics:req:total:${today}`, 172800);
  pipeline.hIncrBy(`analytics:req:model:${today}`, model, 1);
  pipeline.expire(`analytics:req:model:${today}`, 172800);
  pipeline.hIncrBy(`analytics:req:provider:${today}`, provider, 1);
  pipeline.expire(`analytics:req:provider:${today}`, 172800);
  await pipeline.exec();
}

export async function trackUserRequest(userId: string, model: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const pipeline = await redis.multi();
  pipeline.incr(`analytics:user:req:${userId}:${today}`);
  pipeline.expire(`analytics:user:req:${userId}:${today}`, 172800);
  pipeline.incr(`analytics:user:req:${userId}:total`);
  if (model) {
    pipeline.hIncrBy(`analytics:user:model:${userId}:${today}`, model, 1);
    pipeline.expire(`analytics:user:model:${userId}:${today}`, 172800);
  }
  await pipeline.exec();
}

export async function getUserRequestStats(userId: string): Promise<{
  today: number;
  week: number;
  total: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  const todayStr = await redis.get(`analytics:user:req:${userId}:${today}`);
  const todayCount = todayStr ? (parseInt(todayStr, 10) || 0) : 0;

  let weekCount = 0;
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayStr = await redis.get(`analytics:user:req:${userId}:${dateStr}`);
    weekCount += dayStr ? (parseInt(dayStr, 10) || 0) : 0;
  }

  const totalStr = await redis.get(`analytics:user:req:${userId}:total`);
  const total = totalStr ? (parseInt(totalStr, 10) || 0) : 0;

  return { today: todayCount, week: weekCount, total };
}

export async function getUserAnalytics(userId: string): Promise<{
  requests: { today: number; week: number; total: number };
  topModels: Array<{ model: string; count: number }>;
}> {
  const today = new Date().toISOString().split('T')[0];
  const requests = await getUserRequestStats(userId);

  let topModels: Array<{ model: string; count: number }> = [];
  try {
    const modelHash = (await redis.hGetAll(`analytics:user:model:${userId}:${today}`)) ?? {};
    topModels = Object.entries(modelHash)
      .map(([model, count]) => ({ model, count: parseInt(count as string, 10) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch { /* key type mismatch — skip */ }

  return { requests, topModels };
}

export async function getSystemAnalytics(): Promise<{
  requestsToday: number;
  topModels: Array<{ model: string; count: number }>;
  providerBreakdown: Record<string, number>;
  tokensToday: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  let requestsToday = 0;
  try {
    const totalStr = await redis.get(`analytics:req:total:${today}`);
    requestsToday = totalStr ? (parseInt(totalStr, 10) || 0) : 0;
  } catch { /* key type mismatch — skip */ }

  let topModels: Array<{ model: string; count: number }> = [];
  try {
    const modelHash = (await redis.hGetAll(`analytics:req:model:${today}`)) ?? {};
    topModels = Object.entries(modelHash)
      .map(([model, count]) => ({ model, count: parseInt(count, 10) || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  } catch { /* key type mismatch — skip */ }

  let providerBreakdown: Record<string, number> = {};
  try {
    const providerHash = (await redis.hGetAll(`analytics:req:provider:${today}`)) ?? {};
    providerBreakdown = Object.fromEntries(
      Object.entries(providerHash).map(([k, v]) => [k, parseInt(v, 10) || 0])
    );
  } catch { /* key type mismatch — skip */ }

  let tokensToday = 0;
  for (let i = 0; i < 10; i++) {
    try {
      const tokenStr = await redis.get(`cerebras:${i}:tokens:${today}`);
      if (tokenStr) tokensToday += (parseInt(tokenStr, 10) || 0);
    } catch { /* key type mismatch — skip */ }
  }

  return { requestsToday, topModels, providerBreakdown, tokensToday };
}

export async function logError(provider: string, message: string): Promise<void> {
  try {
    const entry = JSON.stringify({ provider, message, ts: Date.now() });
    await redis.lPush('errors:recent', entry);
    await redis.lTrim('errors:recent', 0, 19);
  } catch (e) {
    console.error('Failed to log error to Redis:', e);
  }
}

export async function getRecentErrors(limit = 5): Promise<Array<{ provider: string; message: string; ts: number }>> {
  try {
    const entries = await redis.lRange('errors:recent', 0, limit - 1);
    return entries
      .map(e => { try { return JSON.parse(e); } catch { return null; } })
      .filter(Boolean);
  } catch {
    return [];
  }
}
