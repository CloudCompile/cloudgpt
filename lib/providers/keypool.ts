import { redis } from '../redis';

/**
 * Dynamic key pool system that automatically scales rate limits
 * based on the number of available keys per provider.
 *
 * Env vars pattern: {PROVIDER}_KEY_1, {PROVIDER}_KEY_2, etc.
 * Examples:
 *   AIHUBMIX_KEY_1=sk_...
 *   POLLINATIONS_KEY_1=sk_...
 *   POLLINATIONS_KEY_2=sk_...
 */

export async function getKeysForProvider(providerName: string): Promise<string[]> {
  const keys: string[] = [];
  const prefix = `${providerName.toUpperCase()}_KEY_`;

  // Read environment variables
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`${prefix}${i}`];
    if (key) {
      keys.push(key);
    }
  }

  return keys;
}

export async function getNextKey(providerName: string): Promise<string | null> {
  const keys = await getKeysForProvider(providerName);

  if (keys.length === 0) {
    return null;
  }

  const indexKey = `pool:${providerName.toLowerCase()}:index`;
  const indexStr = await redis.get(indexKey);
  const currentIndex = indexStr ? parseInt(indexStr) : 0;
  const nextIndex = (currentIndex + 1) % keys.length;

  await redis.set(indexKey, nextIndex.toString());

  return keys[currentIndex];
}

export async function getRateLimitForProvider(
  providerName: string
): Promise<number> {
  const keys = await getKeysForProvider(providerName);
  const baseLimit = 60; // requests per minute per key
  return baseLimit * Math.max(1, keys.length);
}

export async function getProviderKeyCount(providerName: string): Promise<number> {
  const keys = await getKeysForProvider(providerName);
  return keys.length;
}

/**
 * Track token usage for a provider key for daily limits
 * @param providerName - Provider name (e.g., "cerebras")
 * @param keyIndex - 0-based index of the key in the pool
 * @param tokens - Number of tokens to add
 */
export async function trackTokensUsed(
  providerName: string,
  keyIndex: number,
  tokens: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const key = `${providerName.toLowerCase()}:${keyIndex}:tokens:${today}`;

  const current = await redis.get(key);
  const used = current ? parseInt(current) : 0;
  const newTotal = used + tokens;

  await redis.set(key, newTotal.toString());

  // Set expiry to 48 hours to auto-clean old entries
  await redis.expire(key, 172800);
}

/**
 * Get remaining daily tokens for a provider key
 * @param providerName - Provider name (e.g., "cerebras")
 * @param keyIndex - 0-based index of the key in the pool
 * @param dailyLimit - Daily token limit (default 1M for Cerebras)
 * @returns Number of tokens remaining before hitting limit
 */
export async function getRemainingDailyTokens(
  providerName: string,
  keyIndex: number,
  dailyLimit: number = 1000000
): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const key = `${providerName.toLowerCase()}:${keyIndex}:tokens:${today}`;

  const current = await redis.get(key);
  const used = current ? parseInt(current) : 0;

  return Math.max(0, dailyLimit - used);
}
