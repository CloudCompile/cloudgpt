# CloudGPT Context Guide

## Project Overview

CloudGPT is an AI gateway/proxy service that routes requests across 7+ AI providers (Groq, Cerebras, Pollinations, VoidAI, AIHorde, Airforce, AIHubMix) with:
- OpenAI-compatible API (`/v1/chat/completions`, `/v1/images/generations`, etc.)
- User authentication (Clerk)
- Admin panel for managing API keys and virtual models
- Multi-provider routing with automatic fallback
- User-created virtual models that split requests across providers

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: Clerk
- **Database**: Redis (via `REDIS_URL` env var) for persistent state
- **Deployment**: Vercel (serverless)
- **Language**: TypeScript

## Key Architecture

### Routing & Providers

**7 Providers** (all support chat/images, some support other endpoints):
1. **AIHubMix** - `/aihubmix` prefix
2. **Pollinations** - `/pollinations` prefix  
3. **VoidAI** - `/voidai` prefix
4. **Airforce** - `/airforce` prefix
5. **Cerebras** - `/cerebras` prefix (1M tokens/day limit per key)
6. **Groq** - `/groq` prefix
7. **AIHorde** - `/aihorde` prefix (text-only)

**Routing Logic** (`lib/providers/index.ts`):
- Virtual models: check hardcoded map (now empty), then user Redis models
- Provider-prefixed models: route to specific provider
- Default models (no prefix): try AIHubMix → Pollinations → VoidAI → Airforce → Cerebras → Groq → AIHorde

### Virtual Models

**Storage**: Redis key `virtual_models` contains JSON array of `{ id, providers: Array<{ provider, modelId, type }> }`

**Caching**: 30-second in-memory cache with race-condition protection (fetch-in-progress flag prevents concurrent Redis hammering)

**Admin-Managed**: All seeded/hardcoded models removed. Users create models via `/api/admin/virtual-models` (CRUD endpoints, Redis-backed)

### Key Management

**Storage**: Environment variables (`{PROVIDER}_KEY_1` through `{PROVIDER}_KEY_10`) + Redis-stored encrypted keys (via admin panel)

**Rotation**: Atomic round-robin using Redis `INCR` (prevents race condition where concurrent requests read same key index)

**Token Tracking** (Cerebras only): `redis.set('cerebras:{keyIndex}:tokens:{today}', count)` with 48-hour expiry

### Authentication & Authorization

**API Users**: Bearer token validation in `lib/api-keys.ts`
- Key format: `or_{32 random hex chars}` (cryptographically secure)
- Stored in Redis: `key:{apiKey}` → `{ userId, name, createdAt }`

**Admin**: Clerk + `checkAdmin(userId)` check
- `requireAdmin()` guard on all `/api/admin/*` endpoints
- Returns 401 (no auth) or 403 (not admin)

## Critical Recent Changes (PR #23)

### Security Fixes
1. **Weak RNG → crypto.randomBytes()**: API keys now use cryptographically-secure random
2. **Auth guards**: Added `requireAdmin()` to all `/api/admin/*` endpoints (was unauthenticated)
3. **Error disclosure**: Removed sensitive details from 500 responses

### Stability Fixes
1. **Cache race condition**: Added fetch-in-progress flag in `getUserVirtualModels()` to prevent concurrent Redis floods
2. **Key rotation race condition**: Use atomic Redis `INCR` instead of read-modify-write in `keypool.ts` and `cerebras.ts`
3. **Response body consumption**: Clone response before parsing in Cerebras error handler
4. **JSON.parse errors**: Wrapped in try-catch, null fallback on parse failure
5. **parseInt NaN**: Added `(parseInt(...) || 0)` to handle invalid Redis values

### Feature Changes
1. **Seeded models removed**: Emptied hardcoded `VIRTUAL_MODELS_MAP` — all virtual models now admin-managed
2. **Type inference**: Virtual model UI infers type from `availableModels` instead of hardcoding 'text'
3. **Providers expanded**: Groq + AIHorde added to consistent `PROVIDERS` arrays across all endpoints

## File Organization

### Core Routing
- `lib/providers/index.ts` - Main routing logic, virtual model caching
- `lib/providers/keypool.ts` - Key pool management, atomic round-robin
- `lib/providers/{provider}.ts` - Individual provider implementations (cerebras, groq, etc.)

### Auth & Security
- `lib/api-keys.ts` - API key generation (crypto.randomBytes), validation
- `lib/crypto.ts` - Encryption for stored keys
- `lib/admin.ts` - Admin check via Clerk
- `middleware.ts` - Auth guard for protected routes

