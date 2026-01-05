import { v4 as uuidv4 } from 'uuid';

/**
 * API Key Management Utilities
 * 
 * IMPORTANT: This implementation uses in-memory storage for demonstration purposes.
 * For production deployments, replace with:
 * - Vercel KV or Redis for rate limiting
 * - A database (Postgres, MongoDB, etc.) for API key storage
 * 
 * The in-memory storage will not persist across:
 * - Serverless function cold starts
 * - Multiple function instances
 * - Deployments
 */

export interface ApiKey {
  id: string;
  key: string;
  userId: string;
  name: string;
  createdAt: Date;
  lastUsedAt?: Date;
  rateLimit: number; // requests per minute
  usageCount: number;
}

// Generate a new API key with the cgpt_ prefix
export function generateApiKey(): string {
  const prefix = 'cgpt_';
  const key = uuidv4().replace(/-/g, '');
  return `${prefix}${key}`;
}

// Extract API key from request headers (Bearer token)
export function extractApiKey(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.substring(7);
    // Validate key format before returning
    if (key.startsWith('cgpt_') && key.length === 37) {
      return key;
    }
  }
  return null;
}

/**
 * In-memory rate limiting
 * NOTE: This will not work correctly across multiple serverless instances.
 * For production, use Redis or Vercel KV.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(apiKey: string, limit: number = 60): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  const current = rateLimitMap.get(apiKey);
  
  if (!current || now > current.resetAt) {
    rateLimitMap.set(apiKey, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  return true;
}

export function getRateLimitInfo(apiKey: string): { remaining: number; resetAt: number } {
  const current = rateLimitMap.get(apiKey);
  const limit = 60;
  
  if (!current) {
    return { remaining: limit, resetAt: Date.now() + 60000 };
  }
  
  return {
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}
