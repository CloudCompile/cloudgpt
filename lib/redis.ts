import { createClient, type RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL;

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

// Convenience singleton for direct use (connected lazily)
export const redis = {
  get: async (key: string) => (await getRedis()).get(key),
  set: async (key: string, value: string) => (await getRedis()).set(key, value),
  setEx: async (key: string, seconds: number, value: string) => (await getRedis()).setEx(key, seconds, value),
  del: async (key: string) => (await getRedis()).del(key),
  incr: async (key: string) => (await getRedis()).incr(key),
  incrBy: async (key: string, increment: number) => (await getRedis()).incrBy(key, increment),
  expire: async (key: string, seconds: number) => (await getRedis()).expire(key, seconds),
  exists: async (key: string) => (await getRedis()).exists(key),
  keys: async (pattern: string) => (await getRedis()).keys(pattern),
  hGet: async (key: string, field: string) => (await getRedis()).hGet(key, field),
  hSet: async (key: string, field: string, value: string) => (await getRedis()).hSet(key, field, value),
  hGetAll: async (key: string) => (await getRedis()).hGetAll(key),
  lPush: async (key: string, ...elements: string[]) => (await getRedis()).lPush(key, elements),
  lRange: async (key: string, start: number, stop: number) => (await getRedis()).lRange(key, start, stop),
};