### Data & Analytics
- `lib/redis.ts` - Redis singleton (lazy-connected, build-safe)
- `lib/analytics.ts` - Request/token tracking with NaN-safe parseInt

### Admin APIs
- `app/api/admin/virtual-models/route.ts` - CRUD for user virtual models (Redis-backed)
- `app/api/admin/keys/route.ts` - List/create/delete API keys
- `app/api/admin/keys/status/route.ts` - Test provider keys (includes bounds check on env index)
- `app/api/admin/analytics/route.ts` - Analytics dashboard data

### Public APIs
- `app/api/v1/chat/completions/route.ts` - Chat endpoint (has error logging, no details in errors)
- `app/api/v1/images/generations/route.ts` - Image generation
- `app/api/v1/videos/generations/route.ts` - Video generation
- `app/api/v1/models/route.ts` - List available models

### UI
- `app/admin/virtual-models/page.tsx` - Virtual model CRUD UI (multi-select checkboxes)
- `app/models/page.tsx` - Public models listing (redesigned with hero, stats, filtering)
- `app/page.tsx` - Home page (Clerk config guard, improved design)

## Environment Variables

**Required for local dev**:
```
REDIS_URL=redis://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
ENCRYPTION_KEY=... (32-byte hex for encrypting stored provider keys)
```

**Provider keys** (env vars or admin panel):
```
AIHUBMIX_KEY_1 through AIHUBMIX_KEY_10
POLLINATIONS_KEY_1 through POLLINATIONS_KEY_10
... (same pattern for all 7 providers)
```

## Known Patterns

### Atomic Operations
- **Key rotation**: `const counter = await redis.incr(key); const index = (counter - 1) % keys.length;`
- **Token tracking**: Use `redis.incrBy()` for atomic increments (not read-modify-write)

### Error Handling
- **JSON.parse**: Always wrap in try-catch, return sensible default on failure
- **Fire-and-forget analytics**: Log errors instead of silent `.catch(() => {})`
- **Admin auth**: Use `requireAdmin()` guard instead of inline checks

### Caching
- **Virtual models**: Use fetch-in-progress flag to prevent concurrent fetches:
  ```typescript
  if (_userVirtualModelsFetching) return _userVirtualModelsFetching;
  _userVirtualModelsFetching = asyncFetch().finally(() => {
    _userVirtualModelsFetching = null;
  });
  ```

### Clerk Integration
- **Build-safe**: Wrap Clerk components in `{isConfigured ? ... : ...}` check
- **Server functions**: Use `await auth()` for user ID, `await clerkClient.users.getUser(id)` for details
- **Client components**: Use `<SignedIn>`, `<SignedOut>`, `useAuth()` hook

## Testing Checklist

When making changes:
1. [ ] Test auth guards (unauthenticated requests return 401)
2. [ ] Test admin checks (non-admin users return 403)
3. [ ] Test provider routing (requests go to correct provider)
4. [ ] Test virtual models (multi-provider fallback works)
5. [ ] Test with malformed Redis data (graceful error handling)
6. [ ] Test concurrent requests (no race conditions)
7. [ ] Test error responses (no sensitive details leaked)

## Common Tasks

### Add a New Provider
1. Create `lib/providers/{name}.ts` with `forward{Name}()` function
2. Add to routing chains in `lib/providers/index.ts`
3. Add to `PROVIDERS` array in keys/analytics endpoints
4. Add test URL in `app/api/admin/keys/status/route.ts`
5. Add env var pattern: `{NAME}_KEY_1` through `{NAME}_KEY_10`

### Debug Virtual Models
- Redis key: `virtual_models` (JSON array)
- Check cache: Set `USER_VIRTUAL_MODELS_TTL = 0` to skip caching
- Check type inference: Verify `availableModels[provider]` has correct type field

### Debug Key Rotation
- Check atomic behavior: `redis.incr()` should increment, not overwrite
- Monitor for race condition: Concurrent requests should load-balance, not all hit same key

## Recent PRs

**PR #23**: Complete build setup
- Security: Crypto RNG, auth guards, error handling
- Stability: Cache/key rotation race conditions, JSON parsing
- Features: Removed seeded models, type inference, 7 providers
- Verified: ✅ CI green, no unresolved review comments

## Notes for Future Work

- **Type safety**: Many `(body as any)` casts throughout — consider schema validation (zod, io-ts)
- **Console logging**: Debug logs should be removed or guarded in production
- **dangerouslySetInnerHTML**: In docs/page.tsx (hardcoded, safe, but pattern is risky)
- **Error handling in admin endpoints**: Consider centralizing error responses
- **Analytics**: Fire-and-forget pattern is good, but consider monitoring for persistent failures
