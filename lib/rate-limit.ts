import { redis } from './redis';

/**
 * Simple rate limiting for API endpoints and provider keys.
 * Uses sliding window approach with Redis.
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
};

/**
 * Check if a request should be rate limited.
 * Returns { allowed: true/false, remaining: number, resetAt: timestamp }
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  try {
    // Use Redis with sliding window
    const current = await redis.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= config.maxRequests) {
      // Check expiration
      const ttl = await redis.exists(key);
      if (ttl) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: now + config.windowMs,
        };
      }
    }

    // Increment and set expiration
    await redis.incr(key);
    await redis.expire(key, Math.ceil(config.windowMs / 1000));

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - count - 1),
      resetAt: now + config.windowMs,
    };
  } catch (e) {
    console.warn('Rate limit check failed:', e);
    // On Redis failure, allow the request (fail open)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }
}

/**
 * Create a rate limit middleware for API routes.
 * Usage: const limiter = createRateLimiter('endpoint', config);
 */
export function createRateLimiter(
  name: string,
  config: RateLimitConfig = DEFAULT_CONFIG
) {
  return async (identifier: string) => {
    return checkRateLimit(`${name}:${identifier}`, config);
  };
}

/**
 * Get the current usage for an identifier (useful for monitoring).
 */
export async function getCurrentUsage(identifier: string): Promise<number> {
  try {
    const key = `ratelimit:${identifier}`;
    const current = await redis.get(key);
    return current ? parseInt(current) : 0;
  } catch {
    return 0;
  }
}

/**
 * Reset rate limit for an identifier (useful for cleanup).
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  try {
    const key = `ratelimit:${identifier}`;
    await redis.del(key);
  } catch (e) {
    console.error(`Failed to reset rate limit for ${identifier}:`, e);
  }
}
