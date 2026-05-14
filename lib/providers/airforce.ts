import { getNextKey } from './keypool';

/**
 * API.Airforce provider implementation
 * 100% OpenAI compatible API at https://api.airforce/v1
 * Supports: chat, images, audio/TTS, music, SFX, transcription, video, embeddings
 */

export interface AirforceOptions {
  streaming?: boolean;
}

export async function forwardAirforce(
  endpoint: string,
  method: string,
  body?: unknown,
  options?: AirforceOptions
) {
  const apiKey = await getNextKey('AIRFORCE');
  if (!apiKey) {
    throw new Error('No Airforce API keys configured');
  }

  const url = `https://api.airforce/v1${endpoint}`;

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
