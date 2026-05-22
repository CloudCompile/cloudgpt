/**
 * Deduplicator for high-traffic scenarios.
 * When multiple identical requests come in simultaneously,
 * only execute the operation once and return the same result to all.
 *
 * This is crucial for Vercel's free tier where concurrent identical
 * requests (e.g., same model query) should share resources.
 */

type DedupeKey = string;
type PendingPromise<T> = Promise<T>;

const _pendingRequests = new Map<DedupeKey, PendingPromise<any>>();

/**
 * Generate a cache key from a request.
 * Should be unique for different requests but identical for duplicates.
 */
export function generateDedupeKey(
  endpoint: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>
): DedupeKey {
  const parts = [endpoint, method];

  if (body) {
    // Hash the body to create a consistent key
    // Exclude things like request timestamp that vary per request
    if (typeof body === 'object') {
      const hashable = JSON.stringify(body);
      parts.push(hashable);
    }
  }

  if (headers?.['user-id']) {
    parts.push(headers['user-id']);
  }

  return parts.join('::');
}

/**
 * Execute a function with deduplication.
 * If an identical request is already in progress, wait for it instead of executing again.
 */
export async function deduplicate<T>(
  key: DedupeKey,
  fn: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  // Check if this request is already in progress
  const pending = _pendingRequests.get(key);
  if (pending) {
    return pending;
  }

  // Register the key synchronously before any async work so that any
  // concurrent caller that arrives before the first await sees the entry.
  let resolveFn!: (value: T | PromiseLike<T>) => void;
  let rejectFn!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolveFn = res; rejectFn = rej; });
  _pendingRequests.set(key, promise);

  const timeoutId = setTimeout(
    () => rejectFn(new Error(`Request timeout after ${timeoutMs}ms`)),
    timeoutMs
  );

  fn().then(resolveFn, rejectFn).finally(() => {
    clearTimeout(timeoutId);
    _pendingRequests.delete(key);
  });

  return promise;
}

/**
 * Get the number of pending requests (useful for monitoring).
 */
export function getPendingRequestCount(): number {
  return _pendingRequests.size;
}

/**
 * Clear all pending requests (useful for cleanup).
 */
export function clearPendingRequests(): void {
  _pendingRequests.clear();
}
