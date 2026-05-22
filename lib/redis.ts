import { createClient, type RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL;
const REDIS_TIMEOUT_MS = 5000; // Fail fast rather than blocking for minutes

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Redis operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

let _client: RedisClientType | null = null;
let _connectPromise: Promise<void> | null = null;

function getClient(): RedisClientType {
  if (!_client) {
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required for Redis operations');
    }

    _client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
      },
    }) as RedisClientType;

    _client.on('error', (err) => console.error('Redis error:', err));
  }
  return _client;
}

export async function getRedis(): Promise<RedisClientType> {
  const client = getClient();

  if (!client.isReady) {
    if (!_connectPromise) {
      _connectPromise = client.connect().then(() => {
        _connectPromise = null;
      }).catch((err) => {
        _connectPromise = null;
        console.error('Redis connection failed:', err);
        throw err;
      });
    }
    await _connectPromise;
  }

  return client;
}

// Convenience singleton for direct use (connected lazily).
// Every operation wraps with a 5-second timeout so a stalled Redis connection
// fails fast instead of hanging the request for the full Node HTTP timeout.
const t = <T>(p: Promise<T>) => withTimeout(p, REDIS_TIMEOUT_MS);
export const redis = {
  get: async (key: string) => t((await getRedis()).get(key)),
  set: async (key: string, value: string) => t((await getRedis()).set(key, value)),
  setEx: async (key: string, seconds: number, value: string) => t((await getRedis()).setEx(key, seconds, value)),
  del: async (key: string) => t((await getRedis()).del(key)),
  incr: async (key: string) => t((await getRedis()).incr(key)),
  incrBy: async (key: string, increment: number) => t((await getRedis()).incrBy(key, increment)),
  expire: async (key: string, seconds: number) => t((await getRedis()).expire(key, seconds)),
  exists: async (key: string) => t((await getRedis()).exists(key)),
  keys: async (pattern: string) => t((await getRedis()).keys(pattern)),
  hGet: async (key: string, field: string) => t((await getRedis()).hGet(key, field)),
  hSet: async (key: string, field: string, value: string) => t((await getRedis()).hSet(key, field, value)),
  hIncrBy: async (key: string, field: string, increment: number) => t((await getRedis()).hIncrBy(key, field, increment)),
  hGetAll: async (key: string) => t((await getRedis()).hGetAll(key)),
  lPush: async (key: string, ...elements: string[]) => t((await getRedis()).lPush(key, elements)),
  lRange: async (key: string, start: number, stop: number) => t((await getRedis()).lRange(key, start, stop)),
  lTrim: async (key: string, start: number, stop: number) => t((await getRedis()).lTrim(key, start, stop)),
  multi: async () => (await getRedis()).multi(),
  watch: async (...keys: string[]) => (await getRedis()).watch(keys),
  unwatch: async () => (await getRedis()).unwatch(),
};

/**
 * Execute a read-modify-write atomically using WATCH + MULTI/EXEC.
 * `fn` receives the current raw string value (or null) and returns the new
 * value to write, or null to abort the transaction without writing.
 * Retries up to `maxRetries` times on optimistic-lock conflicts.
 */
export async function atomicUpdate(
  key: string,
  fn: (current: string | null) => string | null,
  maxRetries = 5
): Promise<boolean> {
  const client = await getRedis();
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    await client.watch(key);
    const current = await client.get(key);
    const next = fn(current);
    if (next === null) {
      await client.unwatch();
      return true;
    }
    const multi = client.multi();
    multi.set(key, next);
    const results = await multi.exec();
    if (results !== null) return true; // EXEC succeeded
    // results === null means WATCH detected a change; retry
  }
  return false; // gave up after maxRetries
}
