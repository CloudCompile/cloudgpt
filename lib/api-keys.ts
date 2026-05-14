import { kv } from '@vercel/kv';

export interface ApiKeyData {
  userId: string;
  name: string;
  createdAt: number;
}

function randomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateApiKey(): string {
  return `or_${randomHex(32)}`;
}

export function extractApiKey(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.substring(7);
    if (key.startsWith('or_') && key.length === 35) {
      return key;
    }
  }
  return null;
}

export async function validateApiKey(key: string): Promise<ApiKeyData | null> {
  const data = await kv.get<ApiKeyData>(`key:${key}`);
  return data || null;
}

export async function storeApiKey(
  key: string,
  userId: string,
  name: string
): Promise<void> {
  const now = Date.now();
  await kv.set(`key:${key}`, {
    userId,
    name,
    createdAt: now,
  } as ApiKeyData);

  const userKeysKey = `user:${userId}:keys`;
  const existingKeys = (await kv.get<string[]>(userKeysKey)) || [];
  existingKeys.push(key);
  await kv.set(userKeysKey, existingKeys);
}

export async function getUserKeys(userId: string): Promise<string[]> {
  const keys = await kv.get<string[]>(`user:${userId}:keys`);
  return keys || [];
}

export async function deleteApiKey(key: string, userId: string): Promise<void> {
  const data = await kv.get<ApiKeyData>(`key:${key}`);
  if (!data || data.userId !== userId) {
    throw new Error('Key not found or does not belong to user');
  }

  await kv.del(`key:${key}`);

  const userKeysKey = `user:${userId}:keys`;
  const existingKeys = (await kv.get<string[]>(userKeysKey)) || [];
  const filteredKeys = existingKeys.filter((k) => k !== key);
  await kv.set(userKeysKey, filteredKeys);
}

export async function checkRateLimit(
  key: string,
  limit?: number
): Promise<boolean> {
  // If no limit specified, use default of 60
  const actualLimit = limit || 60;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const rateLimitKey = `ratelimit:${key}`;

  const current = await kv.get<{ count: number; resetAt: number }>(
    rateLimitKey
  );

  if (!current || now > current.resetAt) {
    await kv.setex(rateLimitKey, 60, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= actualLimit) {
    return false;
  }

  current.count++;
  await kv.set(rateLimitKey, current);
  return true;
}

export async function getRateLimitInfo(
  key: string
): Promise<{ remaining: number; resetAt: number }> {
  const current = await kv.get<{ count: number; resetAt: number }>(
    `ratelimit:${key}`
  );
  const limit = 60;

  if (!current) {
    return { remaining: limit, resetAt: Date.now() + 60000 };
  }

  return {
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}
