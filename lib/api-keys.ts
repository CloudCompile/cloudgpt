import { randomBytes } from 'crypto';
import { redis } from './redis';

export interface ApiKeyData {
  userId: string;
  name: string;
  createdAt: number;
}

export function generateApiKey(): string {
  return `or_${randomBytes(16).toString('hex')}`;
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

// In-memory cache: avoids a Redis round-trip on every single API request.
// 60s TTL is short enough that deleted keys stop working quickly.
const _keyCache = new Map<string, { data: ApiKeyData; expiresAt: number }>();
const KEY_CACHE_TTL_MS = 60_000;

export async function validateApiKey(key: string): Promise<ApiKeyData | null> {
  const cached = _keyCache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const data = await redis.get(`key:${key}`);
  if (!data) {
    _keyCache.delete(key);
    return null;
  }
  try {
    const parsed = JSON.parse(data) as ApiKeyData;
    _keyCache.set(key, { data: parsed, expiresAt: Date.now() + KEY_CACHE_TTL_MS });
    return parsed;
  } catch {
    return null;
  }
}

export async function storeApiKey(
  key: string,
  userId: string,
  name: string
): Promise<void> {
  const now = Date.now();
  await redis.set(
    `key:${key}`,
    JSON.stringify({
      userId,
      name,
      createdAt: now,
    } as ApiKeyData)
  );

  const userKeysKey = `user:${userId}:keys`;
  const existingKeysStr = await redis.get(userKeysKey);
  const existingKeys = existingKeysStr ? JSON.parse(existingKeysStr) : [];
  existingKeys.push(key);
  await redis.set(userKeysKey, JSON.stringify(existingKeys));
}

export async function getUserKeys(userId: string): Promise<string[]> {
  const keysStr = await redis.get(`user:${userId}:keys`);
  return keysStr ? JSON.parse(keysStr) : [];
}

export async function deleteApiKey(key: string, userId: string): Promise<void> {
  const dataStr = await redis.get(`key:${key}`);
  if (!dataStr) {
    throw new Error('Key not found or does not belong to user');
  }

  const data = JSON.parse(dataStr) as ApiKeyData;
  if (data.userId !== userId) {
    throw new Error('Key not found or does not belong to user');
  }

  await redis.del(`key:${key}`);
  _keyCache.delete(key);

  const userKeysKey = `user:${userId}:keys`;
  const existingKeysStr = await redis.get(userKeysKey);
  const existingKeys = existingKeysStr ? JSON.parse(existingKeysStr) : [];
  const filteredKeys = existingKeys.filter((k: string) => k !== key);
  await redis.set(userKeysKey, JSON.stringify(filteredKeys));
}

export async function checkRateLimit(
  key: string,
  limit?: number
): Promise<boolean> {
  const actualLimit = limit || 60;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const rateLimitKey = `ratelimit:${key}`;

  const currentStr = await redis.get(rateLimitKey);
  const current = currentStr ? JSON.parse(currentStr) : null;

  if (!current || now > current.resetAt) {
    await redis.setEx(
      rateLimitKey,
      60,
      JSON.stringify({ count: 1, resetAt: now + windowMs })
    );
    return true;
  }

  if (current.count >= actualLimit) {
    return false;
  }

  current.count++;
  await redis.set(rateLimitKey, JSON.stringify(current));
  return true;
}

export async function getRateLimitInfo(
  key: string
): Promise<{ remaining: number; resetAt: number }> {
  const currentStr = await redis.get(`ratelimit:${key}`);
  const current = currentStr ? JSON.parse(currentStr) : null;
  const limit = 60;

  if (!current) {
    return { remaining: limit, resetAt: Date.now() + 60000 };
  }

  return {
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}
