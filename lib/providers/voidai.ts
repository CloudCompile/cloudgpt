import { getNextKey } from './keypool';

/**
 * VoidAI provider implementation
 * 100% OpenAI compatible API at https://api.voidai.app/v1
 */

export interface VoidAIOptions {
  streaming?: boolean;
}

export async function forwardVoidAI(
  endpoint: string,
  method: string,
  body?: unknown,
  options?: VoidAIOptions
) {
  const apiKey = await getNextKey('VOIDAI');
  if (!apiKey) {
    throw new Error('No VoidAI API keys configured');
  }

  const url = `https://api.voidai.app/v1${endpoint}`;

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
