import { redis } from './redis';

/**
 * Simple metrics collection for monitoring system health.
 * Tracks key metrics without impacting performance.
 */

export interface SystemMetrics {
  totalRequests: number;
  totalTokens: number;
  activeProviders: number;
  failureRate: number;
  cacheHitRate: number;
  avgResponseTime: number;
}

// In-memory metrics for fast access (synced to Redis periodically)
const _metrics = {
  requests: 0,
  tokens: 0,
  failures: 0,
  cacheHits: 0,
  cacheMisses: 0,
  responseTimes: [] as number[],
};

const METRICS_WINDOW = 300000; // 5 minutes
let _lastSync = Date.now();

/**
 * Record a successful request.
 */
export function recordRequest(tokens: number = 0, responseTime: number = 0): void {
  _metrics.requests++;
  if (tokens > 0) _metrics.tokens += tokens;
  if (responseTime > 0) {
    _metrics.responseTimes.push(responseTime);
    // Keep only recent response times (last 100)
    if (_metrics.responseTimes.length > 100) {
      _metrics.responseTimes.shift();
    }
  }
  syncMetricsPeriodically();
}

/**
 * Record a cache hit or miss.
 */
export function recordCacheEvent(hit: boolean): void {
  if (hit) _metrics.cacheHits++;
  else _metrics.cacheMisses++;
  syncMetricsPeriodically();
}

/**
 * Record a request failure.
 */
export function recordFailure(): void {
  _metrics.failures++;
  syncMetricsPeriodically();
}

/**
 * Get current metrics snapshot.
 */
export function getMetrics(): SystemMetrics {
  const total = _metrics.requests;
  const failureRate = total > 0 ? _metrics.failures / total : 0;
  const cacheTotal = _metrics.cacheHits + _metrics.cacheMisses;
  const cacheHitRate = cacheTotal > 0 ? _metrics.cacheHits / cacheTotal : 0;
  const avgResponseTime =
    _metrics.responseTimes.length > 0
      ? _metrics.responseTimes.reduce((a, b) => a + b, 0) / _metrics.responseTimes.length
      : 0;

  return {
    totalRequests: total,
    totalTokens: _metrics.tokens,
    activeProviders: 9, // Hardcoded for now
    failureRate,
    cacheHitRate,
    avgResponseTime,
  };
}

/**
 * Sync metrics to Redis periodically to survive restarts.
 */
function syncMetricsPeriodically(): void {
  const now = Date.now();
  if (now - _lastSync < 30000) return; // Sync every 30 seconds

  _lastSync = now;
  syncMetricsToRedis().catch(e => console.error('Failed to sync metrics:', e));
}

async function syncMetricsToRedis(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `metrics:${today}`;

    await redis.hSet(key, 'requests', String(_metrics.requests));
    await redis.hSet(key, 'tokens', String(_metrics.tokens));
    await redis.hSet(key, 'failures', String(_metrics.failures));
    await redis.expire(key, 604800); // 7 days
  } catch (e) {
    console.error('Failed to sync metrics to Redis:', e);
  }
}

/**
 * Get metrics from Redis for the given date.
 */
export async function getMetricsForDate(
  date: string
): Promise<Partial<SystemMetrics> | null> {
  try {
    const key = `metrics:${date}`;
    const data = await redis.hGetAll(key);
    if (!data || Object.keys(data).length === 0) return null;

    return {
      totalRequests: parseInt(data.requests || '0') || 0,
      totalTokens: parseInt(data.tokens || '0') || 0,
      failureRate: parseFloat(data.failureRate || '0') || 0,
      cacheHitRate: parseFloat(data.cacheHitRate || '0') || 0,
    };
  } catch (e) {
    console.error('Failed to get metrics from Redis:', e);
    return null;
  }
}
