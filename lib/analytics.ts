import { redis } from './redis';

function inferProvider(model: string): string {
  if (model.startsWith('pollinations/')) return 'Pollinations';
  if (model.startsWith('voidai/')) return 'VoidAI';
  if (model.startsWith('airforce/')) return 'Airforce';
  if (model.startsWith('cerebras/')) return 'Cerebras';
  if (model.startsWith('groq/')) return 'Groq';
  if (model.startsWith('aihorde/')) return 'AIHorde';
  return 'AIHubMix';
}

export async function trackRequest(model: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const provider = inferProvider(model);

  await redis.incr(`analytics:req:total:${today}`);
  await redis.expire(`analytics:req:total:${today}`, 172800);

  await redis.hIncrBy(`analytics:req:model:${today}`, model, 1);
  await redis.expire(`analytics:req:model:${today}`, 172800);

  await redis.hIncrBy(`analytics:req:provider:${today}`, provider, 1);
  await redis.expire(`analytics:req:provider:${today}`, 172800);
}

export async function trackUserRequest(userId: string, model: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await redis.incr(`analytics:user:req:${userId}:${today}`);
  await redis.expire(`analytics:user:req:${userId}:${today}`, 172800);
  await redis.incr(`analytics:user:req:${userId}:total`);
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

export async function getSystemAnalytics(): Promise<{
  requestsToday: number;
  topModels: Array<{ model: string; count: number }>;
  providerBreakdown: Record<string, number>;
  tokensToday: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  const totalStr = await redis.get(`analytics:req:total:${today}`);
  const requestsToday = totalStr ? (parseInt(totalStr, 10) || 0) : 0;

  const modelHash = await redis.hGetAll(`analytics:req:model:${today}`);
  const topModels = Object.entries(modelHash)
    .map(([model, count]) => ({ model, count: parseInt(count, 10) || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const providerHash = await redis.hGetAll(`analytics:req:provider:${today}`);
  const providerBreakdown: Record<string, number> = Object.fromEntries(
    Object.entries(providerHash).map(([k, v]) => [k, parseInt(v, 10) || 0])
  );

  let tokensToday = 0;
  for (let i = 0; i < 10; i++) {
    const tokenStr = await redis.get(`cerebras:${i}:tokens:${today}`);
    if (tokenStr) tokensToday += (parseInt(tokenStr, 10) || 0);
  }

  return { requestsToday, topModels, providerBreakdown, tokensToday };
}
