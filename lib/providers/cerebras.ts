import { getNextKey } from './keypool';
import { redis } from '../redis';

/**
 * Cerebras provider implementation
 * 100% OpenAI compatible API at https://api.cerebras.ai/v1
 * Free tier: 1M tokens/day per key
 * Models: llama-3.3-70b, llama-4-scout, deepseek-r1 (text only)
 */

export interface CerebrasOptions {
  streaming?: boolean;
}

async function getKeyIndexForCerebras(
  providedKey?: string
): Promise<{ key: string; index: number }> {
  const keys = [];
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`CEREBRAS_KEY_${i}`];
    if (key) {
      keys.push(key);
    }
  }

  if (keys.length === 0) {
    throw new Error('No Cerebras API keys configured');
  }

  // Atomic INCR to avoid race condition under concurrent requests
  const indexKey = `pool:cerebras:index`;
  const counter = await redis.incr(indexKey);
  const currentIndex = (counter - 1) % keys.length;

  return {
    key: keys[currentIndex],
    index: currentIndex,
  };
}

async function checkAndRotateKeyOnDailyLimit(
  keyIndex: number
): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const tokenKey = `cerebras:${keyIndex}:tokens:${today}`;
  const tokensUsed = await redis.get(tokenKey);
  const used = tokensUsed ? parseInt(tokensUsed) : 0;

  if (used >= 1000000) {
    return true; // Daily limit hit, should rotate
  }

  return false;
}

async function trackTokens(
  keyIndex: number,
  promptTokens: number,
  completionTokens: number
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const tokenKey = `cerebras:${keyIndex}:tokens:${today}`;
  const totalTokens = promptTokens + completionTokens;

  const current = await redis.get(tokenKey);
  const used = current ? parseInt(current) : 0;
  const newTotal = used + totalTokens;

  await redis.set(tokenKey, newTotal.toString());

  // Set expiry to 48 hours to auto-clean old entries
  await redis.expire(tokenKey, 172800);
}

export async function forwardCerebras(
  endpoint: string,
  method: string,
  body?: unknown,
  options?: CerebrasOptions
) {
  const { key, index } = await getKeyIndexForCerebras();

  // Check if this key has hit daily limit
  const hitLimit = await checkAndRotateKeyOnDailyLimit(index);
  if (hitLimit) {
    throw new Error(
      'Daily token limit (1M tokens/day) exceeded for all Cerebras keys'
    );
  }

  const url = `https://api.cerebras.ai/v1${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  // Track tokens if chat completion was successful
  if (response.ok && endpoint === '/chat/completions') {
    const cloned = response.clone();
    try {
      const responseBody = await response.json();
      const usage = responseBody.usage;
      if (usage && usage.prompt_tokens !== undefined && usage.completion_tokens !== undefined) {
        await trackTokens(index, usage.prompt_tokens, usage.completion_tokens);
      }

      // Return a new Response with the body since we already consumed it
      return new Response(JSON.stringify(responseBody), {
        status: response.status,
        headers: response.headers,
      });
    } catch (e) {
      // If tracking fails, still return success (don't break the request)
      return cloned;
    }
  }

  return response;
}
