import { getNextKey, getRateLimitForProvider, getKeysForProvider } from './keypool';
import { forwardPollinations, forwardSimpleImage, forwardSimpleText, getPollModel } from './pollinations';
import { forwardVoidAI } from './voidai';
import { forwardAirforce } from './airforce';

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
    return forwardPollinations('/v1/chat/completions', 'POST', body, options);
  }

  if (model.startsWith('voidai/')) {
    return forwardVoidAI('/chat/completions', 'POST', body, options);
  }

  if (model.startsWith('airforce/')) {
    return forwardAirforce('/chat/completions', 'POST', body, options);
  }

  // Default: try AIHubMix → Pollinations → VoidAI → Airforce
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
          return await forwardAirforce('/chat/completions', 'POST', body, options);
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
    return forwardPollinations('/v1/images/generations', 'POST', body);
  }

  if (model.startsWith('voidai/')) {
    return forwardVoidAI('/images/generations', 'POST', body);
  }

  if (model.startsWith('airforce/')) {
    return forwardAirforce('/images/generations', 'POST', body);
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
    return forwardAirforce('/video/generations', 'POST', body);
  }

  // Default: Pollinations for video
  if (model.startsWith('pollinations/')) {
    return forwardPollinations('/v1/videos/generations', 'POST', body);
  }

  return forwardPollinations('/v1/videos/generations', 'POST', body);
}

export async function routeAudio(
  body: unknown,
  options?: RouteOptions
) {
  const model = (body as any)?.model || 'tts-1';

  if (model.startsWith('pollinations/')) {
    return forwardPollinations('/v1/audio/speech', 'POST', body);
  }

  if (model.startsWith('voidai/')) {
    return forwardVoidAI('/audio/speech', 'POST', body);
  }

  if (model.startsWith('airforce/')) {
    return forwardAirforce('/audio/speech', 'POST', body);
  }

  // Default: try AIHubMix → Pollinations → VoidAI → Airforce
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
          return await forwardAirforce('/audio/speech', 'POST', body);
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
    return forwardPollinations('/v1/embeddings', 'POST', body);
  }

  if (model.startsWith('voidai/')) {
    return forwardVoidAI('/embeddings', 'POST', body);
  }

  if (model.startsWith('airforce/')) {
    return forwardAirforce('/embeddings', 'POST', body);
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
    return forwardVoidAI('/audio/transcriptions', 'POST', body);
  }

  if (model.startsWith('airforce/')) {
    return forwardAirforce('/audio/transcriptions', 'POST', body);
  }

  // Default: try VoidAI → Airforce
  try {
    return await forwardVoidAI('/audio/transcriptions', 'POST', body);
  } catch (error) {
    if (options?.autoFallback) {
      return await forwardAirforce('/audio/transcriptions', 'POST', body);
    }
    throw error;
  }
}

export async function routeModels() {
  const models: any[] = [];

  // Fetch AIHubMix models (free tier only)
  try {
    const aihubmixResponse = await forwardAIHubMix('/models', 'GET');
    if (aihubmixResponse.ok) {
      const data = await aihubmixResponse.json();
      if (data.data && Array.isArray(data.data)) {
        models.push(
          ...data.data
            .filter((model: any) => {
              // Filter to free tier models (ending in -free)
              return model.id.endsWith('-free');
            })
            .map((model: any) => ({
              ...model,
              provider: 'AIHubMix',
            }))
        );
      }
    }
  } catch (error) {
    console.error('Error fetching AIHubMix models:', error);
  }

  // Fetch Pollinations models
  try {
    const pollinationsResponse = await forwardPollinations('/v1/models', 'GET');
    if (pollinationsResponse.ok) {
      const data = await pollinationsResponse.json();
      if (data.data && Array.isArray(data.data)) {
        models.push(
          ...data.data.map((model: any) => ({
            ...model,
            provider: 'Pollinations',
          }))
        );
      }
    }
  } catch (error) {
    console.error('Error fetching Pollinations models:', error);
  }

  // Fetch VoidAI models (free tier only)
  try {
    const voidaiResponse = await forwardVoidAI('/models', 'GET');
    if (voidaiResponse.ok) {
      const data = await voidaiResponse.json();
      if (data.data && Array.isArray(data.data)) {
        models.push(
          ...data.data
            .filter((model: any) => {
              // Filter to free tier models
              const planReqs = model.plan_requirements || [];
              return planReqs.includes('free') || planReqs.length === 0;
            })
            .map((model: any) => ({
              ...model,
              provider: 'VoidAI',
            }))
        );
      }
    }
  } catch (error) {
    console.error('Error fetching VoidAI models:', error);
  }

  // Fetch Airforce models (all have free tier)
  try {
    const airforceResponse = await forwardAirforce('/models', 'GET');
    if (airforceResponse.ok) {
      const data = await airforceResponse.json();
      if (data.data && Array.isArray(data.data)) {
        models.push(
          ...data.data.map((model: any) => ({
            ...model,
            provider: 'Airforce',
          }))
        );
      }
    }
  } catch (error) {
    console.error('Error fetching Airforce models:', error);
  }

  // Add special Pollinations models
  models.push(
    {
      id: 'pollinations/image-simple',
      object: 'model',
      owned_by: 'Pollinations',
      provider: 'Pollinations',
      description: 'Simple image generation via image.pollinations.ai',
    },
    {
      id: 'pollinations/text-simple',
      object: 'model',
      owned_by: 'Pollinations',
      provider: 'Pollinations',
      description: 'Simple text generation via text.pollinations.ai',
    }
  );

  // Deduplicate by id
  const seen = new Set<string>();
  const deduped = models.filter((model) => {
    if (seen.has(model.id)) return false;
    seen.add(model.id);
    return true;
  });

  return {
    object: 'list',
    data: deduped,
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

  // Check if user specified an AIHubMix model
  if (userModel?.startsWith('aihubmix/') || !userModel) {
    // AIHubMix only has one key, so always 60
    return 60;
  }

  // Default to higher of the four providers
  const pollinationsLimit = await getRateLimitForProvider('POLLINATIONS');
  const voidaiLimit = await getRateLimitForProvider('VOIDAI');
  const airforceLimit = await getRateLimitForProvider('AIRFORCE');
  return Math.max(60, pollinationsLimit, voidaiLimit, airforceLimit);
}
