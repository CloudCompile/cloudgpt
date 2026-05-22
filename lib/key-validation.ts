import { redis } from './redis';
import type { ProviderKeyEntry } from './providers/keypool';

// Auth types: bearer = Authorization: Bearer {key}, apikey = x-api-key: {key},
//   elevenlabs = xi-api-key: {key}, queryparam = URL?key={key}
type AuthType = 'bearer' | 'apikey' | 'elevenlabs' | 'queryparam';

export const PROVIDER_TEST_CONFIGS: Record<string, {
  testUrl: string;
  timeout: number;
  validStatusCodes: number[];
  authType?: AuthType;
}> = {
  // Active providers
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
  Airforce: {
    testUrl: 'https://api.airforce/models',
    timeout: 3000,
    validStatusCodes: [200],
  },
  Happupy: {
    testUrl: 'https://beta.hapuppy.com/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },

  // Coming-soon providers
  Gemini: {
    // Gemini uses API key as query param, not Bearer
    testUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    timeout: 4000,
    validStatusCodes: [200],
    authType: 'queryparam',
  },
  OpenRouter: {
    testUrl: 'https://openrouter.ai/api/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Mistral: {
    testUrl: 'https://api.mistral.ai/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  GitHub: {
    testUrl: 'https://models.inference.ai.azure.com/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Cohere: {
    testUrl: 'https://api.cohere.ai/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  HuggingFace: {
    testUrl: 'https://huggingface.co/api/whoami',
    timeout: 4000,
    validStatusCodes: [200],
  },
  SiliconFlow: {
    testUrl: 'https://api.siliconflow.cn/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Sambanova: {
    testUrl: 'https://api.sambanova.ai/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  NVIDIA: {
    testUrl: 'https://integrate.api.nvidia.com/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Fireworks: {
    testUrl: 'https://api.fireworks.ai/inference/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Together: {
    testUrl: 'https://api.together.xyz/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Featherless: {
    testUrl: 'https://api.featherless.ai/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Hyperbolic: {
    testUrl: 'https://api.hyperbolic.xyz/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Novita: {
    testUrl: 'https://api.novita.ai/v3/openai/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Scaleway: {
    testUrl: 'https://api.scaleway.ai/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Perplexity: {
    testUrl: 'https://api.perplexity.ai/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Anthropic: {
    // Anthropic uses x-api-key header instead of Bearer
    testUrl: 'https://api.anthropic.com/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
    authType: 'apikey',
  },
  xAI: {
    testUrl: 'https://api.x.ai/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  StabilityAI: {
    testUrl: 'https://api.stability.ai/v1/engines/list',
    timeout: 4000,
    validStatusCodes: [200],
  },
  ElevenLabs: {
    // ElevenLabs uses xi-api-key header
    testUrl: 'https://api.elevenlabs.io/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
    authType: 'elevenlabs',
  },
  Replicate: {
    testUrl: 'https://api.replicate.com/v1/deployments',
    timeout: 4000,
    validStatusCodes: [200],
  },
  DeepSeek: {
    testUrl: 'https://api.deepseek.com/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Moonshot: {
    testUrl: 'https://api.moonshot.cn/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Zhipu: {
    testUrl: 'https://open.bigmodel.cn/api/paas/v4/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  AI21: {
    testUrl: 'https://api.ai21.com/studio/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  DeepInfra: {
    testUrl: 'https://api.deepinfra.com/v1/openai/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Lepton: {
    testUrl: 'https://llama3-1-70b.lepton.run/api/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  TextSynth: {
    testUrl: 'https://api.textsynth.com/v1/engines',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Upstage: {
    testUrl: 'https://api.upstage.ai/v1/solar/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Writer: {
    testUrl: 'https://api.writer.com/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Voyage: {
    testUrl: 'https://api.voyageai.com/v1/models',
    timeout: 4000,
    validStatusCodes: [200, 404],
  },
  Jina: {
    testUrl: 'https://api.jina.ai/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  OctoAI: {
    testUrl: 'https://text.octoai.run/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Fal: {
    testUrl: 'https://fal.run/fal-ai/stable-diffusion-v3-medium',
    timeout: 4000,
    validStatusCodes: [200, 422],
  },
  Krutrim: {
    testUrl: 'https://cloud.olakrutrim.com/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  FishAudio: {
    testUrl: 'https://api.fish.audio/v1/models',
    timeout: 4000,
    validStatusCodes: [200],
  },
  Ideogram: {
    testUrl: 'https://api.ideogram.ai/manage/api/subscription',
    timeout: 4000,
    validStatusCodes: [200],
  },
  LeonardoAI: {
    testUrl: 'https://cloud.leonardo.ai/api/rest/v1/me',
    timeout: 4000,
    validStatusCodes: [200],
  },
  BFL: {
    testUrl: 'https://api.bfl.ml/v1/get_result',
    timeout: 4000,
    validStatusCodes: [200, 404],
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
    let url = config.testUrl;
    const headers: Record<string, string> = {};

    // Build auth header based on provider's auth type
    const authType = config.authType ?? 'bearer';
    if (authType === 'bearer') {
      headers['Authorization'] = `Bearer ${rawKey}`;
    } else if (authType === 'apikey') {
      headers['x-api-key'] = rawKey;
    } else if (authType === 'elevenlabs') {
      headers['xi-api-key'] = rawKey;
    } else if (authType === 'queryparam') {
      url = `${config.testUrl}?key=${encodeURIComponent(rawKey)}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(config.timeout ?? timeout),
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
 * Count the number of working keys for a provider.
 * Checks both environment variables and Redis-stored community keys.
 */
export async function getProviderKeyCount(provider: string): Promise<number> {
  let count = 0;

  // Count env var keys
  const prefix = `${provider.toUpperCase()}_KEY_`;
  for (let i = 1; i <= 10; i++) {
    if (process.env[`${prefix}${i}`]) {
      count++;
    }
  }

  // Count community-contributed keys from Redis
  try {
    const listJson = await redis.get(`admin:provider:keys:${provider.toLowerCase()}`);
    if (listJson) {
      const entries = JSON.parse(listJson);
      if (Array.isArray(entries)) {
        count += entries.length;
      }
    }
  } catch (e) {
    console.error(`Failed to count keys for ${provider}:`, e);
  }

  return count;
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
        await updateKeyHealth(provider, entry.id, status).catch(e => console.error(`Failed to write health status for key ${entry.id}:`, e));

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
