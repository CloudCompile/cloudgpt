import { getNextKey } from './keypool';

/**
 * Pollinations provider implementation
 * Supports both gen.pollinations.ai (full OpenAI API) and simple endpoints
 */

export interface PollinationsOptions {
  streaming?: boolean;
}

// gen.pollinations.ai endpoints (OpenAI compatible)
export async function forwardPollinations(
  endpoint: string,
  method: string,
  body?: unknown,
  options?: PollinationsOptions
) {
  const apiKey = await getNextKey('POLLINATIONS');
  if (!apiKey) {
    throw new Error('No Pollinations API keys configured');
  }

  const url = `https://gen.pollinations.ai${endpoint}`;

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

// Simple image endpoint: image.pollinations.ai/{prompt}
export async function forwardSimpleImage(prompt: string) {
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/${encodedPrompt}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'OpenRelay/1.0',
    },
  });

  return response;
}

// Simple text endpoint: text.pollinations.ai/{prompt}
export async function forwardSimpleText(prompt: string) {
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://text.pollinations.ai/${encodedPrompt}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'OpenRelay/1.0',
    },
  });

  return response;
}

// Video endpoint: gen.pollinations.ai/video/{prompt} (GET, prompt in URL)
export async function forwardPollinationsVideo(
  prompt: string,
  model?: string,
  extra?: Record<string, string | number | undefined>
) {
  const apiKey = await getNextKey('POLLINATIONS');
  if (!apiKey) throw new Error('No Pollinations API keys configured');

  const params = new URLSearchParams();
  if (model) params.set('model', model);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined) params.set(k, String(v));
    }
  }

  const qs = params.toString() ? `?${params.toString()}` : '';
  const url = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}${qs}`;

  return fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
}

// Parse model ID to determine which endpoint to use
export function getPollModel(modelId: string): { type: string; id?: string } {
  if (modelId === 'pollinations/image-simple') {
    return { type: 'image-simple' };
  }
  if (modelId === 'pollinations/text-simple') {
    return { type: 'text-simple' };
  }
  // Any other pollinations/* model goes to gen.pollinations.ai with that ID
  return { type: 'gen', id: modelId.replace('pollinations/', '') };
}
