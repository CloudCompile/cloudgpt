import { redis } from '../redis';
import { decryptKey } from '../crypto';

/**
 * Dynamic key pool system with aggressive in-memory caching for Vercel free tier.
 * Minimizes Redis calls while maintaining consistency.
 *
 * Env vars pattern: {PROVIDER}_KEY_1, {PROVIDER}_KEY_2, etc.
 * KV keys stored by admin: admin:provider:keys:{provider} → JSON array of ProviderKeyEntry
 */

export interface ProviderKeyEntry {
  id: string;
  encryptedKey: string;
  preview: string;
  createdAt: number;
  donorId?: string;
  tier?: string; // For tiered providers like Pollinations (e.g., 'Seed', 'Flower')
}

// In-memory cache: provider name → { keys, timestamp, version }
const _keyCache = new Map<string, {
  keys: string[];
  timestamp: number;
  version: number;
}>();

// Local rotation counters to avoid Redis hit on every request
const _localCounters = new Map<string, number>();

// Track Redis version to invalidate local cache on key changes
let _redisVersion = 0;
const CACHE_TTL = 60_000; // 60 seconds - long enough to reduce Redis calls, short enough for consistency

/**
 * Check if Redis was updated (new keys added). Called periodically.
 * Returns true if cache should be invalidated.
 */
async function checkRedisVersion(): Promise<boolean> {
  try {
    const currentVersion = await redis.get('keypool:version');
    const newVersion = currentVersion ? parseInt(currentVersion) : 0;
    if (newVersion > _redisVersion) {
      _redisVersion = newVersion;
      _keyCache.clear();
      return true;
    }
  } catch {
    // Fail silently - version check is optional
  }
  return false;
}

/**
 * Increment Redis version to signal cache invalidation.
 * Called when keys are added/removed.
 */
export async function invalidateKeyCache(): Promise<void> {
  try {
    _redisVersion = await redis.incr('keypool:version') as any;
    _keyCache.clear();
    _localCounters.clear();
  } catch (e) {
    console.error('Failed to invalidate key cache:', e);
  }
}

export async function getKeysForProvider(providerName: string): Promise<string[]> {
  const now = Date.now();
  const cached = _keyCache.get(providerName);

  // Check memory cache first
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.keys;
  }

  // Check if Redis was updated
  await checkRedisVersion();

  const keys: string[] = [];
  const prefix = `${providerName.toUpperCase()}_KEY_`;

  // 1. Read environment variables (fast, no I/O)
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`${prefix}${i}`];
    if (key) keys.push(key);
  }

  // 2. Read KV-stored keys (community contributions)
  const encKey = process.env.ENCRYPTION_KEY;
  if (encKey) {
    try {
      const listJson = await redis.get(
        `admin:provider:keys:${providerName.toLowerCase()}`
      );
      if (listJson) {
        const entries: ProviderKeyEntry[] = JSON.parse(listJson);
        for (const entry of entries) {
          try {
            keys.push(decryptKey(entry.encryptedKey, encKey));
          } catch (e) {
            console.error(`Failed to decrypt provider key ${entry.id}:`, e);
          }
        }
      }
    } catch (e) {
      console.error(`Failed to fetch KV keys for ${providerName}:`, e);
    }
  }

  // Cache in memory
  _keyCache.set(providerName, {
    keys,
    timestamp: now,
    version: _redisVersion,
  });

  return keys;
}

export async function getNextKey(providerName: string): Promise<string | null> {
  const keys = await getKeysForProvider(providerName);

  if (keys.length === 0) {
    return null;
  }

  // Use atomic INCR for global consistency, but round-robin locally when possible
  const indexKey = `pool:${providerName.toLowerCase()}:index`;

  try {
    const counter = await redis.incr(indexKey);
    const index = (counter - 1) % keys.length;
    return keys[index];
  } catch (e) {
    // Fallback to local counter if Redis unavailable
    console.warn(`Redis incr failed for ${indexKey}, using local counter:`, e);
    const local = (_localCounters.get(indexKey) ?? 0) + 1;
    _localCounters.set(indexKey, local);
    const index = (local - 1) % keys.length;
    return keys[index];
  }
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

  await redis.incrBy(key, tokens);
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
