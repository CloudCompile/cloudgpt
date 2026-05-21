import { getNextKey, getRateLimitForProvider, getKeysForProvider } from './keypool';
import { redis } from '../redis';
import { logError } from '../analytics';
import { getProviderKeyCount } from '../key-validation';
import { forwardPollinations, forwardPollinationsVideo, forwardSimpleImage, forwardSimpleText, getPollModel } from './pollinations';
import { forwardVoidAI } from './voidai';
import { forwardAirforce } from './airforce';
import { forwardCerebras } from './cerebras';
import { forwardGroq } from './groq';
import { forwardAIHorde } from './aihorde';
import { forwardTokenReply } from './tokenreply';
import { forwardNagaAI } from './nagaai';
import { forwardHappupy } from './happupy';
import { getComingSoonModels } from './coming-soon-providers';

export interface RouteOptions {
  streaming?: boolean;
  autoFallback?: boolean;
}

const KEYS_REQUIRED = 3;

// Provider name → how it maps to Redis/env key prefix
// All providers need KEYS_REQUIRED donated keys to be routable
const ALL_PROVIDER_PREFIXES: Record<string, string> = {
  'pollinations': 'pollinations',
  'voidai': 'voidai',
  'cerebras': 'cerebras',
  'groq': 'groq',
  'aihorde': 'aihorde',
  'tokenreply': 'tokenreply',
  'nagaai': 'nagaai',
  'happupy': 'happupy',
};

// Cache active provider status for 30s to avoid Redis hammering
let _activeProviderCache: Set<string> | null = null;
let _activeProviderCacheTime = 0;
const ACTIVE_PROVIDER_TTL = 30_000;

async function getActiveProviders(): Promise<Set<string>> {
  const now = Date.now();
  if (_activeProviderCache && now - _activeProviderCacheTime < ACTIVE_PROVIDER_TTL) {
    return _activeProviderCache;
  }

  const active = new Set<string>();
  await Promise.all(
    Object.entries(ALL_PROVIDER_PREFIXES).map(async ([prefix, redisKey]) => {
      try {
        const count = await getProviderKeyCount(redisKey);
        if (count >= KEYS_REQUIRED) {
          active.add(prefix);
        }
      } catch {
        // On Redis error, fail open — don't block traffic
        active.add(prefix);
      }
    })
  );

  _activeProviderCache = active;
  _activeProviderCacheTime = now;
  return active;
}

export function invalidateActiveProviderCache() {
  _activeProviderCache = null;
}

function makeProviderInactiveError(prefix: string): Error {
  const count503 = `Provider "${prefix}" is not yet active. Donate 3 verified keys at /donate to unlock it.`;
  return Object.assign(new Error(count503), { status: 503, code: 'provider_not_active', provider: prefix });
}

async function tryProviders(
  providers: Array<{ name: string; fn: () => Promise<Response> }>
): Promise<Response> {
  let lastResponse: Response | undefined;
  let lastError: unknown;
  for (const { name, fn } of providers) {
    try {
      const response = await fn();
      if (response.ok) {
        return response;
      }
      console.warn(`[fallback] ${name}: HTTP ${response.status}`);
      lastResponse = response;
    } catch (e) {
      console.warn(`[fallback] ${name}: ${e instanceof Error ? e.message : e}`);
      lastError = e;
    }
  }
  // If we have a response, return it (even if not ok) for proper error handling
  if (lastResponse) {
    return lastResponse;
  }
  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  logError(providers.map(p => p.name).join('→'), msg).catch(() => {});
  throw lastError ?? new Error('All providers failed');
}

export async function routeChat(
  body: unknown,
  options?: RouteOptions
) {
  // Extract model if provided
  const model = (body as any)?.model || 'gpt-4o-free';

  // Block coming-soon models (future providers not yet implemented)
  const comingSoon = COMING_SOON_MODELS.find(m => m.id === model);
  if (comingSoon) {
    throw Object.assign(
      new Error(`${comingSoon.provider} is coming soon! Donate 3 verified keys at /donate to unlock it. Check /v1/models for available models.`),
      { status: 503, code: 'provider_coming_soon', provider: comingSoon.provider }
    );
  }

  // Check if this is a virtual model with multiple providers
  const virtualProviders = await getVirtualModelProviders(model);
  if (virtualProviders && virtualProviders.length > 0) {
    return routeVirtualChat(body, virtualProviders, options);
  }

  const active = await getActiveProviders();

  // Determine which provider to use and verify it's active (has 3+ donated keys)
  if (model.startsWith('pollinations/')) {
    if (!active.has('pollinations')) throw makeProviderInactiveError('pollinations');
    const fwdBody = { ...(body as any), model: model.replace('pollinations/', '') };
    return forwardPollinations('/v1/chat/completions', 'POST', fwdBody, options);
  }

  if (model.startsWith('voidai/')) {
    if (!active.has('voidai')) throw makeProviderInactiveError('voidai');
    const fwdBody = { ...(body as any), model: model.replace('voidai/', '') };
    return forwardVoidAI('/chat/completions', 'POST', fwdBody, options);
  }

  if (model.startsWith('airforce/')) {
    if (!active.has('airforce')) throw makeProviderInactiveError('airforce');
    const fwdBody = { ...(body as any), model: model.replace('airforce/', '') };
    return forwardAirforce('/chat/completions', 'POST', fwdBody, options);
  }

  if (model.startsWith('cerebras/')) {
    if (!active.has('cerebras')) throw makeProviderInactiveError('cerebras');
    const fwdBody = { ...(body as any), model: model.replace('cerebras/', '') };
    return forwardCerebras('/chat/completions', 'POST', fwdBody, options);
  }

  if (model.startsWith('groq/')) {
    if (!active.has('groq')) throw makeProviderInactiveError('groq');
    const fwdBody = { ...(body as any), model: model.replace('groq/', '') };
    return forwardGroq('/chat/completions', 'POST', fwdBody, options);
  }

  if (model.startsWith('aihorde/')) {
    if (!active.has('aihorde')) throw makeProviderInactiveError('aihorde');
    const messages = (body as any).messages || [];
    const prompt = messages.map((m: any) => m.content).join('\n') || '';
    const fwdBody = {
      prompt,
      params: {
        max_length: (body as any).max_tokens || 80,
      },
    };
    return forwardAIHorde('/generate/text/async', 'POST', fwdBody, options);
  }

  if (model.startsWith('tokenreply/')) {
    if (!active.has('tokenreply')) throw makeProviderInactiveError('tokenreply');
    const fwdBody = { ...(body as any), model: model.replace('tokenreply/', '') };
    return forwardTokenReply('/chat/completions', 'POST', fwdBody, options);
  }

  if (model.startsWith('nagaai/')) {
    if (!active.has('nagaai')) throw makeProviderInactiveError('nagaai');
    const fwdBody = { ...(body as any), model: model.replace('nagaai/', '') };
    return forwardNagaAI('/chat/completions', 'POST', fwdBody, options);
  }

  if (model.startsWith('happupy/')) {
    if (!active.has('happupy')) throw makeProviderInactiveError('happupy');
    const fwdBody = { ...(body as any), model: model.replace('happupy/', '') };
    return forwardHappupy('/v1/chat/completions', 'POST', fwdBody, options);
  }

  // Default: auto-fallback through all active providers
  const messages = (body as any).messages || [];
  const prompt = messages.map((m: any) => m.content).join('\n') || '';

  const candidateProviders = [
    { name: 'Pollinations', prefix: 'pollinations', fn: () => forwardPollinations('/v1/chat/completions', 'POST', body, options) },
    { name: 'VoidAI',       prefix: 'voidai',       fn: () => forwardVoidAI('/chat/completions', 'POST', body, options) },
    { name: 'Cerebras',     prefix: 'cerebras',     fn: () => forwardCerebras('/chat/completions', 'POST', body, options) },
    { name: 'Groq',         prefix: 'groq',         fn: () => forwardGroq('/chat/completions', 'POST', body, options) },
    { name: 'AIHorde',      prefix: 'aihorde',      fn: () => forwardAIHorde('/generate/text/async', 'POST', { prompt, params: { max_length: (body as any).max_tokens || 80 } }, options) },
    { name: 'TokenReply',   prefix: 'tokenreply',   fn: () => forwardTokenReply('/chat/completions', 'POST', body, options) },
    { name: 'NagaAI',       prefix: 'nagaai',       fn: () => forwardNagaAI('/chat/completions', 'POST', body, options) },
    { name: 'Happupy',      prefix: 'happupy',      fn: () => forwardHappupy('/v1/chat/completions', 'POST', body, options) },
  ].filter(p => active.has(p.prefix));

  if (candidateProviders.length === 0) {
    throw Object.assign(
      new Error('No providers are active yet. Donate API keys at /donate to unlock providers.'),
      { status: 503, code: 'no_active_providers' }
    );
  }

  if (!options?.autoFallback) {
    return candidateProviders[0].fn();
  }

  return tryProviders(candidateProviders);
}

