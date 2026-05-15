import { getNextKey } from './keypool';

/**
 * Groq provider implementation
 * 100% OpenAI compatible API at https://api.groq.com/openai/v1
 * Supports chat, transcription, and text-to-speech endpoints
 */

export interface GroqOptions {
  streaming?: boolean;
}

export async function forwardGroq(
  endpoint: string,
  method: string,
  body?: unknown,
  options?: GroqOptions
) {
  const apiKey = await getNextKey('GROQ');
  if (!apiKey) {
    throw new Error('No Groq API keys configured');
  }

  const url = `https://api.groq.com/openai/v1${endpoint}`;

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
