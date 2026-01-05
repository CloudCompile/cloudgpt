import { v4 as uuidv4 } from 'uuid';

// Simple in-memory API key storage (in production, use a database)
// This is designed for demonstration - in production use KV store or database

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

// Generate a new API key
export function generateApiKey(): string {
  const prefix = 'cgpt_';
  const key = uuidv4().replace(/-/g, '');
  return `${prefix}${key}`;
}

// Validate API key format
export function isValidApiKeyFormat(key: string): boolean {
  return /^cgpt_[a-f0-9]{32}$/.test(key);
}

// Extract API key from request headers
export function extractApiKey(headers: Headers): string | null {
  const authHeader = headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Rate limiting check (simple implementation)
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
