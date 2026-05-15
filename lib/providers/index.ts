import { getNextKey, getRateLimitForProvider, getKeysForProvider } from './keypool';
import { forwardPollinations, forwardSimpleImage, forwardSimpleText, getPollModel } from './pollinations';
import { forwardVoidAI } from './voidai';
import { forwardAirforce } from './airforce';
import { forwardCerebras } from './cerebras';
import { forwardGroq } from './groq';
import { forwardAIHorde } from './aihorde';

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

  // Check if this is a virtual model with multiple providers
  const virtualProviders = getVirtualModelProviders(model);
  if (virtualProviders && virtualProviders.length > 0) {
    return routeVirtualChat(body, virtualProviders, options);
  }

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

  if (model.startsWith('aihorde/')) {
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

  // Default: try AIHubMix → Pollinations → VoidAI → Airforce → Cerebras → Groq → AIHorde
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
              try {
                return await forwardGroq('/chat/completions', 'POST', body, options);
              } catch (groqError) {
                const messages = (body as any).messages || [];
                const prompt = messages.map((m: any) => m.content).join('\n') || '';
                const hordeBody = {
                  prompt,
                  params: {
                    max_length: (body as any).max_tokens || 80,
                  },
                };
                return await forwardAIHorde('/generate/text/async', 'POST', hordeBody, options);
              }
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

  // Check if this is a virtual model with multiple providers
  const virtualProviders = getVirtualModelProviders(model);
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

  // Default: try AIHubMix → Pollinations → VoidAI → Airforce → AIHorde
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
          try {
            return await forwardAirforce('/images/generations', 'POST', body);
          } catch (airforceError) {
            const prompt = (body as any)?.prompt || '';
            const hordeBody = {
              prompt,
              models: ['stable_diffusion'],
              params: {
                sampler_name: 'k_euler',
                cfg_scale: 7,
                denoise: 1.0,
                steps: 20,
              },
            };
            return await forwardAIHorde('/generate/async', 'POST', hordeBody);
          }
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

const AIHORDE_FREE_MODELS = [
  // Text Generation (26+ models)
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
  { id: 'aihorde/hermes-3-llama-3.1-405b',               object: 'model', owned_by: 'Nous Research',      provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/gpt-4-turbo',                           object: 'model', owned_by: 'OpenAI',             provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/claude-3-sonnet',                       object: 'model', owned_by: 'Anthropic',          provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/gemini-pro',                            object: 'model', owned_by: 'Google',             provider: 'AIHorde', type: 'text' },
  { id: 'aihorde/mistral-large',                         object: 'model', owned_by: 'Mistral',            provider: 'AIHorde', type: 'text' },
  // Image Generation (160+ models)
  { id: 'aihorde/stable_diffusion',                      object: 'model', owned_by: 'Stability AI',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/stable_diffusion_xl',                   object: 'model', owned_by: 'Stability AI',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/sd_xl_base_1.0',                        object: 'model', owned_by: 'Stability AI',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/sd_xl_turbo',                           object: 'model', owned_by: 'Stability AI',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/juggernautXL_v9Rundiffusion',           object: 'model', owned_by: 'Juggernaut',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/protovisionXLEngineOmega',              object: 'model', owned_by: 'ProtoVision',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/darkSushiMixMix_225D',                  object: 'model', owned_by: 'DarkSushi',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/dreamshaper',                           object: 'model', owned_by: 'Dreamshaper',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/neverendingdream',                      object: 'model', owned_by: 'NeverEndingDream',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/ghostmixSSSuperior_bestQuality',        object: 'model', owned_by: 'GhostMix',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/ponyDiffusionXL',                       object: 'model', owned_by: 'Pony Diffusion',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/grapefruit-hentai',                     object: 'model', owned_by: 'Grapefruit',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/absolutereality',                       object: 'model', owned_by: 'Absolute Reality',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/epicrealism',                           object: 'model', owned_by: 'Epic Realism',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/flux-1-schnell',                        object: 'model', owned_by: 'Black Forest Labs',  provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/animagine-xl-3.1',                      object: 'model', owned_by: 'Animagine',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/toonyou',                               object: 'model', owned_by: 'ToonYou',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/hassaku-xl',                            object: 'model', owned_by: 'Hassaku',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/icbinp-xl',                             object: 'model', owned_by: 'ICBINP',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/chilled_reverse_furry_xl',              object: 'model', owned_by: 'Chilled Reverse',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/guofeng3_t2i',                          object: 'model', owned_by: 'Guofeng',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/realistic_vision_5.1',                  object: 'model', owned_by: 'Realistic Vision',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/cyberrealistic_v34',                    object: 'model', owned_by: 'CyberRealistic',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/meinamix_meinamodel_v4',                object: 'model', owned_by: 'MeinaMix',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/deliberate_v2',                         object: 'model', owned_by: 'Deliberate',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/openjourney_v4',                        object: 'model', owned_by: 'OpenJourney',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/lyriel_v16',                            object: 'model', owned_by: 'Lyriel',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/ghibli_diffusion',                      object: 'model', owned_by: 'Ghibli Diffusion',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/theallys_mix_ii',                       object: 'model', owned_by: 'Allys Mix II',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/anything_v3',                           object: 'model', owned_by: 'Anything V3',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/anything_v5',                           object: 'model', owned_by: 'Anything V5',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/anything_v4.5',                         object: 'model', owned_by: 'Anything V4.5',      provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/abyssorangemix_v3',                     object: 'model', owned_by: 'Abyss Orange Mix',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/rev_animated',                          object: 'model', owned_by: 'Rev Animated',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/neverendingdream_sfw',                  object: 'model', owned_by: 'NeverEndingDream',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/waifu_diffusion_v1_4',                  object: 'model', owned_by: 'Waifu Diffusion',    provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/hentai_diffusion',                      object: 'model', owned_by: 'Hentai Diffusion',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/redshift_diffusion',                    object: 'model', owned_by: 'Redshift',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/timeless_v1_0',                         object: 'model', owned_by: 'Timeless',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/starlite_anime_xl_v3',                  object: 'model', owned_by: 'StarLite Anime',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/anime_pastel_dream_xl',                 object: 'model', owned_by: 'Anime Pastel',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/counterfeit_v30',                       object: 'model', owned_by: 'Counterfeit',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/eimis_anime_diffusion_v0_75',           object: 'model', owned_by: 'Eimis',              provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/sd_1.5_inpainting',                     object: 'model', owned_by: 'Stability AI',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/sdxl_vae',                              object: 'model', owned_by: 'Stability AI',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/rcnz_3d_painting_style',                object: 'model', owned_by: 'RCNZ 3D',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/hassaku_hll_anime_xl',                  object: 'model', owned_by: 'Hassaku Anime',      provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/yiffymix',                              object: 'model', owned_by: 'YiffyMix',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/furryrock_v1.1',                        object: 'model', owned_by: 'FurryRock',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/blazing_drive_xl',                      object: 'model', owned_by: 'Blazing Drive',      provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/photorealism_v5.1',                     object: 'model', owned_by: 'Photorealism',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/darkfix_13_final',                      object: 'model', owned_by: 'DarkFix',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/trinart_characters_it4_v1',             object: 'model', owned_by: 'TrinArt',            provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/stable_diffusion_v2.1',                 object: 'model', owned_by: 'Stability AI',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/stable_diffusion_v1_5',                 object: 'model', owned_by: 'Stability AI',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/deliberate_v1.0',                       object: 'model', owned_by: 'Deliberate',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/portrait_plus_v1',                      object: 'model', owned_by: 'Portrait Plus',      provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/analog_diffusion',                      object: 'model', owned_by: 'Analog Diffusion',   provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/anime_girls_xl',                        object: 'model', owned_by: 'Anime Girls XL',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/rpg_v5',                                object: 'model', owned_by: 'RPG V5',             provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/architecturerealism_xl_v1.3',           object: 'model', owned_by: 'Architecture',       provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/majicmixrealistic_v7',                  object: 'model', owned_by: 'Majic Mix',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/mechamix_v10_final',                    object: 'model', owned_by: 'Mechamix',           provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/theallysx_xl_v2',                       object: 'model', owned_by: 'Allys XL V2',        provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/giganticly_anime_xl',                   object: 'model', owned_by: 'Gigantic Anime',     provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/tusun_pony_xl_v1',                      object: 'model', owned_by: 'Tusun Pony',         provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/photoreal_v2',                          object: 'model', owned_by: 'PhotoReal',          provider: 'AIHorde', type: 'image' },
  { id: 'aihorde/zavychromaxl_xl10',                     object: 'model', owned_by: 'ZavyChromaXL',       provider: 'AIHorde', type: 'image' },
];

// Virtual models map: base model name -> array of providers
const VIRTUAL_MODELS_MAP: Record<string, Array<{ provider: string; modelId: string; type: string }>> = {
  'gpt-4o': [
    { provider: 'groq', modelId: 'groq/openai/gpt-oss-120b', type: 'text' },
    { provider: 'aihorde', modelId: 'aihorde/gpt-4-turbo', type: 'text' },
  ],
  'gpt-4': [
    { provider: 'groq', modelId: 'groq/openai/gpt-oss-120b', type: 'text' },
    { provider: 'aihorde', modelId: 'aihorde/gpt-4-turbo', type: 'text' },
  ],
  'claude': [
    { provider: 'pollinations', modelId: 'pollinations/claude-fast', type: 'text' },
    { provider: 'aihorde', modelId: 'aihorde/claude-3-sonnet', type: 'text' },
  ],
  'gemini': [
    { provider: 'pollinations', modelId: 'pollinations/gemini-fast', type: 'text' },
    { provider: 'aihorde', modelId: 'aihorde/gemini-pro', type: 'text' },
  ],
  'llama': [
    { provider: 'groq', modelId: 'groq/llama-3.3-70b-versatile', type: 'text' },
    { provider: 'aihorde', modelId: 'aihorde/aphrodite-Skyfall-31B-v4.1', type: 'text' },
  ],
  'mistral': [
    { provider: 'pollinations', modelId: 'pollinations/mistral-large', type: 'text' },
    { provider: 'aihorde', modelId: 'aihorde/mistral-large', type: 'text' },
  ],
  'qwen': [
    { provider: 'groq', modelId: 'groq/qwen/qwen3-32b', type: 'text' },
    { provider: 'aihorde', modelId: 'aihorde/koboldcpp-Qwen-Qwen3.6-35B', type: 'text' },
  ],
  'image-generation': [
    { provider: 'pollinations', modelId: 'pollinations/flux', type: 'image' },
    { provider: 'aihorde', modelId: 'aihorde/flux-1-schnell', type: 'image' },
  ],
  'flux': [
    { provider: 'pollinations', modelId: 'pollinations/flux', type: 'image' },
    { provider: 'aihorde', modelId: 'aihorde/flux-1-schnell', type: 'image' },
  ],
  'stable-diffusion': [
    { provider: 'aihorde', modelId: 'aihorde/stable_diffusion_xl', type: 'image' },
    { provider: 'pollinations', modelId: 'pollinations/image-simple', type: 'image' },
  ],
};

function isVirtualModel(modelId: string): boolean {
  return Object.keys(VIRTUAL_MODELS_MAP).some(base =>
    modelId === base || modelId.startsWith(base + '-') || modelId.startsWith('virtual/')
  );
}

function getVirtualModelProviders(modelId: string): Array<{ provider: string; modelId: string; type: string }> | null {
  const base = Object.keys(VIRTUAL_MODELS_MAP).find(key =>
    modelId === key || modelId.startsWith(key + '-') || modelId === `virtual/${key}`
  );
  return base ? VIRTUAL_MODELS_MAP[base] : null;
}

export async function routeVirtualChat(
  body: unknown,
  providers: Array<{ provider: string; modelId: string; type: string }>,
  options?: RouteOptions
): Promise<Response> {
  let lastError: any;

  for (const provider of providers) {
    try {
      const fwdBody = { ...(body as any), model: provider.modelId };

      if (provider.provider === 'groq') {
        return await forwardGroq('/chat/completions', 'POST', fwdBody, options);
      } else if (provider.provider === 'pollinations') {
        return await forwardPollinations('/v1/chat/completions', 'POST', fwdBody, options);
      } else if (provider.provider === 'aihorde') {
        const messages = fwdBody.messages || [];
        const prompt = messages.map((m: any) => m.content).join('\n') || '';
        const hordeBody = {
          prompt,
          params: {
            max_length: fwdBody.max_tokens || 80,
          },
        };
        return await forwardAIHorde('/generate/text/async', 'POST', hordeBody, options);
      } else if (provider.provider === 'voidai') {
        return await forwardVoidAI('/chat/completions', 'POST', fwdBody, options);
      } else if (provider.provider === 'airforce') {
        return await forwardAirforce('/chat/completions', 'POST', fwdBody, options);
      } else if (provider.provider === 'cerebras') {
        return await forwardCerebras('/chat/completions', 'POST', fwdBody, options);
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

  for (const provider of providers) {
    try {
      const fwdBody = { ...(body as any), model: provider.modelId };
      const prompt = fwdBody.prompt || '';

      if (provider.provider === 'pollinations') {
        if (provider.modelId === 'pollinations/image-simple') {
          return forwardSimpleImage(prompt);
        }
        return await forwardPollinations('/v1/images/generations', 'POST', fwdBody);
      } else if (provider.provider === 'aihorde') {
        const hordeBody = {
          prompt,
          models: [provider.modelId.replace('aihorde/', '')],
          params: {
            sampler_name: 'k_euler',
            cfg_scale: 7,
            denoise: 1.0,
            steps: 20,
          },
        };
        return await forwardAIHorde('/generate/async', 'POST', hordeBody);
      } else if (provider.provider === 'voidai') {
        return await forwardVoidAI('/images/generations', 'POST', fwdBody);
      } else if (provider.provider === 'airforce') {
        return await forwardAirforce('/images/generations', 'POST', fwdBody);
      }
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All virtual model providers failed');
}

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

  // AI Horde — decentralized volunteer network with 160+ image + 26+ text models
  models.push(...AIHORDE_FREE_MODELS);

  // Virtual models - add auto-routing models for multi-provider availability
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
