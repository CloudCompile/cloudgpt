import { redis } from './redis';

/**
 * Response cache for expensive operations like model listings.
 * Caches JSON responses in Redis with automatic expiration.
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 300)
  compress?: boolean; // Compress large responses (default: true)
}

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  ttl: 300, // 5 minutes
  compress: true,
};

/**
 * Get a cached response.
 */
export async function getCachedResponse<T>(
  key: string
): Promise<T | null> {
  try {
    const cached = await redis.get(`cache:${key}`);
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (e) {
    console.warn(`Failed to get cached response for ${key}:`, e);
    return null;
  }
}

/**
 * Set a cached response.
 */
export async function setCachedResponse<T>(
  key: string,
  response: T,
  options: CacheOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const cached = JSON.stringify(response);
    await redis.setEx(`cache:${key}`, opts.ttl, cached);
  } catch (e) {
    console.warn(`Failed to cache response for ${key}:`, e);
  }
}

/**
 * Delete a cached response.
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(`cache:${key}`);
  } catch (e) {
    console.warn(`Failed to invalidate cache for ${key}:`, e);
  }
}

/**
 * Get or compute a cached response.
 * If cached, returns immediately. Otherwise, computes and caches.
 */
export async function getCachedOrCompute<T>(
  key: string,
  compute: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = await getCachedResponse<T>(key);
  if (cached) return cached;

  // Compute and cache
  const result = await compute();
  await setCachedResponse(key, result, options);
  return result;
}

/**
 * Invalidate multiple cache keys matching a pattern.
 */
export async function invalidateCachePattern(
  pattern: string
): Promise<number> {
  try {
    const keys = await redis.keys(`cache:${pattern}`);
    if (keys.length === 0) return 0;

    for (const key of keys) {
      await redis.del(key);
    }
    return keys.length;
  } catch (e) {
    console.warn(`Failed to invalidate cache pattern ${pattern}:`, e);
    return 0;
  }
}

/**
 * Get cache statistics (for monitoring).
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  estimatedSize: number;
}> {
  try {
    const keys = await redis.keys('cache:*');
    return {
      totalKeys: keys.length,
      estimatedSize: keys.length * 100, // Rough estimate
    };
  } catch {
    return { totalKeys: 0, estimatedSize: 0 };
  }
}
