/**
 * Centralized error handling for consistent error responses.
 * Ensures no sensitive data leaks while providing useful debugging info.
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  statusCode: number;
  timestamp: number;
  path?: string;
  method?: string;
  details?: string; // Only shown in development
}

/**
 * Create a consistent error response.
 * Strips sensitive info in production, includes details in development.
 */
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500,
  context?: { path?: string; method?: string }
): ErrorInfo {
  const isDev = process.env.NODE_ENV === 'development';
  let message = 'An error occurred';
  let code: string | undefined;
  let details: string | undefined;

  if (error instanceof Error) {
    message = error.message;
    code = (error as any).code;
    details = isDev ? error.stack : undefined;
  } else if (typeof error === 'string') {
    message = error;
  } else if (typeof error === 'object' && error !== null) {
    message = (error as any).message || String(error);
    details = isDev ? JSON.stringify(error, null, 2) : undefined;
  }

  return {
    message,
    code,
    statusCode,
    timestamp: Date.now(),
    path: context?.path,
    method: context?.method,
    details,
  };
}

/**
 * Categorize errors for logging and monitoring.
 */
export function categorizeError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('timeout') || message.includes('abort')) return 'timeout';
    if (message.includes('rate limit') || message.includes('429')) return 'rate_limit';
    if (message.includes('unauthorized') || message.includes('401')) return 'unauthorized';
    if (message.includes('not found') || message.includes('404')) return 'not_found';
    if (message.includes('redis')) return 'redis_error';
    if (message.includes('network')) return 'network_error';
  }
  return 'unknown';
}

/**
 * Log an error with context for debugging.
 */
export function logError(
  error: unknown,
  context: {
    endpoint?: string;
    provider?: string;
    userId?: string;
    details?: string;
  }
): void {
  const category = categorizeError(error);
  const message =
    error instanceof Error ? error.message : String(error);

  console.error(
    JSON.stringify({
      type: 'error',
      category,
      message,
      context,
      timestamp: Date.now(),
    })
  );
}

/**
 * Determine if an error is retryable.
 */
export function isRetryableError(error: unknown): boolean {
  const category = categorizeError(error);
  return ['timeout', 'rate_limit', 'network_error'].includes(category);
}

/**
 * Get recommended retry delay in milliseconds.
 */
export function getRetryDelay(
  attemptNumber: number,
  category: string
): number {
  if (category === 'rate_limit') {
    // Exponential backoff for rate limits
    return Math.min(10000, 1000 * Math.pow(2, attemptNumber - 1));
  }
  // Regular exponential backoff for other errors
  return Math.min(5000, 100 * Math.pow(2, attemptNumber - 1));
}
