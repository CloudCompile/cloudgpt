import { timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';

/**
 * Security utilities for hardening the API against common attacks.
 */

/**
 * Validate and sanitize user input.
 * Prevents injection attacks and malformed requests.
 */
export function validateInput(
  input: unknown,
  schema: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    required?: boolean;
  }
): boolean {
  if (input === undefined || input === null) {
    return !schema.required;
  }

  if (typeof input !== schema.type) {
    return false;
  }

  if (schema.type === 'string') {
    const str = input as string;
    if (schema.minLength !== undefined && str.length < schema.minLength) {
      return false;
    }
    if (schema.maxLength !== undefined && str.length > schema.maxLength) {
      return false;
    }
    if (schema.pattern && !schema.pattern.test(str)) {
      return false;
    }
  }

  if (schema.type === 'number') {
    if (!Number.isFinite(input as number)) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitize strings to prevent XSS attacks.
 * Removes potentially dangerous characters and patterns.
 */
export function sanitizeString(input: string): string {
  if (!input) return '';

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[&]/g, '') // Remove ampersand
    .replace(/["']/g, '') // Remove quotes
    .trim();
}

/**
 * Check if a string looks like it contains sensitive data.
 * Used to prevent accidental logging of secrets.
 */
export function containsSensitiveData(input: string): boolean {
  const sensitivePatterns = [
    /api[_-]?key/i,
    /secret/i,
    /password/i,
    /token/i,
    /credential/i,
    /authorization/i,
  ];

  return sensitivePatterns.some(pattern => pattern.test(input));
}

/**
 * Safe string comparison to prevent timing attacks.
 * Uses Node's crypto.timingSafeEqual so comparison time does not leak length.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // Pad both sides to the same byte length before comparing so we never
  // short-circuit on a length mismatch (which would leak length via timing).
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  const len = Math.max(bufA.length, bufB.length);
  const paddedA = Buffer.concat([bufA, Buffer.alloc(len - bufA.length)]);
  const paddedB = Buffer.concat([bufB, Buffer.alloc(len - bufB.length)]);
  // Always run the full constant-time compare; check length equality separately.
  return cryptoTimingSafeEqual(paddedA, paddedB) && bufA.length === bufB.length;
}

/**
 * Rate limit by IP address.
 * Simple per-IP rate limiting.
 */
export function extractClientIp(
  headers: Record<string, string | string[] | undefined>
): string {
  const forwarded = headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }

  const realIp = headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp;
  }

  return 'unknown';
}

/**
 * Validate origin for CORS requests.
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;

  const allowed = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://openrelay.dev',
    'https://www.openrelay.dev',
  ];

  return allowed.includes(origin) || process.env.NODE_ENV === 'development';
}

/**
 * Check if a request looks malicious based on headers.
 */
export function looksLikeMaliciousRequest(
  headers: Record<string, string | string[] | undefined>
): boolean {
  // Check for suspicious user agents
  const userAgent = headers['user-agent'];
  if (typeof userAgent === 'string') {
    const suspiciousPatterns = [/bot|crawler|scanner|nikto|nmap/i];
    if (suspiciousPatterns.some(p => p.test(userAgent))) {
      return true;
    }
  }

  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-scanner',
    'x-originating-ip',
    'x-scanner-name',
    'x-test',
  ];
  if (suspiciousHeaders.some(h => h in headers)) {
    return true;
  }

  return false;
}

/**
 * Create a Content Security Policy header.
 */
export function getCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.clerk.com",
    "frame-ancestors 'self'",
    "form-action 'self'",
  ].join('; ');
}

/**
 * Get security headers for responses.
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': getCSPHeader(),
  };
}
