import { getNextKey } from './keypool';

/**
 * AI Horde provider implementation
 * Decentralized distributed network for image/text generation
 * Base URL: https://api.aihorde.net/api/v2
 * Uses async polling instead of streaming
 */

export interface AIHordeOptions {
  streaming?: boolean;
}

export async function forwardAIHorde(
  endpoint: string,
  method: string,
  body?: unknown,
  options?: AIHordeOptions
) {
  let apiKey = await getNextKey('AIHORDE');

  // Use default key if none configured
  if (!apiKey) {
    apiKey = '0000000000';
  }

  const url = `https://api.aihorde.net/api/v2${endpoint}`;

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

/**
 * Check AI Horde status endpoint to verify service is available
 */
export async function checkAIHordeStatus(): Promise<boolean> {
  try {
    const response = await fetch('https://api.aihorde.net/api/v2/status/heartbeat');
    return response.ok;
  } catch {
    return false;
  }
}
