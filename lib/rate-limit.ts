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
    // Atomic: INCR first, then set expiry only on first request in window.
    // This avoids the GET+INCR race and the redis.exists-as-TTL bug.
    const windowSecs = Math.ceil(config.windowMs / 1000);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSecs);
    }

    if (count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + config.windowMs,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - count),
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
