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
