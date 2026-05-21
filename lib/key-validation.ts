import { redis } from './redis';
import type { ProviderKeyEntry } from './providers/keypool';

export const PROVIDER_TEST_CONFIGS: Record<string, {
  testUrl: string;
  timeout: number;
  validStatusCodes: number[];
}> = {
  Pollinations: {
    testUrl: 'https://gen.pollinations.ai/v1/models',
    timeout: 3000,
    validStatusCodes: [200],
  },
  VoidAI: {
    testUrl: 'https://api.voidai.app/v1/models',
    timeout: 3000,
    validStatusCodes: [200],
  },
  Airforce: {
    testUrl: 'https://api.airforce/v1/models',
    timeout: 3000,
    validStatusCodes: [200],
  },
  Cerebras: {
    testUrl: 'https://api.cerebras.ai/v1/models',
    timeout: 3000,
    validStatusCodes: [200],
  },
  Groq: {
    testUrl: 'https://api.groq.com/openai/v1/models',
    timeout: 3000,
    validStatusCodes: [200],
  },
  AIHorde: {
    testUrl: 'https://aihorde.net/api/v2/status/heartbeat',
    timeout: 3000,
    validStatusCodes: [200],
  },
  TokenReply: {
    testUrl: 'https://api.tokenreply.com/v1beta/models',
    timeout: 3000,
    validStatusCodes: [200],
  },
  NagaAI: {
    testUrl: 'https://api.naga.ac/v1/models',
    timeout: 3000,
    validStatusCodes: [200],
  },
  Happupy: {
    testUrl: 'https://beta.hapuppy.com/v1/models',
    timeout: 3000,
    validStatusCodes: [200],
  },
};

export type KeyStatus = 'working' | 'rate_limited' | 'error';

export interface KeyHealthCheckResult {
  status: KeyStatus;
  lastChecked: number;
  failureCount: number;
  successCount: number;
}

/**
 * Test if a provider key is valid by making a request to the provider's API.
 * Returns the status without throwing.
 * STRICT: Only returns 'working' if 200 OK with valid response.
 */
export async function testKey(
  provider: string,
  rawKey: string,
  timeout: number = 3000
): Promise<KeyStatus> {
  const config = PROVIDER_TEST_CONFIGS[provider];
  if (!config) return 'error';

  try {
    const res = await fetch(config.testUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${rawKey}` },
      signal: AbortSignal.timeout(timeout),
    });

    if (res.status === 429) return 'rate_limited';
    if (res.status === 401 || res.status === 403) return 'error';

    // STRICT: Only accept 200 OK with actual response body
    if (res.status === 200) {
      try {
        const body = await res.text();
        // Verify response has content (not empty)
        if (body && body.length > 10) return 'working';
      } catch {
        return 'error';
      }
    }

    // Anything else = error (5xx, timeout, etc.)
    return 'error';
  } catch (e) {
    return 'error';
  }
}

/**
 * Get cached health status for a key.
 */
export async function getKeyHealth(
  provider: string,
  keyId: string
): Promise<KeyHealthCheckResult | null> {
  try {
    const providerKey = provider.toLowerCase();
    const json = await redis.get(`admin:key:status:${providerKey}:${keyId}`);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Update health status for a key.
 * Tracks successes and failures to determine if a key should be removed.
 */
export async function updateKeyHealth(
  provider: string,
  keyId: string,
  status: KeyStatus
): Promise<void> {
  try {
    const providerKey = provider.toLowerCase();
    const statusKey = `admin:key:status:${providerKey}:${keyId}`;

    const current = await getKeyHealth(provider, keyId);
    const result: KeyHealthCheckResult = {
      status,
      lastChecked: Date.now(),
      successCount: status === 'working' ? (current?.successCount ?? 0) + 1 : current?.successCount ?? 0,
      failureCount: status === 'error' ? (current?.failureCount ?? 0) + 1 : current?.failureCount ?? 0,
    };

    await redis.setEx(statusKey, 604800, JSON.stringify(result)); // 7 days
  } catch (e) {
    console.error(`Failed to update key health for ${provider}:${keyId}:`, e);
  }
}

/**
 * Check if a key should be marked as permanently broken.
 * Returns true if the key has failed too many times.
 */
export async function isKeyBroken(
  provider: string,
  keyId: string,
  failureThreshold: number = 5
): Promise<boolean> {
  const health = await getKeyHealth(provider, keyId);
  if (!health) return false;

  // If more than threshold consecutive errors, mark as broken
  const recentErrorRate = health.failureCount > failureThreshold;
  if (recentErrorRate) {
    console.warn(
      `Key ${keyId} for ${provider} has ${health.failureCount} failures, marking as broken`
    );
  }

  return recentErrorRate;
}

/**
 * Background health check for all keys.
 * Should be called periodically (e.g., every minute) to update key statuses.
 */
export async function runBackgroundHealthChecks(): Promise<void> {
  const providers = Object.keys(PROVIDER_TEST_CONFIGS);

  // Distribute checks across providers to avoid overload
  for (const provider of providers) {
    try {
      // Don't await - let these run in parallel
      checkProviderKeys(provider).catch(e =>
        console.error(`Failed to check health for ${provider}:`, e)
      );
    } catch (e) {
      console.error(`Error starting health check for ${provider}:`, e);
    }
  }
}

async function checkProviderKeys(provider: string): Promise<void> {
  try {
    const listJson = await redis.get(
      `admin:provider:keys:${provider.toLowerCase()}`
    );
    if (!listJson) return;

    const entries = JSON.parse(listJson);
    const encKey = process.env.ENCRYPTION_KEY;
    if (!encKey) return;

    // Check ALL keys, but respect recent checks to avoid overload
    // Aggressively test unchecked keys to catch spam early
    for (const entry of entries) {
      if (!entry?.id || !entry?.encryptedKey) continue;

      const health = await getKeyHealth(provider, entry.id);

      // Check unchecked keys immediately, others less frequently
      const timeSinceCheck = health ? Date.now() - health.lastChecked : Infinity;
      const shouldCheck = timeSinceCheck > 3600000; // 1 hour between checks
      const shouldCheckSpam = !health; // New keys get checked immediately

      if (!shouldCheck && !shouldCheckSpam) continue;

      // Actually test the key
      try {
        const { decryptKey } = await import('./crypto');
        const decrypted = decryptKey(entry.encryptedKey, encKey);
        const status = await testKey(provider, decrypted, 3000);
        await updateKeyHealth(provider, entry.id, status).catch(() => {});

        // Remove keys with too many failures
        if (status === 'error' && health && health.failureCount >= 3) {
          await removeProviderKey(provider, entry.id);
        }
      } catch (e) {
        console.error(`Failed to check key ${entry.id} for ${provider}:`, e);
      }
    }
  } catch (e) {
    console.error(`Failed to check provider keys for ${provider}:`, e);
  }
}

async function removeProviderKey(provider: string, keyId: string): Promise<void> {
  try {
    const listJson = await redis.get(`admin:provider:keys:${provider.toLowerCase()}`);
    if (!listJson) return;
    const list: ProviderKeyEntry[] = JSON.parse(listJson);
    const filtered = list.filter(e => e.id !== keyId);
    await redis.set(`admin:provider:keys:${provider.toLowerCase()}`, JSON.stringify(filtered));
  } catch (e) {
    console.error(`Failed to remove key ${keyId} for ${provider}:`, e);
  }
}
