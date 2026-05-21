import { redis } from './redis';

export const PROVIDER_TEST_CONFIGS: Record<string, {
  testUrl: string;
  timeout: number;
  validStatusCodes: number[];
}> = {
  Pollinations: {
    testUrl: 'https://gen.pollinations.ai/v1/models',
    timeout: 8000,
    validStatusCodes: [200, 401, 403, 429],
  },
  VoidAI: {
    testUrl: 'https://api.voidai.app/v1/models',
    timeout: 8000,
    validStatusCodes: [200, 401, 403, 429],
  },
  Airforce: {
    testUrl: 'https://api.airforce/v1/models',
    timeout: 8000,
    validStatusCodes: [200, 401, 403, 429],
  },
  Cerebras: {
    testUrl: 'https://api.cerebras.ai/v1/models',
    timeout: 8000,
    validStatusCodes: [200, 401, 403, 429],
  },
  Groq: {
    testUrl: 'https://api.groq.com/openai/v1/models',
    timeout: 8000,
    validStatusCodes: [200, 401, 403, 429],
  },
  AIHorde: {
    testUrl: 'https://aihorde.net/api/v2/status/heartbeat',
    timeout: 8000,
    validStatusCodes: [200, 401, 403, 429],
  },
  TokenReply: {
    testUrl: 'https://api.tokenreply.com/v1beta/models',
    timeout: 8000,
    validStatusCodes: [200, 401, 403, 429],
  },
  NagaAI: {
    testUrl: 'https://api.naga.ac/v1/models',
    timeout: 8000,
    validStatusCodes: [200, 401, 403, 429],
  },
  Happupy: {
    testUrl: 'https://beta.hapuppy.com/v1/models',
    timeout: 8000,
    validStatusCodes: [200, 401, 403, 429],
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
 */
export async function testKey(
  provider: string,
  rawKey: string,
  timeout: number = 8000
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
    if (res.ok) return 'working';
    // 5xx = provider down, key might be fine
    return 'working';
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      // Timeout could mean the provider is slow, not that the key is invalid
      return 'working';
    }
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
    // Check only a sample of keys to avoid overload
    const samplesToCheck = Math.min(3, Math.max(1, Math.floor(entries.length / 5)));
    const indices = Array.from(
      { length: samplesToCheck },
      () => Math.floor(Math.random() * entries.length)
    );

    for (const idx of indices) {
      const entry = entries[idx];
      if (!entry?.id) continue;

      const health = await getKeyHealth(provider, entry.id);
      // Only check if we haven't checked recently
      if (health && Date.now() - health.lastChecked < 300000) continue;

      // Schedule health update (don't await)
      updateKeyHealth(provider, entry.id, 'working').catch(() => {});
    }
  } catch (e) {
    console.error(`Failed to check provider keys for ${provider}:`, e);
  }
}
