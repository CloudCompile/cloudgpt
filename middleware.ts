import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/models',
  '/providers',
  '/docs(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/v1/(.*)',
  '/v1/(.*)',
]);

// Edge-local IP rate limiting (resets per cold start, but good enough to blunt spammers)
// Maps ip -> { count, windowStart }
const _ipHits = new Map<string, { count: number; windowStart: number }>();
const IP_WINDOW_MS = 60_000;  // 1 minute window
const IP_MAX_REQUESTS = 120;  // 2 req/s sustained
const IP_BAN_THRESHOLD = 300; // temp-ban at 5 req/s sustained

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkIpRateLimit(ip: string): { allowed: boolean; banned: boolean } {
  const now = Date.now();
  const entry = _ipHits.get(ip);

  if (!entry || now - entry.windowStart > IP_WINDOW_MS) {
    _ipHits.set(ip, { count: 1, windowStart: now });
    // Prune map if it gets large (edge instances are long-lived)
    if (_ipHits.size > 10_000) {
      for (const [k, v] of _ipHits) {
        if (now - v.windowStart > IP_WINDOW_MS) _ipHits.delete(k);
      }
    }
    return { allowed: true, banned: false };
  }

  entry.count++;
  if (entry.count > IP_BAN_THRESHOLD) return { allowed: false, banned: true };
  if (entry.count > IP_MAX_REQUESTS) return { allowed: false, banned: false };
  return { allowed: true, banned: false };
}

const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export default function middleware(request: NextRequest) {
  const ip = getIp(request);
  const { allowed, banned } = checkIpRateLimit(ip);

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({ error: banned ? 'Too many requests — you have been temporarily blocked' : 'Rate limit exceeded' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    );
  }

  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }

  return (clerkHandler as (req: NextRequest) => Response | Promise<Response>)(request);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
