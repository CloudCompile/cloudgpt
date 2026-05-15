import { redis } from './redis';

function inferProvider(model: string): string {
  if (model.startsWith('pollinations/')) return 'Pollinations';
  if (model.startsWith('voidai/')) return 'VoidAI';
  if (model.startsWith('airforce/')) return 'Airforce';
  if (model.startsWith('cerebras/')) return 'Cerebras';
  return 'AIHubMix';
}

export async function trackRequest(model: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const provider = inferProvider(model);

  await redis.incr(`analytics:req:total:${today}`);
  await redis.expire(`analytics:req:total:${today}`, 172800);

  const modelKey = `analytics:req:model:${today}`;
  const modelDataStr = await redis.get(modelKey);
  const modelData: Record<string, number> = modelDataStr ? JSON.parse(modelDataStr) : {};
  modelData[model] = (modelData[model] || 0) + 1;
  await redis.set(modelKey, JSON.stringify(modelData));
  await redis.expire(modelKey, 172800);

  const providerKey = `analytics:req:provider:${today}`;
  const providerDataStr = await redis.get(providerKey);
  const providerData: Record<string, number> = providerDataStr ? JSON.parse(providerDataStr) : {};
  providerData[provider] = (providerData[provider] || 0) + 1;
  await redis.set(providerKey, JSON.stringify(providerData));
  await redis.expire(providerKey, 172800);
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
  const todayCount = todayStr ? parseInt(todayStr) : 0;

  let weekCount = 0;
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayStr = await redis.get(`analytics:user:req:${userId}:${dateStr}`);
    weekCount += dayStr ? parseInt(dayStr) : 0;
  }

  const totalStr = await redis.get(`analytics:user:req:${userId}:total`);
  const total = totalStr ? parseInt(totalStr) : 0;

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
  const requestsToday = totalStr ? parseInt(totalStr) : 0;

  const modelDataStr = await redis.get(`analytics:req:model:${today}`);
  const modelData: Record<string, number> = modelDataStr ? JSON.parse(modelDataStr) : {};
  const topModels = Object.entries(modelData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([model, count]) => ({ model, count }));

  const providerDataStr = await redis.get(`analytics:req:provider:${today}`);
  const providerBreakdown: Record<string, number> = providerDataStr
    ? JSON.parse(providerDataStr)
    : {};

  let tokensToday = 0;
  for (let i = 0; i < 10; i++) {
    const tokenStr = await redis.get(`cerebras:${i}:tokens:${today}`);
    if (tokenStr) tokensToday += parseInt(tokenStr);
  }

  return { requestsToday, topModels, providerBreakdown, tokensToday };
}
