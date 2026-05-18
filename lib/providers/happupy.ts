import { redis } from '@/lib/redis';
import { getNextKey } from './keypool';

/**
 * Happupy provider - free AI API gateway
 * Base URL: https://beta.hapuppy.com
 * OpenAI compatible at v1/chat/completions
 * Limit: 100k tokens per 24 hours on free account
 */

const HAPPUPY_URL = 'https://beta.hapuppy.com';
const DAILY_TOKEN_LIMIT = 100000;

export interface HappupyOptions {
  streaming?: boolean;
}

export async function forwardHappupy(
  endpoint: string,
  method: string,
  body?: unknown,
  options?: HappupyOptions
) {
  const apiKey = await getNextKey('happupy');
  if (!apiKey) {
    throw new Error('No Happupy API key configured');
  }

  const url = `${HAPPUPY_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return response;
}

/**
 * Track token usage for Happupy (free tier: 100k/day)
 * Returns true if request should be allowed, false if limit exceeded
 */
export async function checkHappupyTokenBudget(estimatedTokens: number): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `happupy:tokens:used:${today}`;

    const usedStr = await redis.get(key);
    const used = usedStr ? parseInt(usedStr, 10) : 0;

    if (used + estimatedTokens > DAILY_TOKEN_LIMIT) {
      return false; // Budget exceeded
    }

    return true;
  } catch {
    // If tracking fails, allow the request (optimistic)
    return true;
  }
}

/**
 * Record token usage for Happupy
 */
export async function recordHappupyTokens(tokens: number): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `happupy:tokens:used:${today}`;

    await redis.incrBy(key, tokens);
    await redis.expire(key, 86400); // 24 hour expiry
  } catch (e) {
    console.error('Failed to record Happupy token usage:', e);
  }
}

/**
 * Get current Happupy token usage for today
 */
export async function getHappupyTokenUsage(): Promise<{ used: number; limit: number; remaining: number }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `happupy:tokens:used:${today}`;

    const usedStr = await redis.get(key);
    const used = usedStr ? parseInt(usedStr, 10) : 0;

    return {
      used,
      limit: DAILY_TOKEN_LIMIT,
      remaining: Math.max(0, DAILY_TOKEN_LIMIT - used),
    };
  } catch {
    return { used: 0, limit: DAILY_TOKEN_LIMIT, remaining: DAILY_TOKEN_LIMIT };
  }
}
