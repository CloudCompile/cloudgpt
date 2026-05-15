import { getNextKey, getRateLimitForProvider, getKeysForProvider } from './keypool';
import { forwardPollinations, forwardSimpleImage, forwardSimpleText, getPollModel } from './pollinations';
import { forwardVoidAI } from './voidai';
import { forwardAirforce } from './airforce';
import { forwardCerebras } from './cerebras';
import { forwardGroq } from './groq';

/**
 * Provider routing logic
 * Tries AIHubMix first, then falls back to Pollinations
 * Automatically scales rate limits based on available keys
 */

export interface RouteOptions {
  streaming?: boolean;
  autoFallback?: boolean;
}

// Forward to AIHubMix
async function forwardAIHubMix(
  endpoint: string,
  method: string,
  body?: unknown
) {
  const apiKey = process.env.AIHUBMIX_KEY_1;

  if (!apiKey) {
    throw new Error('No AIHubMix API key configured');
  }

  const url = `https://aihubmix.com/v1${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return response;
}

export async function routeChat(
  body: unknown,
  options?: RouteOptions
) {
  // Extract model if provided
  const model = (body as any)?.model || 'gpt-4o-free';

  // Determine which provider to use
  if (model.startsWith('pollinations/')) {
    const fwdBody = { ...(body as any), model: model.replace('pollinations/', '') };
    return forwardPollinations('/v1/chat/completions', 'POST', fwdBody, options);
  }

  if (model.startsWith('voidai/')) {
    const fwdBody = { ...(body as any), model: model.replace('voidai/', '') };
    return forwardVoidAI('/chat/completions', 'POST', fwdBody, options);
  }

  if (model.startsWith('airforce/')) {
    const fwdBody = { ...(body as any), model: model.replace('airforce/', '') };
    return forwardAirforce('/chat/completions', 'POST', fwdBody, options);
  }

  if (model.startsWith('cerebras/')) {
    const fwdBody = { ...(body as any), model: model.replace('cerebras/', '') };
    return forwardCerebras('/chat/completions', 'POST', fwdBody, options);
  }

  if (model.startsWith('groq/')) {
    const fwdBody = { ...(body as any), model: model.replace('groq/', '') };
    return forwardGroq('/chat/completions', 'POST', fwdBody, options);
  }

  // Default: try AIHubMix → Pollinations → VoidAI → Airforce → Cerebras → Groq
  try {
    return await forwardAIHubMix('/chat/completions', 'POST', body);
  } catch (error) {
    if (options?.autoFallback) {
      try {
        return await forwardPollinations('/v1/chat/completions', 'POST', body, options);
      } catch (pollinationsError) {
        try {
          return await forwardVoidAI('/chat/completions', 'POST', body, options);
        } catch (voidaiError) {
          try {
            return await forwardAirforce('/chat/completions', 'POST', body, options);
          } catch (airforceError) {
            try {
              return await forwardCerebras('/chat/completions', 'POST', body, options);
            } catch (cerebasError) {
              return await forwardGroq('/chat/completions', 'POST', body, options);
            }
          }
        }
      }
    }
    throw error;
  }
}

export async function routeImages(
  body: unknown,
  options?: RouteOptions
) {
  const model = (body as any)?.model || 'gpt-image-2-free';

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

  // Default: try AIHubMix → Pollinations → VoidAI → Airforce
  try {
    return await forwardAIHubMix('/images/generations', 'POST', body);
  } catch (error) {
    if (options?.autoFallback) {
      try {
        return await forwardPollinations('/v1/images/generations', 'POST', body);
      } catch (pollinationsError) {
        try {
          return await forwardVoidAI('/images/generations', 'POST', body);
        } catch (voidaiError) {
          return await forwardAirforce('/images/generations', 'POST', body);
        }
      }
    }
    throw error;
  }
}

export async function routeVideo(
  body: unknown,
  options?: RouteOptions
) {
  const model = (body as any)?.model || 'pollinations/text-to-video';

  // Airforce video endpoint
  if (model.startsWith('airforce/')) {
    const fwdBody = { ...(body as any), model: model.replace('airforce/', '') };
    return forwardAirforce('/video/generations', 'POST', fwdBody);
  }

  // Default: Pollinations for video
  if (model.startsWith('pollinations/')) {
    const fwdBody = { ...(body as any), model: model.replace('pollinations/', '') };
    return forwardPollinations('/v1/videos/generations', 'POST', fwdBody);
  }

  return forwardPollinations('/v1/videos/generations', 'POST', body);
}

export async function routeAudio(
  body: unknown,
  options?: RouteOptions
) {
  const model = (body as any)?.model || 'tts-1';

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

  // Default: try AIHubMix → Pollinations → VoidAI → Airforce → Groq
  try {
    return await forwardAIHubMix('/audio/speech', 'POST', body);
  } catch (error) {
    if (options?.autoFallback) {
      try {
        return await forwardPollinations('/v1/audio/speech', 'POST', body);
      } catch (pollinationsError) {
        try {
          return await forwardVoidAI('/audio/speech', 'POST', body);
        } catch (voidaiError) {
          try {
            return await forwardAirforce('/audio/speech', 'POST', body);
          } catch (airforceError) {
            return await forwardGroq('/audio/speech', 'POST', body);
          }
        }
      }
    }
    throw error;
  }
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

  // Default: try AIHubMix → Pollinations → VoidAI → Airforce
  try {
    return await forwardAIHubMix('/embeddings', 'POST', body);
  } catch (error) {
    if (options?.autoFallback) {
      try {
        return await forwardPollinations('/v1/embeddings', 'POST', body);
      } catch (pollinationsError) {
        try {
          return await forwardVoidAI('/embeddings', 'POST', body);
        } catch (voidaiError) {
          return await forwardAirforce('/embeddings', 'POST', body);
        }
      }
    }
    throw error;
  }
}

export async function routeTranscription(
  body: unknown,
  options?: RouteOptions
) {
  const model = (body as any)?.model || 'whisper-1';

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

  // Default: try VoidAI → Airforce → Groq
  try {
    return await forwardVoidAI('/audio/transcriptions', 'POST', body);
  } catch (error) {
    if (options?.autoFallback) {
      try {
        return await forwardAirforce('/audio/transcriptions', 'POST', body);
      } catch (airforceError) {
        return await forwardGroq('/audio/transcriptions', 'POST', body);
      }
    }
    throw error;
  }
}

function inferType(id: string): string {
  const s = id.toLowerCase();
  if (/imagen|image|flux|dall-e|gptimage|wan-image|zimage|klein|kontext|suno/.test(s)) return 'image';
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
  // Text / Chat
  { id: 'pollinations/openai',               object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/openai-fast',          object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/openai-large',         object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/claude-fast',          object: 'model', owned_by: 'Anthropic',        provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/gemini-fast',          object: 'model', owned_by: 'Google',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/gemini-search',        object: 'model', owned_by: 'Google',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/mistral',              object: 'model', owned_by: 'Mistral',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/mistral-large',        object: 'model', owned_by: 'Mistral',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/llama',                object: 'model', owned_by: 'Meta',             provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/llama-scout',          object: 'model', owned_by: 'Meta',             provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/qwen-coder',           object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/qwen-coder-large',     object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/qwen-large',           object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/qwen-vision',          object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/qwen-safety',          object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/grok',                 object: 'model', owned_by: 'xAI',              provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/kimi',                 object: 'model', owned_by: 'Moonshot',         provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/kimi-k2.6',            object: 'model', owned_by: 'Moonshot',         provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/perplexity-fast',      object: 'model', owned_by: 'Perplexity',       provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/perplexity-reasoning', object: 'model', owned_by: 'Perplexity',       provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/nova-fast',            object: 'model', owned_by: 'Amazon',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/nova',                 object: 'model', owned_by: 'Amazon',           provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/minimax',              object: 'model', owned_by: 'MiniMax',          provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/midijourney',          object: 'model', owned_by: 'MIDIjourney',      provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/glm',                  object: 'model', owned_by: 'Z.ai',             provider: 'Pollinations', type: 'text' },
  { id: 'pollinations/text-simple',          object: 'model', owned_by: 'Pollinations',     provider: 'Pollinations', type: 'text' },
  // Image
  { id: 'pollinations/flux',                 object: 'model', owned_by: 'Black Forest Labs', provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/zimage',               object: 'model', owned_by: 'ZImage',           provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/klein',                object: 'model', owned_by: 'Black Forest Labs', provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/gptimage',             object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/kontext',              object: 'model', owned_by: 'Black Forest Labs', provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/gptimage-large',       object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/wan-image',            object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/qwen-image',           object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'image' },
  { id: 'pollinations/image-simple',         object: 'model', owned_by: 'Pollinations',     provider: 'Pollinations', type: 'image' },
  // Video
  { id: 'pollinations/nova-reel',            object: 'model', owned_by: 'Amazon',           provider: 'Pollinations', type: 'video' },
  { id: 'pollinations/ltx-2',               object: 'model', owned_by: 'LightTricks',       provider: 'Pollinations', type: 'video' },
  // Audio / TTS
  { id: 'pollinations/openai-audio',         object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'audio' },
  { id: 'pollinations/qwen-tts',             object: 'model', owned_by: 'Alibaba',          provider: 'Pollinations', type: 'audio' },
  { id: 'pollinations/acestep',              object: 'model', owned_by: 'ACE',              provider: 'Pollinations', type: 'audio' },
  // Transcription
  { id: 'pollinations/universal-2',          object: 'model', owned_by: 'AssemblyAI',       provider: 'Pollinations', type: 'transcription' },
  { id: 'pollinations/whisper',              object: 'model', owned_by: 'OpenAI',           provider: 'Pollinations', type: 'transcription' },
  { id: 'pollinations/scribe',               object: 'model', owned_by: 'ElevenLabs',       provider: 'Pollinations', type: 'transcription' },
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

export async function routeModels() {
  const models: any[] = [];

  // AIHubMix — free tier only (model IDs ending in -free)
  try {
    const r = await forwardAIHubMix('/models', 'GET');
    if (r.ok) {
      const data = await r.json();
      if (data.data && Array.isArray(data.data)) {
        models.push(
          ...data.data
            .filter((m: any) => m.id.endsWith('-free'))
            .map((m: any) => ({ ...m, provider: 'AIHubMix', type: inferType(m.id) }))
        );
      }
    }
  } catch (e) { console.error('AIHubMix models error:', e); }

  // Pollinations — hardcoded free model list
  models.push(...POLLINATIONS_FREE_MODELS);

  // VoidAI — free tier only
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

  // Airforce — free plan: multiplier == null or multiplier <= 1
  try {
    const r = await forwardAirforce('/models', 'GET');
    if (r.ok) {
      const data = await r.json();
      if (data.data && Array.isArray(data.data)) {
        models.push(
          ...data.data
            .filter((m: any) => m.multiplier == null || m.multiplier <= 1)
            .map((m: any) => ({
              id: `airforce/${m.id}`,
              object: 'model',
              owned_by: m.owned_by || 'Airforce',
              provider: 'Airforce',
              type: inferAirforceType(m),
            }))
        );
      }
    }
  } catch (e) { console.error('Airforce models error:', e); }

  // Cerebras — free tier models (text only, 1M tokens/day)
  models.push(
    { id: 'cerebras/llama-3.3-70b', object: 'model', owned_by: 'Meta', provider: 'Cerebras', type: 'text' },
    { id: 'cerebras/llama-4-scout', object: 'model', owned_by: 'Meta', provider: 'Cerebras', type: 'text' },
    { id: 'cerebras/deepseek-r1', object: 'model', owned_by: 'DeepSeek', provider: 'Cerebras', type: 'text' }
  );

  // Groq — free tier models with rate limits
  models.push(...GROQ_FREE_MODELS);

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

  // Check if user specified an AIHubMix model
  if (userModel?.startsWith('aihubmix/') || !userModel) {
    // AIHubMix only has one key, so always 60
    return 60;
  }

  // Default to higher of the five providers
  const pollinationsLimit = await getRateLimitForProvider('POLLINATIONS');
  const voidaiLimit = await getRateLimitForProvider('VOIDAI');
  const airforceLimit = await getRateLimitForProvider('AIRFORCE');
  const cerebrasLimit = await getRateLimitForProvider('CEREBRAS');
  return Math.max(60, pollinationsLimit, voidaiLimit, airforceLimit, cerebrasLimit);
}