export async function routeImages(
  body: unknown,
  options?: RouteOptions
) {
  const model = (body as any)?.model || 'gpt-image-2-free';

  // Check if this is a virtual model with multiple providers
  const virtualProviders = await getVirtualModelProviders(model);
  if (virtualProviders && virtualProviders.some(p => p.type === 'image')) {
    return routeVirtualImages(body, virtualProviders.filter(p => p.type === 'image'), options);
  }

  if (model === 'pollinations/image-simple') {
    const prompt = (body as any)?.prompt;
    if (!prompt) throw new Error('prompt is required');
    return forwardSimpleImage(prompt);
  }

  if (model.startsWith('pollinations/')) {
    const fwdBody = { ...(body as any), model: model.replace('pollinations/', '') };
    return forwardPollinations('/v1/images/generations', 'POST', fwdBody);
  }

  if (model.startsWith('voidai/')) {
    const fwdBody = { ...(body as any), model: model.replace('voidai/', '') };
    return forwardVoidAI('/images/generations', 'POST', fwdBody);
  }

  if (model.startsWith('airforce/')) {
    const fwdBody = { ...(body as any), model: model.replace('airforce/', '') };
    return forwardAirforce('/images/generations', 'POST', fwdBody);
  }

  if (model.startsWith('aihorde/')) {
    const prompt = (body as any)?.prompt || '';
    const fwdBody = {
      prompt,
      models: [model.replace('aihorde/', '')],
      params: {
        sampler_name: 'k_euler',
        cfg_scale: 7,
        denoise: 1.0,
        steps: 20,
      },
    };
    return forwardAIHorde('/generate/async', 'POST', fwdBody);
  }

  if (model.startsWith('nagaai/')) {
    const fwdBody = { ...(body as any), model: model.replace('nagaai/', '') };
    return forwardNagaAI('/images/generations', 'POST', fwdBody);
  }

  if (model.startsWith('happupy/')) {
    const fwdBody = { ...(body as any), model: model.replace('happupy/', '') };
    return forwardHappupy('/v1/images/generations', 'POST', fwdBody);
  }

  // Default: try Pollinations → VoidAI → Airforce → AIHorde → NagaAI → Happupy
  if (!options?.autoFallback) {
    return forwardPollinations('/v1/images/generations', 'POST', body);
  }

  const prompt = (body as any)?.prompt || '';
  return tryProviders([
    { name: 'Pollinations', fn: () => forwardPollinations('/v1/images/generations', 'POST', body) },
    { name: 'VoidAI',      fn: () => forwardVoidAI('/images/generations', 'POST', body) },
    { name: 'Airforce',    fn: () => forwardAirforce('/images/generations', 'POST', body) },
    { name: 'AIHorde',     fn: () => forwardAIHorde('/generate/async', 'POST', {
      prompt,
      models: ['stable_diffusion'],
      params: { sampler_name: 'k_euler', cfg_scale: 7, denoise: 1.0, steps: 20 },
    }) },
    { name: 'NagaAI',      fn: () => forwardNagaAI('/images/generations', 'POST', body) },
    { name: 'Happupy',     fn: () => forwardHappupy('/v1/images/generations', 'POST', body) },
  ]);
}

export async function routeVideo(
  body: unknown,
  options?: RouteOptions
) {
  const model = (body as any)?.model || 'pollinations/text-to-video';

  const virtualProviders = await getVirtualModelProviders(model);
  if (virtualProviders && virtualProviders.some(p => p.type === 'video')) {
    return routeVirtualVideo(body, virtualProviders.filter(p => p.type === 'video'), options);
  }

  // Airforce video endpoint
  if (model.startsWith('airforce/')) {
    const fwdBody = { ...(body as any), model: model.replace('airforce/', '') };
    return forwardAirforce('/video/generations', 'POST', fwdBody);
  }

  // Default: Pollinations for video (uses GET /video/{prompt})
  if (model.startsWith('pollinations/')) {
    const prompt = (body as any)?.prompt || '';
    const modelId = model.replace('pollinations/', '');
    return forwardPollinationsVideo(prompt, modelId);
  }

  const prompt = (body as any)?.prompt || '';
  return forwardPollinationsVideo(prompt);
}

export async function routeAudio(
  body: unknown,
  options?: RouteOptions
) {
  const model = (body as any)?.model || 'tts-1';

  const virtualProviders = await getVirtualModelProviders(model);
  if (virtualProviders && virtualProviders.some(p => p.type === 'audio')) {
    return routeVirtualAudio(body, virtualProviders.filter(p => p.type === 'audio'), options);
  }

  if (model.startsWith('pollinations/')) {
    const fwdBody = { ...(body as any), model: model.replace('pollinations/', '') };
    return forwardPollinations('/v1/audio/speech', 'POST', fwdBody);
  }

  if (model.startsWith('voidai/')) {
    const fwdBody = { ...(body as any), model: model.replace('voidai/', '') };
    return forwardVoidAI('/audio/speech', 'POST', fwdBody);
  }

  if (model.startsWith('airforce/')) {
    const fwdBody = { ...(body as any), model: model.replace('airforce/', '') };
    return forwardAirforce('/audio/speech', 'POST', fwdBody);
  }

  if (model.startsWith('groq/')) {
    const fwdBody = { ...(body as any), model: model.replace('groq/', '') };
    return forwardGroq('/audio/speech', 'POST', fwdBody);
  }

  if (model.startsWith('nagaai/')) {
    const fwdBody = { ...(body as any), model: model.replace('nagaai/', '') };
    return forwardNagaAI('/audio/speech', 'POST', fwdBody);
  }

  // Default: try Pollinations → VoidAI → Airforce → Groq → NagaAI
  if (!options?.autoFallback) {
    return forwardPollinations('/v1/audio/speech', 'POST', body);
  }

  return tryProviders([
    { name: 'Pollinations', fn: () => forwardPollinations('/v1/audio/speech', 'POST', body) },
    { name: 'VoidAI',      fn: () => forwardVoidAI('/audio/speech', 'POST', body) },
    { name: 'Airforce',    fn: () => forwardAirforce('/audio/speech', 'POST', body) },
    { name: 'Groq',        fn: () => forwardGroq('/audio/speech', 'POST', body) },
    { name: 'NagaAI',     fn: () => forwardNagaAI('/audio/speech', 'POST', body) },
  ]);
}

export async function routeMusic(
  body: unknown,
  options?: RouteOptions
) {
  // Music generation is Airforce only
  return forwardAirforce('/audio/music', 'POST', body, options);
}

export async function routeSoundEffects(
  body: unknown,
  options?: RouteOptions
) {
  // Sound effects generation is Airforce only
  return forwardAirforce('/audio/sound-effects', 'POST', body, options);
}

export async function routeEmbeddings(
  body: unknown,
  options?: RouteOptions
) {
  const model = (body as any)?.model || 'text-embedding-ada-002';

  const virtualProviders = await getVirtualModelProviders(model);
  if (virtualProviders && virtualProviders.some(p => p.type === 'embedding')) {
    return routeVirtualEmbeddings(body, virtualProviders.filter(p => p.type === 'embedding'), options);
  }

  if (model.startsWith('pollinations/')) {
    const fwdBody = { ...(body as any), model: model.replace('pollinations/', '') };
    return forwardPollinations('/v1/embeddings', 'POST', fwdBody);
  }

  if (model.startsWith('voidai/')) {
    const fwdBody = { ...(body as any), model: model.replace('voidai/', '') };
    return forwardVoidAI('/embeddings', 'POST', fwdBody);
  }

  if (model.startsWith('airforce/')) {
    const fwdBody = { ...(body as any), model: model.replace('airforce/', '') };
    return forwardAirforce('/embeddings', 'POST', fwdBody);
  }

  // Default: try Pollinations → VoidAI → Airforce
  if (!options?.autoFallback) {
    return forwardPollinations('/v1/embeddings', 'POST', body);
  }

  return tryProviders([
    { name: 'Pollinations', fn: () => forwardPollinations('/v1/embeddings', 'POST', body) },
    { name: 'VoidAI',      fn: () => forwardVoidAI('/embeddings', 'POST', body) },
    { name: 'Airforce',    fn: () => forwardAirforce('/embeddings', 'POST', body) },
  ]);
}

export async function routeTranscription(
  body: unknown,
  options?: RouteOptions
) {
  const model = (body as any)?.model || 'whisper-1';

  const virtualProviders = await getVirtualModelProviders(model);
  if (virtualProviders && virtualProviders.some(p => p.type === 'transcription')) {
    return routeVirtualTranscription(body, virtualProviders.filter(p => p.type === 'transcription'), options);
  }

  if (model.startsWith('voidai/')) {
    const fwdBody = { ...(body as any), model: model.replace('voidai/', '') };
    return forwardVoidAI('/audio/transcriptions', 'POST', fwdBody);
  }

  if (model.startsWith('airforce/')) {
    const fwdBody = { ...(body as any), model: model.replace('airforce/', '') };
    return forwardAirforce('/audio/transcriptions', 'POST', fwdBody);
  }

  if (model.startsWith('groq/')) {
    const fwdBody = { ...(body as any), model: model.replace('groq/', '') };
    return forwardGroq('/audio/transcriptions', 'POST', fwdBody);
  }

  if (model.startsWith('nagaai/')) {
    const fwdBody = { ...(body as any), model: model.replace('nagaai/', '') };
    return forwardNagaAI('/audio/transcriptions', 'POST', fwdBody);
  }

  // Default: try VoidAI → Airforce → Groq → NagaAI
  if (!options?.autoFallback) {
    return forwardVoidAI('/audio/transcriptions', 'POST', body);
  }

  return tryProviders([
    { name: 'VoidAI',   fn: () => forwardVoidAI('/audio/transcriptions', 'POST', body) },
    { name: 'Airforce', fn: () => forwardAirforce('/audio/transcriptions', 'POST', body) },
    { name: 'Groq',     fn: () => forwardGroq('/audio/transcriptions', 'POST', body) },
    { name: 'NagaAI',  fn: () => forwardNagaAI('/audio/transcriptions', 'POST', body) },
  ]);
}

