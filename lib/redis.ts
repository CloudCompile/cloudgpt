import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is required');
}

const client = createClient({
  url: redisUrl,
});

// Connect to Redis
client.connect().catch((err) => {
  console.error('Failed to connect to Redis:', err);
});

// Handle connection errors
client.on('error', (err) => {
  console.error('Redis error:', err);
});

export const redis = client;