function inferType(id: string): string {
  const s = id.toLowerCase();
  if (/imagen|image|flux|dall-e|gptimage|zimage|klein|kontext|suno/.test(s)) return 'image';
  if (/video|reel|ltx/.test(s)) return 'video';
  if (/\btts\b|openai-audio|qwen-tts|acestep|elevenlabs-music/.test(s)) return 'audio';
  if (/whisper|scribe|transcri|universal-2/.test(s)) return 'transcription';
  if (/embed/.test(s)) return 'embedding';
  if (/elevenlabs-sfx|elevenlabs-dubbing|elevenlabs-isolation|voice.?changer/.test(s)) return 'audio';
  return 'text';
}

function inferAirforceType(m: any): string {
  const id = (m.id || '').toLowerCase();
  if (m.sfx_caps || m.audio_caps || m.dubbing_caps) return 'audio';
  if (/suno/.test(id)) return 'audio';
  if (/imagen|image|flux|z-image/.test(id)) return 'image';
  if (/scribe|transcri/.test(id)) return 'transcription';
  if (/isolation|voice.?changer/.test(id)) return 'audio';
  if (m.supports_images && !m.supports_chat) return 'image';
  return 'text';
}

const POLLINATIONS_FREE_MODELS = [
  // Text / Chat (free tier only)
  { id: 'pollinations/nova-fast',            object: 'model', owned_by: 'Amazon',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/mistral',              object: 'model', owned_by: 'Mistral',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/llama-scout',          object: 'model', owned_by: 'Meta',             provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/qwen-coder',           object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/llama',                object: 'model', owned_by: 'Meta',             provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/gemini-fast',          object: 'model', owned_by: 'Google',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/mistral-4',            object: 'model', owned_by: 'Mistral',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/openai',               object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/qwen-vision',          object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/perplexity-fast',      object: 'model', owned_by: 'Perplexity',       provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/gemini-search',        object: 'model', owned_by: 'Google',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/qwen-safety',          object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/nova',                 object: 'model', owned_by: 'Amazon',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/openai-fast',          object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/deepseek',             object: 'model', owned_by: 'DeepSeek',         provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/minimax',              object: 'model', owned_by: 'MiniMax',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/openai-audio',         object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/midijourney',          object: 'model', owned_by: 'MIDIjourney',      provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/qwen-vision-pro',      object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/kimi',                 object: 'model', owned_by: 'Moonshot',         provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/mistral-large',        object: 'model', owned_by: 'Mistral',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/qwen-coder-large',     object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/claude-fast',          object: 'model', owned_by: 'Anthropic',        provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/perplexity-reasoning', object: 'model', owned_by: 'Perplexity',       provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/glm',                  object: 'model', owned_by: 'Z.ai',             provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/grok',                 object: 'model', owned_by: 'xAI',              provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/kimi-k2.6',            object: 'model', owned_by: 'Moonshot',         provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/qwen-large',           object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/openai-large',         object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/polly',                object: 'model', owned_by: '@Itachi-1824',     provider: 'Pollinations', type: 'text' },
  // Image (free tier only)
  { id: 'pollinations/flux',                 object: 'model', owned_by: 'Black Forest Labs', provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/zimage',               object: 'model', owned_by: 'ZImage',           provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/klein',                object: 'model', owned_by: 'Black Forest Labs', provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/gptimage',             object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/kontext',              object: 'model', owned_by: 'Black Forest Labs', provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/image-simple',         object: 'model', owned_by: 'Pollinations',     provider: 'Pollinations', type: 'image' },
  // Video (free tier only)
  { id: 'pollinations/nova-reel',            object: 'model', owned_by: 'Amazon',           provider: 'Pollinations', type: 'video' },
  // Audio / TTS (free tier only)
  { id: 'pollinations/qwen-tts',             object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'audio' },
  { id: 'pollinations/acestep',              object: 'model', owned_by: 'ACE',              provider: 'Pollinations', type: 'audio' },
  // Transcription (free tier only)
  { id: 'pollinations/whisper',              object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'transcription' },
  { id: 'pollinations/universal-2',          object: 'model', owned_by: 'AssemblyAI',       provider: 'Pollinations', type: 'transcription' },
  { id: 'pollinations/scribe',               object: 'model', owned_by: 'ElevenLabs',       provider: 'Pollinations', type: 'transcription' },
  // Embeddings (free tier only)
  { id: 'pollinations/openai-3-small',       object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'embedding' },
  { id: 'pollinations/openai-3-large',       object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'embedding' },
];

const GROQ_FREE_MODELS = [
  // Chat Completions
  { id: 'groq/llama-3.1-8b-instant',           object: 'model', owned_by: 'Meta',             provider: 'Groq', type: 'text' },
  { id: 'groq/llama-3.3-70b-versatile',        object: 'model', owned_by: 'Meta',             provider: 'Groq', type: 'text' },
  { id: 'groq/llama-4-scout-17b-16e-instruct', object: 'model', owned_by: 'Meta',             provider: 'Groq', type: 'text' },
  { id: 'groq/qwen/qwen3-32b',                 object: 'model', owned_by: 'Alibaba',          provider: 'Groq', type: 'text' },
  { id: 'groq/openai/gpt-oss-120b',            object: 'model', owned_by: 'OpenAI',           provider: 'Groq', type: 'text' },
  { id: 'groq/openai/gpt-oss-20b',             object: 'model', owned_by: 'OpenAI',           provider: 'Groq', type: 'text' },
  { id: 'groq/openai/gpt-oss-safeguard-20b',   object: 'model', owned_by: 'OpenAI',           provider: 'Groq', type: 'text' },
  { id: 'groq/meta-llama/llama-prompt-guard-2-22m', object: 'model', owned_by: 'Meta',      provider: 'Groq', type: 'text' },
  { id: 'groq/meta-llama/llama-prompt-guard-2-86m', object: 'model', owned_by: 'Meta',      provider: 'Groq', type: 'text' },
  { id: 'groq/allam-2-7b',                     object: 'model', owned_by: 'Arabic Llama',     provider: 'Groq', type: 'text' },
  { id: 'groq/compound',                       object: 'model', owned_by: 'Compound',         provider: 'Groq', type: 'text' },
  { id: 'groq/compound-mini',                  object: 'model', owned_by: 'Compound',         provider: 'Groq', type: 'text' },
  // Speech-to-Text (Transcription)
  { id: 'groq/whisper-large-v3',               object: 'model', owned_by: 'OpenAI',           provider: 'Groq', type: 'transcription' },
  { id: 'groq/whisper-large-v3-turbo',         object: 'model', owned_by: 'OpenAI',           provider: 'Groq', type: 'transcription' },
  // Text-to-Speech
  { id: 'groq/canopylabs/orpheus-v1-english',  object: 'model', owned_by: 'Canopy',           provider: 'Groq', type: 'audio' },
  { id: 'groq/canopylabs/orpheus-arabic-saudi', object: 'model', owned_by: 'Canopy',          provider: 'Groq', type: 'audio' },
];

const TOKENREPLY_FREE_MODELS = [
  { id: 'tokenreply/deepseek-ai/deepseek-v4-flash',             object: 'model', owned_by: 'DeepSeek',    provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/deepseek-ai/deepseek-v4-pro',               object: 'model', owned_by: 'DeepSeek',    provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/google/gemma-3n-e2b-it',                    object: 'model', owned_by: 'Google',      provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/google/gemma-3n-e4b-it',                    object: 'model', owned_by: 'Google',      provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/google/gemma-4-31b-it',                     object: 'model', owned_by: 'Google',      provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/grok-4.20-fast',                            object: 'model', owned_by: 'xAI',         provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/minimaxai/minimax-m2.7',                    object: 'model', owned_by: 'MiniMax',     provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/moonshotai/kimi-k2.6',                      object: 'model', owned_by: 'Moonshot',    provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/openai/gpt-oss-120b',                       object: 'model', owned_by: 'OpenAI',      provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/qwen/qwen3-coder-480b-a35b-instruct',       object: 'model', owned_by: 'Alibaba',     provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/qwen/qwen3.5-397b-a17b',                    object: 'model', owned_by: 'Alibaba',     provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/stepfun-ai/step-3.5-flash',                 object: 'model', owned_by: 'StepFun',     provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/z-ai/glm-5.1',                              object: 'model', owned_by: 'Z.ai',        provider: 'TokenReply', type: 'text' },
  { id: 'tokenreply/z-ai/glm5',                                 object: 'model', owned_by: 'Z.ai',        provider: 'TokenReply', type: 'text' },
];

const NAGAAI_FREE_MODELS = [
  // Text / Chat
  { id: 'nagaai/glm-4.5-air',                      object: 'model', owned_by: 'Z.ai',             provider: 'NagaAI', type: 'text' },
  { id: 'nagaai/nvidia/nemotron-3-super',           object: 'model', owned_by: 'Nvidia',           provider: 'NagaAI', type: 'text' },
  { id: 'nagaai/gemini-2.5-flash',                  object: 'model', owned_by: 'Google',           provider: 'NagaAI', type: 'text' },
  { id: 'nagaai/llama-3.3-70b-instruct',            object: 'model', owned_by: 'Meta',             provider: 'NagaAI', type: 'text' },
  { id: 'nagaai/sonar',                             object: 'model', owned_by: 'Perplexity',       provider: 'NagaAI', type: 'text' },
  { id: 'nagaai/llama-4-scout-17b-16e-instruct',    object: 'model', owned_by: 'Meta',             provider: 'NagaAI', type: 'text' },
  { id: 'nagaai/gpt-4.1-mini',                      object: 'model', owned_by: 'OpenAI',           provider: 'NagaAI', type: 'text' },
  // Audio TTS
  { id: 'nagaai/eleven-multilingual-v2',             object: 'model', owned_by: 'ElevenLabs',      provider: 'NagaAI', type: 'audio' },
  { id: 'nagaai/gpt-4o-mini-tts',                   object: 'model', owned_by: 'OpenAI',           provider: 'NagaAI', type: 'audio' },
  // Image Generation
  { id: 'nagaai/dall-e-3',                          object: 'model', owned_by: 'OpenAI',           provider: 'NagaAI', type: 'image' },
  { id: 'nagaai/flux-1-schnell',                    object: 'model', owned_by: 'Black Forest Labs', provider: 'NagaAI', type: 'image' },
  { id: 'nagaai/sdxl',                              object: 'model', owned_by: 'StabilityAI',      provider: 'NagaAI', type: 'image' },
  // Transcription
  { id: 'nagaai/whisper-large-v3',                  object: 'model', owned_by: 'OpenAI',           provider: 'NagaAI', type: 'transcription' },
];

const AIHORDE_FREE_MODELS = [
  // Text Generation (26 models)
  { id: 'aihorde/aphrodite-Cydonia-24B-v4.3',            object: 'model', owned_by: 'Cydonia',            provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/aphrodite-Behemoth-X-123B-v2.1',        object: 'model', owned_by: 'Behemoth',           provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/aphrodite-Skyfall-31B-v4.1',            object: 'model', owned_by: 'Skyfall',            provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-Cydonia-24B-v4.3',            object: 'model', owned_by: 'Cydonia',            provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-L3-8B-Stheno-v3.2',           object: 'model', owned_by: 'Stheno',             provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-Qwen-Qwen3-0.6B',             object: 'model', owned_by: 'Qwen',               provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-Behemoth-R1-123B-v2',         object: 'model', owned_by: 'Behemoth',           provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-Angelic-Eclipse-12B',         object: 'model', owned_by: 'Angelic Eclipse',    provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-Artemis-31B-v1b',             object: 'model', owned_by: 'Artemis',            provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-Impish-Magic-24B',            object: 'model', owned_by: 'Impish Magic',       provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-L3-Super-Nova-RP-8B',         object: 'model', owned_by: 'L3 Nova',            provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-Llama-3-Lumimaid-8B',         object: 'model', owned_by: 'Lumimaid',           provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-Magidonia-24B-v4.3',          object: 'model', owned_by: 'Magidonia',          provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-mini-magnum-12b-v1.1',        object: 'model', owned_by: 'Mini Magnum',        provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-Qwen-Qwen3.6-35B',            object: 'model', owned_by: 'Qwen',               provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-Qwen-Qwen3.5-0.8B',           object: 'model', owned_by: 'Qwen',               provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-WizzGPTv8',                   object: 'model', owned_by: 'WizzGPT',            provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-Gemma-4-E4B',                 object: 'model', owned_by: 'Gemma',              provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-Cerebras-GPT-111M',           object: 'model', owned_by: 'Cerebras',           provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-pythia-70m',                  object: 'model', owned_by: 'EleutherAI',         provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/koboldcpp-pygmalion-2-7b',              object: 'model', owned_by: 'Pygmalion',          provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/mradermacher-Qwen3.6-35B',              object: 'model', owned_by: 'Qwen',               provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/slm-Kai-0.35B-Instruct',                object: 'model', owned_by: 'Kai',                provider: 'AIHorde', type: 'text' },
  // Image Generation (160+ models) - Updated from API list
  { id: 'aihorde/stable_diffusion',                      object: 'model', owned_by: 'Stability AI',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/WAI-NSFW-illustrious-SDXL',             object: 'model', owned_by: 'WAI NSFW',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/AlbedoBase-XL-3.1',                     object: 'model', owned_by: 'AlbedoBase',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/AlbedoBase-XL-SDXL',                    object: 'model', owned_by: 'AlbedoBase',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/AMPonyXL',                              object: 'model', owned_by: 'AMPony',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/CyberRealistic-Pony',                   object: 'model', owned_by: 'CyberRealistic',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Deliberate',                            object: 'model', owned_by: 'Deliberate',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Dreamshaper',                           object: 'model', owned_by: 'Dreamshaper',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Flux.1-Schnell-fp8',                    object: 'model', owned_by: 'Black Forest Labs',  provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/ICBINP',                                object: 'model', owned_by: 'ICBINP',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Nova-Anime-XL',                         object: 'model', owned_by: 'Nova Anime',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/AbsoluteReality',                       object: 'model', owned_by: 'Absolute Reality',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Abyss-OrangeMix',                       object: 'model', owned_by: 'Abyss OrangeMix',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Anything-Diffusion',                    object: 'model', owned_by: 'Anything',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Anything-Diffusion-Inpainting',         object: 'model', owned_by: 'Anything',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/A-Zovya-RPG-Inpainting',                object: 'model', owned_by: 'A-Zovya',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/BlenderMix-Pony',                       object: 'model', owned_by: 'BlenderMix',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Deliberate-Inpainting',                 object: 'model', owned_by: 'Deliberate',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/DreamShaper-Inpainting',                object: 'model', owned_by: 'DreamShaper',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Epic-Diffusion-Inpainting',             object: 'model', owned_by: 'Epic Diffusion',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Hassaku-XL',                            object: 'model', owned_by: 'Hassaku',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Hentai-Diffusion',                      object: 'model', owned_by: 'Hentai Diffusion',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/iCoMix-Inpainting',                     object: 'model', owned_by: 'iCoMix',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Juggernaut-XL',                         object: 'model', owned_by: 'Juggernaut',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/NatViS',                                object: 'model', owned_by: 'NatViS',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/NeverEnding-Dream',                     object: 'model', owned_by: 'NeverEndingDream',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/NTR-MIX-IL-Noob-XL',                    object: 'model', owned_by: 'NTR MIX',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Pony-Diffusion-XL',                     object: 'model', owned_by: 'Pony Diffusion',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Realistic-Vision-Inpainting',           object: 'model', owned_by: 'Realistic Vision',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/SDXL-1.0',                              object: 'model', owned_by: 'Stability AI',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/stable_diffusion_2.1',                  object: 'model', owned_by: 'Stability AI',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/stable_diffusion_inpainting',           object: 'model', owned_by: 'Stability AI',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/WAI-ANI-NSFW-PONYXL',                   object: 'model', owned_by: 'WAI ANI NSFW',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Z-Image-Turbo',                         object: 'model', owned_by: 'Z-Image',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/2DN',                                   object: 'model', owned_by: '2DN',                provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/526Mix-Animated',                       object: 'model', owned_by: '526Mix',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/AAM-XL',                                object: 'model', owned_by: 'AAM XL',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/AbyssOrangeMix-AfterDark',              object: 'model', owned_by: 'Abyss OrangeMix',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/ACertainThing',                         object: 'model', owned_by: 'A Certain Thing',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/AIO-Pixel-Art',                         object: 'model', owned_by: 'AIO Pixel',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Analog-Diffusion',                      object: 'model', owned_by: 'Analog Diffusion',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Analog-Madness',                        object: 'model', owned_by: 'Analog Madness',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Animagine-XL',                          object: 'model', owned_by: 'Animagine',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Anime-Illust-Diffusion-XL',             object: 'model', owned_by: 'Anime Illust',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Anime-Pencil-Diffusion',                object: 'model', owned_by: 'Anime Pencil',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Anygen',                                object: 'model', owned_by: 'Anygen',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/AnyLoRA',                               object: 'model', owned_by: 'AnyLoRA',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Anything-v3',                           object: 'model', owned_by: 'Anything V3',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Anything-v5',                           object: 'model', owned_by: 'Anything V5',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/App-Icon-Diffusion',                    object: 'model', owned_by: 'App Icon',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Art-Of-MTG',                            object: 'model', owned_by: 'Art Of MTG',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Aurora',                                object: 'model', owned_by: 'Aurora',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Babes',                                 object: 'model', owned_by: 'Babes',              provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/BB95-Furry-Mix',                        object: 'model', owned_by: 'BB95 Furry',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/BB95-Furry-Mix-v14',                    object: 'model', owned_by: 'BB95 Furry V14',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/BigASP',                                object: 'model', owned_by: 'BigASP',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Blank-Canvas-XL',                       object: 'model', owned_by: 'Blank Canvas',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/BweshMix',                              object: 'model', owned_by: 'BweshMix',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/CamelliaMix-2.5D',                      object: 'model', owned_by: 'CamelliaMix',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Cetus-Mix',                             object: 'model', owned_by: 'Cetus Mix',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Cheese-Daddys-Landscape',               object: 'model', owned_by: 'Cheese Daddys',      provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Cheyenne',                              object: 'model', owned_by: 'Cheyenne',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/ChilloutMix',                           object: 'model', owned_by: 'ChilloutMix',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Comic-Diffusion',                       object: 'model', owned_by: 'Comic Diffusion',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Counterfeit',                           object: 'model', owned_by: 'Counterfeit',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/CyriousMix',                            object: 'model', owned_by: 'CyriousMix',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Dan-Mumford-Style',                     object: 'model', owned_by: 'Dan Mumford',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Dark-Sushi-Mix',                        object: 'model', owned_by: 'Dark Sushi Mix',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Deliberate-3.0',                        object: 'model', owned_by: 'Deliberate 3.0',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Double-Exposure-Diffusion',             object: 'model', owned_by: 'Double Exposure',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Dreamlike-Diffusion',                   object: 'model', owned_by: 'Dreamlike',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/DreamlikeSamKuvshinov',                 object: 'model', owned_by: 'Dreamlike',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/DreamShaper-XL',                        object: 'model', owned_by: 'DreamShaper',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/DucHaiten',                             object: 'model', owned_by: 'DucHaiten',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/DucHaiten-Classic-Anime',               object: 'model', owned_by: 'DucHaiten Anime',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Dungeons-and-Diffusion',                object: 'model', owned_by: 'Dungeons & D',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Dungeons-n-Waifus',                     object: 'model', owned_by: 'Dungeons n Waifus',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Edge-Of-Realism',                       object: 'model', owned_by: 'Edge Of Realism',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Eimis-Anime-Diffusion',                 object: 'model', owned_by: 'Eimis Anime',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Elysium-Anime',                         object: 'model', owned_by: 'Elysium Anime',      provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Epic-Diffusion',                        object: 'model', owned_by: 'Epic Diffusion',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Ether-Real-Mix',                        object: 'model', owned_by: 'Ether Real Mix',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Experience',                            object: 'model', owned_by: 'Experience',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/ExpMix-Line',                           object: 'model', owned_by: 'ExpMix Line',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/FaeTastic',                             object: 'model', owned_by: 'FaeTastic',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Fantasy-Card-Diffusion',                object: 'model', owned_by: 'Fantasy Card',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Flat-2D-Animerge',                      object: 'model', owned_by: 'Flat 2D Animerge',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Furry-Epoch',                           object: 'model', owned_by: 'Furry Epoch',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Fustercluck',                           object: 'model', owned_by: 'Fustercluck',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Galena-Redux',                          object: 'model', owned_by: 'Galena Redux',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Ghibli-Diffusion',                      object: 'model', owned_by: 'Ghibli Diffusion',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/GhostMix',                              object: 'model', owned_by: 'GhostMix',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Grapefruit-Hentai',                     object: 'model', owned_by: 'Grapefruit',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/GTA5-Artwork-Diffusion',                object: 'model', owned_by: 'GTA5 Artwork',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/HASDX',                                 object: 'model', owned_by: 'HASDX',              provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Healy-s-Anime-Blend',                   object: 'model', owned_by: 'Healys Anime',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/HolyMix-ILXL',                          object: 'model', owned_by: 'HolyMix ILXL',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/HRL',                                   object: 'model', owned_by: 'HRL',                provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/ICBINP-XL',                             object: 'model', owned_by: 'ICBINP XL',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/iCoMix',                                object: 'model', owned_by: 'iCoMix',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Illuminati-Diffusion',                  object: 'model', owned_by: 'Illuminati',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Inkpunk-Diffusion',                     object: 'model', owned_by: 'Inkpunk',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Jim-Eidomode',                          object: 'model', owned_by: 'Jim Eidomode',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/KaynegIllustriousXL',                   object: 'model', owned_by: 'Kayneg Illustrious', provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Lawlas-yiff-mix',                       object: 'model', owned_by: 'Lawlas',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Liberty',                               object: 'model', owned_by: 'Liberty',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Lyriel',                                object: 'model', owned_by: 'Lyriel',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/majicMIX-realistic',                    object: 'model', owned_by: 'MajicMIX',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/MeinaMix',                              object: 'model', owned_by: 'MeinaMix',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/MHXL-Aventis-Horizon',                  object: 'model', owned_by: 'MHXL',               provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Midjourney-PaintArt',                   object: 'model', owned_by: 'Midjourney',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Mistoon-Anime',                         object: 'model', owned_by: 'Mistoon Anime',      provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/ModernArt-Diffusion',                   object: 'model', owned_by: 'ModernArt',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/MoonMix-Fantasy',                       object: 'model', owned_by: 'MoonMix Fantasy',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Movie-Diffusion',                       object: 'model', owned_by: 'Movie Diffusion',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Neurogen',                              object: 'model', owned_by: 'Neurogen',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/NEW-ERA',                               object: 'model', owned_by: 'NEW ERA',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/noobEvo',                               object: 'model', owned_by: 'NoobEvo',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/noob_v_pencil-XL',                      object: 'model', owned_by: 'NoobPencil XL',      provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Nova-Furry-Pony',                       object: 'model', owned_by: 'Nova Furry',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Pastel-Mix',                            object: 'model', owned_by: 'Pastel Mix',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Perfect-World',                         object: 'model', owned_by: 'Perfect World',      provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Photon',                                object: 'model', owned_by: 'Photon',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Poison',                                object: 'model', owned_by: 'Poison',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Pony-Realism',                          object: 'model', owned_by: 'Pony Realism',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/PPP',                                   object: 'model', owned_by: 'PPP',                provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Prefect-Pony',                          object: 'model', owned_by: 'Prefect Pony',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Pretty-2.5D',                           object: 'model', owned_by: 'Pretty 2.5D',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Project-Unreal-Engine-5',               object: 'model', owned_by: 'Project UE5',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Quiet-Goodnight-XL',                    object: 'model', owned_by: 'Quiet Goodnight',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/RealBiter',                             object: 'model', owned_by: 'RealBiter',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Real-Dos-Mix',                          object: 'model', owned_by: 'Real Dos Mix',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Realism-Engine',                        object: 'model', owned_by: 'Realism Engine',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Realistic-Vision',                      object: 'model', owned_by: 'Realistic Vision',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Reliberate',                            object: 'model', owned_by: 'Reliberate',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Rev-Animated',                          object: 'model', owned_by: 'Rev Animated',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/RPG',                                   object: 'model', owned_by: 'RPG',                provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Sci-Fi-Diffusion',                      object: 'model', owned_by: 'Sci-Fi Diffusion',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/SD-Silicon',                            object: 'model', owned_by: 'SD Silicon',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Something',                             object: 'model', owned_by: 'Something',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Stable-Cascade-1.0',                    object: 'model', owned_by: 'Stable Cascade',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/SwamPonyXL',                            object: 'model', owned_by: 'SwamPonyXL',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/ToonYou',                               object: 'model', owned_by: 'ToonYou',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/TUNIX-Pony',                            object: 'model', owned_by: 'TUNIX Pony',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Uhmami',                                object: 'model', owned_by: 'Uhmami',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Unstable-Diffusers-XL',                 object: 'model', owned_by: 'Unstable Diffusers', provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Unstable-Ink-Dream',                    object: 'model', owned_by: 'Unstable Ink',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/URPM',                                  object: 'model', owned_by: 'URPM',               provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Vector-Art',                            object: 'model', owned_by: 'Vector Art',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/WAI-CUTE-Pony',                         object: 'model', owned_by: 'WAI CUTE Pony',      provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/waifu_diffusion',                       object: 'model', owned_by: 'Waifu Diffusion',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Western-Animation-Diffusion',           object: 'model', owned_by: 'Western Animation',  provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/White-Pony-Diffusion-4',                object: 'model', owned_by: 'White Pony D4',      provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Woop-Woop-Photo',                       object: 'model', owned_by: 'Woop Woop Photo',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Yiffy',                                 object: 'model', owned_by: 'Yiffy',              provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/ZavyChromaXL',                          object: 'model', owned_by: 'ZavyChromaXL',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Zeipher-Female-Model',                  object: 'model', owned_by: 'Zeipher',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/DucHaiten-GameArt-Unreal-Pony',         object: 'model', owned_by: 'DucHaiten GameArt',  provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Qwen-Image-fp8',                        object: 'model', owned_by: 'Qwen Image',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/Ultraspice',                            object: 'model', owned_by: 'Ultraspice',         provider: 'AIHorde', type: 'image' },
];

// Coming Soon providers — shown in /v1/models but not yet routable (no keys configured)
const COMING_SOON_MODELS = [
  // Google AI Studio — Gemini 2.0/2.5, 1500 req/day free
  { id: 'gemini/gemini-2.5-flash',          object: 'model', owned_by: 'Google',      provider: 'Gemini',      type: 'text',  status: 'coming_soon' },
  { id: 'gemini/gemini-2.5-pro',            object: 'model', owned_by: 'Google',      provider: 'Gemini',      type: 'text',  status: 'coming_soon' },
  { id: 'gemini/gemini-2.0-flash',          object: 'model', owned_by: 'Google',      provider: 'Gemini',      type: 'text',  status: 'coming_soon' },
  { id: 'gemini/gemini-2.0-flash-lite',     object: 'model', owned_by: 'Google',      provider: 'Gemini',      type: 'text',  status: 'coming_soon' },

  // OpenRouter — 30+ free models under one key
  { id: 'openrouter/meta-llama/llama-3.3-70b-instruct:free', object: 'model', owned_by: 'Meta',    provider: 'OpenRouter', type: 'text', status: 'coming_soon' },
  { id: 'openrouter/deepseek/deepseek-r1:free',              object: 'model', owned_by: 'DeepSeek', provider: 'OpenRouter', type: 'text', status: 'coming_soon' },
  { id: 'openrouter/google/gemma-3-27b-it:free',             object: 'model', owned_by: 'Google',  provider: 'OpenRouter', type: 'text', status: 'coming_soon' },
  { id: 'openrouter/mistralai/mistral-7b-instruct:free',     object: 'model', owned_by: 'Mistral', provider: 'OpenRouter', type: 'text', status: 'coming_soon' },
  { id: 'openrouter/qwen/qwen3-8b:free',                     object: 'model', owned_by: 'Alibaba', provider: 'OpenRouter', type: 'text', status: 'coming_soon' },

  // NVIDIA NIM — 91 free endpoint models
  { id: 'nvidia/meta/llama-3.3-70b-instruct',  object: 'model', owned_by: 'Meta',     provider: 'NVIDIA NIM', type: 'text', status: 'coming_soon' },
  { id: 'nvidia/deepseek-ai/deepseek-r1',      object: 'model', owned_by: 'DeepSeek', provider: 'NVIDIA NIM', type: 'text', status: 'coming_soon' },
  { id: 'nvidia/nvidia/llama-3.1-nemotron-70b-instruct', object: 'model', owned_by: 'NVIDIA', provider: 'NVIDIA NIM', type: 'text', status: 'coming_soon' },
  { id: 'nvidia/mistralai/mistral-7b-instruct', object: 'model', owned_by: 'Mistral', provider: 'NVIDIA NIM', type: 'text', status: 'coming_soon' },

  // SiliconFlow — fast Chinese inference, Qwen + DeepSeek free
  { id: 'siliconflow/Qwen/Qwen3-8B',                   object: 'model', owned_by: 'Alibaba',  provider: 'SiliconFlow', type: 'text', status: 'coming_soon' },
  { id: 'siliconflow/deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', object: 'model', owned_by: 'DeepSeek', provider: 'SiliconFlow', type: 'text', status: 'coming_soon' },
  { id: 'siliconflow/THUDM/glm-4-9b-chat',              object: 'model', owned_by: 'THUDM',   provider: 'SiliconFlow', type: 'text', status: 'coming_soon' },
  { id: 'siliconflow/Pro/deepseek-ai/DeepSeek-V3',      object: 'model', owned_by: 'DeepSeek', provider: 'SiliconFlow', type: 'text', status: 'coming_soon' },

  // Sambanova Cloud — fastest Llama 4 inference, free
  { id: 'sambanova/Meta-Llama-3.3-70B-Instruct',  object: 'model', owned_by: 'Meta',     provider: 'Sambanova', type: 'text', status: 'coming_soon' },
  { id: 'sambanova/Meta-Llama-4-Scout-17B-16E-Instruct', object: 'model', owned_by: 'Meta', provider: 'Sambanova', type: 'text', status: 'coming_soon' },
  { id: 'sambanova/DeepSeek-R1',                   object: 'model', owned_by: 'DeepSeek', provider: 'Sambanova', type: 'text', status: 'coming_soon' },
  { id: 'sambanova/Qwen3-32B',                     object: 'model', owned_by: 'Alibaba',  provider: 'Sambanova', type: 'text', status: 'coming_soon' },

  // Cloudflare Workers AI — 10k neurons/day free
  { id: 'cloudflare/@cf/meta/llama-3.1-8b-instruct',          object: 'model', owned_by: 'Meta',    provider: 'Cloudflare', type: 'text', status: 'coming_soon' },
  { id: 'cloudflare/@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', object: 'model', owned_by: 'DeepSeek', provider: 'Cloudflare', type: 'text', status: 'coming_soon' },
  { id: 'cloudflare/@cf/qwen/qwen1.5-14b-chat-awq',            object: 'model', owned_by: 'Alibaba', provider: 'Cloudflare', type: 'text', status: 'coming_soon' },

  // Hugging Face Inference — thousands of models
  { id: 'huggingface/meta-llama/Llama-3.3-70B-Instruct', object: 'model', owned_by: 'Meta',    provider: 'HuggingFace', type: 'text', status: 'coming_soon' },
  { id: 'huggingface/Qwen/Qwen3-8B',                     object: 'model', owned_by: 'Alibaba', provider: 'HuggingFace', type: 'text', status: 'coming_soon' },
  { id: 'huggingface/mistralai/Mistral-7B-Instruct-v0.3', object: 'model', owned_by: 'Mistral', provider: 'HuggingFace', type: 'text', status: 'coming_soon' },

  // Mistral AI — 1B tokens/month free
  { id: 'mistral/mistral-small-latest',   object: 'model', owned_by: 'Mistral', provider: 'Mistral AI', type: 'text', status: 'coming_soon' },
  { id: 'mistral/open-mistral-nemo',      object: 'model', owned_by: 'Mistral', provider: 'Mistral AI', type: 'text', status: 'coming_soon' },
  { id: 'mistral/codestral-latest',       object: 'model', owned_by: 'Mistral', provider: 'Mistral AI', type: 'text', status: 'coming_soon' },
  { id: 'mistral/pixtral-12b-2409',       object: 'model', owned_by: 'Mistral', provider: 'Mistral AI', type: 'text', status: 'coming_soon' },

  // GitHub Models — free via GitHub token
  { id: 'github/gpt-4o',                    object: 'model', owned_by: 'OpenAI',  provider: 'GitHub Models', type: 'text', status: 'coming_soon' },
  { id: 'github/gpt-4o-mini',               object: 'model', owned_by: 'OpenAI',  provider: 'GitHub Models', type: 'text', status: 'coming_soon' },
  { id: 'github/meta-llama-3.3-70b-instruct', object: 'model', owned_by: 'Meta',  provider: 'GitHub Models', type: 'text', status: 'coming_soon' },
  { id: 'github/mistral-large-2411',         object: 'model', owned_by: 'Mistral', provider: 'GitHub Models', type: 'text', status: 'coming_soon' },
  { id: 'github/phi-4',                      object: 'model', owned_by: 'Microsoft', provider: 'GitHub Models', type: 'text', status: 'coming_soon' },

  // Cohere — 1,000 calls/month free
  { id: 'cohere/command-r-plus',  object: 'model', owned_by: 'Cohere', provider: 'Cohere', type: 'text', status: 'coming_soon' },
  { id: 'cohere/command-r',       object: 'model', owned_by: 'Cohere', provider: 'Cohere', type: 'text', status: 'coming_soon' },

  // Fireworks AI — fast serverless inference, free credits
  { id: 'fireworks/accounts/fireworks/models/llama-v3p3-70b-instruct',   object: 'model', owned_by: 'Meta',     provider: 'Fireworks', type: 'text', status: 'coming_soon' },
  { id: 'fireworks/accounts/fireworks/models/deepseek-r1',               object: 'model', owned_by: 'DeepSeek', provider: 'Fireworks', type: 'text', status: 'coming_soon' },
  { id: 'fireworks/accounts/fireworks/models/qwen3-30b-a3b',             object: 'model', owned_by: 'Alibaba',  provider: 'Fireworks', type: 'text', status: 'coming_soon' },

  // Featherless AI — 3,000+ open-source models
  { id: 'featherless/meta-llama/Llama-3.3-70B-Instruct', object: 'model', owned_by: 'Meta',    provider: 'Featherless', type: 'text', status: 'coming_soon' },
  { id: 'featherless/Qwen/Qwen3-8B',                     object: 'model', owned_by: 'Alibaba', provider: 'Featherless', type: 'text', status: 'coming_soon' },

  // Scaleway — EU-based, privacy-friendly free tier
  { id: 'scaleway/llama-3.3-70b-instruct', object: 'model', owned_by: 'Meta',    provider: 'Scaleway', type: 'text', status: 'coming_soon' },
  { id: 'scaleway/mistral-nemo-instruct',   object: 'model', owned_by: 'Mistral', provider: 'Scaleway', type: 'text', status: 'coming_soon' },

  // Hyperbolic — community GPU network, free credits
  { id: 'hyperbolic/meta-llama/Llama-3.3-70B-Instruct', object: 'model', owned_by: 'Meta',     provider: 'Hyperbolic', type: 'text', status: 'coming_soon' },
  { id: 'hyperbolic/deepseek-ai/DeepSeek-R1',            object: 'model', owned_by: 'DeepSeek', provider: 'Hyperbolic', type: 'text', status: 'coming_soon' },

  // Novita AI — 100+ models, free credits
  { id: 'novita/meta-llama/llama-3.3-70b-instruct', object: 'model', owned_by: 'Meta',    provider: 'Novita', type: 'text', status: 'coming_soon' },
  { id: 'novita/deepseek/deepseek-v3',               object: 'model', owned_by: 'DeepSeek', provider: 'Novita', type: 'text', status: 'coming_soon' },

  // Together AI — $100 signup credits, 200+ open-source models
  { id: 'together/meta-llama/Llama-3.3-70B-Instruct-Turbo', object: 'model', owned_by: 'Meta',     provider: 'Together AI', type: 'text', status: 'coming_soon' },
  { id: 'together/deepseek-ai/DeepSeek-R1',                  object: 'model', owned_by: 'DeepSeek', provider: 'Together AI', type: 'text', status: 'coming_soon' },
  { id: 'together/Qwen/Qwen3-235B-A22B',                     object: 'model', owned_by: 'Alibaba',  provider: 'Together AI', type: 'text', status: 'coming_soon' },

  // DeepSeek — standalone API
  { id: 'deepseek/deepseek-chat',     object: 'model', owned_by: 'DeepSeek', provider: 'DeepSeek', type: 'text', status: 'coming_soon' },
  { id: 'deepseek/deepseek-reasoner', object: 'model', owned_by: 'DeepSeek', provider: 'DeepSeek', type: 'text', status: 'coming_soon' },
  { id: 'deepseek/deepseek-coder',    object: 'model', owned_by: 'DeepSeek', provider: 'DeepSeek', type: 'text', status: 'coming_soon' },

  // Moonshot AI (Kimi) — 128k context
  { id: 'moonshot/moonshot-v1-8k',   object: 'model', owned_by: 'Moonshot', provider: 'Moonshot AI', type: 'text', status: 'coming_soon' },
  { id: 'moonshot/moonshot-v1-32k',  object: 'model', owned_by: 'Moonshot', provider: 'Moonshot AI', type: 'text', status: 'coming_soon' },
  { id: 'moonshot/moonshot-v1-128k', object: 'model', owned_by: 'Moonshot', provider: 'Moonshot AI', type: 'text', status: 'coming_soon' },

  // Zhipu AI (GLM) — bilingual frontier
  { id: 'zhipu/glm-4',       object: 'model', owned_by: 'Zhipu', provider: 'Zhipu AI', type: 'text', status: 'coming_soon' },
  { id: 'zhipu/glm-4-flash', object: 'model', owned_by: 'Zhipu', provider: 'Zhipu AI', type: 'text', status: 'coming_soon' },
  { id: 'zhipu/glm-4v',      object: 'model', owned_by: 'Zhipu', provider: 'Zhipu AI', type: 'text', status: 'coming_soon' },

  // AI21 Labs — Jamba SSM models
  { id: 'ai21/jamba-1.5-mini',  object: 'model', owned_by: 'AI21', provider: 'AI21 Labs', type: 'text', status: 'coming_soon' },
  { id: 'ai21/jamba-1.5-large', object: 'model', owned_by: 'AI21', provider: 'AI21 Labs', type: 'text', status: 'coming_soon' },

  // DeepInfra — 200+ open-source models
  { id: 'deepinfra/meta-llama/Meta-Llama-3.1-70B-Instruct', object: 'model', owned_by: 'Meta',     provider: 'DeepInfra', type: 'text', status: 'coming_soon' },
  { id: 'deepinfra/deepseek-ai/DeepSeek-R1',                 object: 'model', owned_by: 'DeepSeek', provider: 'DeepInfra', type: 'text', status: 'coming_soon' },
  { id: 'deepinfra/Qwen/Qwen2.5-72B-Instruct',               object: 'model', owned_by: 'Alibaba',  provider: 'DeepInfra', type: 'text', status: 'coming_soon' },

  // Upstage — SOLAR model family
  { id: 'upstage/solar-pro',  object: 'model', owned_by: 'Upstage', provider: 'Upstage', type: 'text', status: 'coming_soon' },
  { id: 'upstage/solar-mini', object: 'model', owned_by: 'Upstage', provider: 'Upstage', type: 'text', status: 'coming_soon' },

  // Black Forest Labs — official FLUX API
  { id: 'bfl/flux-pro-1.1', object: 'model', owned_by: 'Black Forest Labs', provider: 'BFL', type: 'image', status: 'coming_soon' },
  { id: 'bfl/flux-dev',     object: 'model', owned_by: 'Black Forest Labs', provider: 'BFL', type: 'image', status: 'coming_soon' },
  { id: 'bfl/flux-schnell', object: 'model', owned_by: 'Black Forest Labs', provider: 'BFL', type: 'image', status: 'coming_soon' },

  // Ideogram — AI images with great text rendering
  { id: 'ideogram/ideogram-v3',       object: 'model', owned_by: 'Ideogram', provider: 'Ideogram', type: 'image', status: 'coming_soon' },
  { id: 'ideogram/ideogram-v2-turbo', object: 'model', owned_by: 'Ideogram', provider: 'Ideogram', type: 'image', status: 'coming_soon' },

  // Luma AI — photorealistic video
  { id: 'luma/dream-machine', object: 'model', owned_by: 'Luma', provider: 'Luma AI', type: 'video', status: 'coming_soon' },

  // Kling AI — advanced video gen
  { id: 'kling/kling-v1',   object: 'model', owned_by: 'Kuaishou', provider: 'Kling AI', type: 'video', status: 'coming_soon' },
  { id: 'kling/kling-v1-5', object: 'model', owned_by: 'Kuaishou', provider: 'Kling AI', type: 'video', status: 'coming_soon' },

  // ElevenLabs — TTS and voice synthesis
  { id: 'elevenlabs/eleven_multilingual_v2', object: 'model', owned_by: 'ElevenLabs', provider: 'ElevenLabs', type: 'audio', status: 'coming_soon' },
  { id: 'elevenlabs/eleven_turbo_v2_5',      object: 'model', owned_by: 'ElevenLabs', provider: 'ElevenLabs', type: 'audio', status: 'coming_soon' },

  // Fish Audio — TTS and voice cloning
  { id: 'fishaudio/fish-speech-1.5', object: 'model', owned_by: 'Fish Audio', provider: 'Fish Audio', type: 'audio', status: 'coming_soon' },
];

// Virtual models map: base model name -> array of providers
const VIRTUAL_MODELS_MAP: Record<string, Array<{ provider: string; modelId: string; type: string }>> = {
};


// Cache user virtual models in module scope to avoid Redis hit on every request
let _userVirtualModelsCache: Record<string, Array<{ provider: string; modelId: string; type: string }>> | null = null;
let _userVirtualModelsCacheTime = 0;
let _userVirtualModelsFetching: Promise<Record<string, Array<{ provider: string; modelId: string; type: string }>>> | null = null;
const USER_VIRTUAL_MODELS_TTL = 30_000; // 30 seconds

async function getUserVirtualModels(): Promise<Record<string, Array<{ provider: string; modelId: string; type: string }>>> {
  const now = Date.now();
  if (_userVirtualModelsCache && now - _userVirtualModelsCacheTime < USER_VIRTUAL_MODELS_TTL) {
    return _userVirtualModelsCache;
  }

  // If fetch is already in progress, wait for it instead of fetching again
  if (_userVirtualModelsFetching) {
    return _userVirtualModelsFetching;
  }

  _userVirtualModelsFetching = (async () => {
    try {
      const stored = await redis.get('virtual_models');
      if (stored) {
        const list: Array<{ id: string; providers: Array<{ provider: string; modelId: string; type: string }> }> = JSON.parse(stored);
        _userVirtualModelsCache = Object.fromEntries(list.map(vm => [vm.id, vm.providers]));
        _userVirtualModelsCacheTime = now;
        return _userVirtualModelsCache;
      }
    } catch (e) {
      console.warn('Could not load user virtual models:', e);
    }
    return {};
  })().finally(() => {
    _userVirtualModelsFetching = null;
  });

  return _userVirtualModelsFetching;
}

async function getVirtualModelProviders(modelId: string): Promise<Array<{ provider: string; modelId: string; type: string }> | null> {
  // Check hardcoded map first
  const base = Object.keys(VIRTUAL_MODELS_MAP).find(key =>
    modelId === key || modelId.startsWith(key + '-') || modelId === `virtual/${key}`
  );
  if (base) return VIRTUAL_MODELS_MAP[base];

  // Check user-created virtual models from Redis
  const userModels = await getUserVirtualModels();
  return userModels[modelId] ?? null;
}

function stripProviderPrefix(modelId: string): string {
  const slash = modelId.indexOf('/');
  return slash >= 0 ? modelId.slice(slash + 1) : modelId;
}

export async function routeVirtualChat(
  body: unknown,
  providers: Array<{ provider: string; modelId: string; type: string }>,
  options?: RouteOptions
): Promise<Response> {
  let lastError: any;

  for (const entry of providers) {
    try {
      const modelId = stripProviderPrefix(entry.modelId);
      const fwdBody = { ...(body as any), model: modelId };
      const p = entry.provider.toLowerCase();

      if (p === 'groq') {
        return await forwardGroq('/chat/completions', 'POST', fwdBody, options);
      } else if (p === 'pollinations') {
        return await forwardPollinations('/v1/chat/completions', 'POST', fwdBody, options);
      } else if (p === 'ai horde' || p === 'aihorde') {
        const messages = (body as any).messages || [];
        const prompt = messages.map((m: any) => m.content).join('\n') || '';
        return await forwardAIHorde('/generate/text/async', 'POST', { prompt, params: { max_length: (body as any).max_tokens || 80 } }, options);
      } else if (p === 'voidai') {
        return await forwardVoidAI('/chat/completions', 'POST', fwdBody, options);
      } else if (p === 'airforce') {
        return await forwardAirforce('/chat/completions', 'POST', fwdBody, options);
      } else if (p === 'cerebras') {
        return await forwardCerebras('/chat/completions', 'POST', fwdBody, options);
      } else if (p === 'tokenreply') {
        return await forwardTokenReply('/chat/completions', 'POST', fwdBody, options);
      } else if (p === 'nagaai') {
        return await forwardNagaAI('/chat/completions', 'POST', fwdBody, options);
      } else if (p === 'happupy') {
        return await forwardHappupy('/v1/chat/completions', 'POST', fwdBody, options);
      }
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All virtual model providers failed');
}

export async function routeVirtualImages(
  body: unknown,
  providers: Array<{ provider: string; modelId: string; type: string }>,
  options?: RouteOptions
): Promise<Response> {
  let lastError: any;

  for (const entry of providers) {
    try {
      const modelId = stripProviderPrefix(entry.modelId);
      const fwdBody = { ...(body as any), model: modelId };
      const prompt = (body as any).prompt || '';
      const p = entry.provider.toLowerCase();

      if (p === 'pollinations') {
        if (modelId === 'image-simple') return forwardSimpleImage(prompt);
        return await forwardPollinations('/v1/images/generations', 'POST', fwdBody);
      } else if (p === 'ai horde' || p === 'aihorde') {
        const hordeBody = { prompt, models: [modelId], params: { sampler_name: 'k_euler', cfg_scale: 7, denoise: 1.0, steps: 20 } };
        return await forwardAIHorde('/generate/async', 'POST', hordeBody);
      } else if (p === 'voidai') {
        return await forwardVoidAI('/images/generations', 'POST', fwdBody);
      } else if (p === 'airforce') {
        return await forwardAirforce('/images/generations', 'POST', fwdBody);
      }
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All virtual image model providers failed');
}

export async function routeVirtualVideo(
  body: unknown,
  providers: Array<{ provider: string; modelId: string; type: string }>,
  options?: RouteOptions
): Promise<Response> {
  let lastError: any;

  for (const entry of providers) {
    try {
      const modelId = stripProviderPrefix(entry.modelId);
      const p = entry.provider.toLowerCase();

      if (p === 'pollinations') {
        const prompt = (body as any)?.prompt || '';
        return await forwardPollinationsVideo(prompt, modelId);
      } else if (p === 'airforce') {
        return await forwardAirforce('/video/generations', 'POST', { ...(body as any), model: modelId });
      }
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All virtual video model providers failed');
}

export async function routeVirtualAudio(
  body: unknown,
  providers: Array<{ provider: string; modelId: string; type: string }>,
  options?: RouteOptions
): Promise<Response> {
  let lastError: any;

  for (const entry of providers) {
    try {
      const modelId = stripProviderPrefix(entry.modelId);
      const fwdBody = { ...(body as any), model: modelId };
      const p = entry.provider.toLowerCase();

      if (p === 'pollinations') {
        return await forwardPollinations('/v1/audio/speech', 'POST', fwdBody);
      } else if (p === 'voidai') {
        return await forwardVoidAI('/audio/speech', 'POST', fwdBody);
      } else if (p === 'airforce') {
        return await forwardAirforce('/audio/speech', 'POST', fwdBody);
      } else if (p === 'groq') {
        return await forwardGroq('/audio/speech', 'POST', fwdBody, options);
      } else if (p === 'nagaai') {
        return await forwardNagaAI('/audio/speech', 'POST', fwdBody);
      }
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All virtual audio model providers failed');
}

export async function routeVirtualEmbeddings(
  body: unknown,
  providers: Array<{ provider: string; modelId: string; type: string }>,
  options?: RouteOptions
): Promise<Response> {
  let lastError: any;

  for (const entry of providers) {
    try {
      const modelId = stripProviderPrefix(entry.modelId);
      const fwdBody = { ...(body as any), model: modelId };
      const p = entry.provider.toLowerCase();

      if (p === 'pollinations') {
        return await forwardPollinations('/v1/embeddings', 'POST', fwdBody);
      } else if (p === 'voidai') {
        return await forwardVoidAI('/embeddings', 'POST', fwdBody);
      } else if (p === 'airforce') {
        return await forwardAirforce('/embeddings', 'POST', fwdBody);
      }
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All virtual embedding model providers failed');
}

export async function routeVirtualTranscription(
  body: unknown,
  providers: Array<{ provider: string; modelId: string; type: string }>,
  options?: RouteOptions
): Promise<Response> {
  let lastError: any;

  for (const entry of providers) {
    try {
      const modelId = stripProviderPrefix(entry.modelId);
      const fwdBody = { ...(body as any), model: modelId };
      const p = entry.provider.toLowerCase();

      if (p === 'pollinations') {
        return await forwardPollinations('/v1/audio/transcriptions', 'POST', fwdBody);
      } else if (p === 'voidai') {
        return await forwardVoidAI('/audio/transcriptions', 'POST', fwdBody);
      } else if (p === 'airforce') {
        return await forwardAirforce('/audio/transcriptions', 'POST', fwdBody);
      } else if (p === 'groq') {
        return await forwardGroq('/audio/transcriptions', 'POST', fwdBody, options);
      } else if (p === 'nagaai') {
        return await forwardNagaAI('/audio/transcriptions', 'POST', fwdBody);
      }
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All virtual transcription model providers failed');
}

export async function routeModels() {
  const models: any[] = [];

  const active = await getActiveProviders();

  // Helper to stamp status on models for inactive providers
  const withStatus = (list: any[], prefix: string) =>
    active.has(prefix) ? list : list.map(m => ({ ...m, status: 'coming_soon' }));

  // Pollinations — hardcoded free model list
  models.push(...withStatus(POLLINATIONS_FREE_MODELS, 'pollinations'));

  // VoidAI — free tier only
  if (active.has('voidai')) {
    try {
      const r = await forwardVoidAI('/models', 'GET');
      if (r.ok) {
        const data = await r.json();
        if (data.data && Array.isArray(data.data)) {
          models.push(
            ...data.data
              .filter((m: any) => {
                const p = m.plan_requirements || [];
                return p.includes('free') || p.length === 0;
              })
              .map((m: any) => ({ ...m, provider: 'VoidAI', type: inferType(m.id) }))
          );
        }
      }
    } catch (e) { console.error('VoidAI models error:', e); }
  } else {
    // Show VoidAI models as coming soon (placeholder)
    models.push(
      { id: 'voidai/gpt-4o', object: 'model', owned_by: 'OpenAI', provider: 'VoidAI', type: 'text', status: 'coming_soon' },
      { id: 'voidai/claude-3.5-sonnet', object: 'model', owned_by: 'Anthropic', provider: 'VoidAI', type: 'text', status: 'coming_soon' },
    );
  }

  // Airforce — DISABLED: All models have pricing, none are actually free
  // try { ... } catch (e) { }

  // Cerebras — free tier models (text only, 1M tokens/day)
  models.push(...withStatus([
    { id: 'cerebras/llama-3.3-70b', object: 'model', owned_by: 'Meta', provider: 'Cerebras', type: 'text' },
    { id: 'cerebras/llama-4-scout', object: 'model', owned_by: 'Meta', provider: 'Cerebras', type: 'text' },
    { id: 'cerebras/deepseek-r1', object: 'model', owned_by: 'DeepSeek', provider: 'Cerebras', type: 'text' },
  ], 'cerebras'));

  // Groq — free tier models with rate limits
  models.push(...withStatus(GROQ_FREE_MODELS, 'groq'));

  // TokenReply — free OpenAI-compatible models
  models.push(...withStatus(TOKENREPLY_FREE_MODELS, 'tokenreply'));

  // NagaAI — 13 free models across chat, audio, image, and transcription
  models.push(...withStatus(NAGAAI_FREE_MODELS, 'nagaai'));

  // AI Horde — decentralized volunteer network with 160+ image + 26+ text models
  models.push(...withStatus(AIHORDE_FREE_MODELS, 'aihorde'));

  // Built-in virtual models (hardcoded multi-provider routing)
  Object.entries(VIRTUAL_MODELS_MAP).forEach(([baseName, providers]) => {
    if (providers.length > 1) {
      const firstProvider = providers[0];
      models.push({
        id: baseName,
        object: 'model',
        owned_by: 'OpenRelay',
        provider: 'OpenRelay Virtual',
        type: firstProvider.type,
      });
    }
  });

  // User-created virtual models from Redis
  try {
    const stored = await redis.get('virtual_models');
    if (stored) {
      const userVirtualModels: Array<{ id: string; providers: Array<{ provider: string; modelId: string; type: string }> }> = JSON.parse(stored);
      userVirtualModels.forEach((vm) => {
        if (vm.id && vm.providers?.length > 0) {
          const firstType = vm.providers[0].type || 'text';
          models.push({
            id: vm.id,
            object: 'model',
            owned_by: 'OpenRelay',
            provider: 'OpenRelay Virtual',
            type: firstType,
          });
        }
      });
    }
  } catch (e) {
    console.warn('Could not load user virtual models from Redis:', e);
  }

  // Coming soon providers — visible in model list but not yet routable
  // Use the canonical list from coming-soon-providers.ts (150+ providers)
  models.push(...getComingSoonModels());
  // Also include static hardcoded coming-soon entries (some have no overlap)
  models.push(...COMING_SOON_MODELS);

  // Deduplicate by id
  const seen = new Set<string>();
  return {
    object: 'list',
    data: models.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    }),
  };
}

export async function getDynamicRateLimit(userModel?: string): Promise<number> {
  // Check if user specified a Pollinations model
  if (userModel?.startsWith('pollinations/')) {
    return getRateLimitForProvider('POLLINATIONS');
  }

  // Check if user specified a VoidAI model
  if (userModel?.startsWith('voidai/')) {
    return getRateLimitForProvider('VOIDAI');
  }

  // Check if user specified an Airforce model
  if (userModel?.startsWith('airforce/')) {
    return getRateLimitForProvider('AIRFORCE');
  }

  // Check if user specified a Cerebras model
  if (userModel?.startsWith('cerebras/')) {
    return getRateLimitForProvider('CEREBRAS');
  }

  if (userModel?.startsWith('tokenreply/')) {
    return getRateLimitForProvider('TOKENREPLY');
  }

  if (userModel?.startsWith('nagaai/')) {
    return getRateLimitForProvider('NAGAAI');
  }

  if (userModel?.startsWith('groq/')) {
    return getRateLimitForProvider('GROQ');
  }

  if (userModel?.startsWith('aihorde/')) {
    return getRateLimitForProvider('AIHORDE');
  }

  if (userModel?.startsWith('happupy/')) {
    return getRateLimitForProvider('HAPPUPY');
  }

  const [pollinationsLimit, voidaiLimit, airforceLimit, cerebrasLimit, groqLimit, tokenreplyLimit, nagaaiLimit, aihorderLimit, happupyLimit] = await Promise.all([
    getRateLimitForProvider('POLLINATIONS'),
    getRateLimitForProvider('VOIDAI'),
    getRateLimitForProvider('AIRFORCE'),
    getRateLimitForProvider('CEREBRAS'),
    getRateLimitForProvider('GROQ'),
    getRateLimitForProvider('TOKENREPLY'),
    getRateLimitForProvider('NAGAAI'),
    getRateLimitForProvider('AIHORDE'),
    getRateLimitForProvider('HAPPUPY'),
  ]);
  return Math.max(60, pollinationsLimit, voidaiLimit, airforceLimit, cerebrasLimit, groqLimit, tokenreplyLimit, nagaaiLimit, aihorderLimit, happupyLimit);
}
