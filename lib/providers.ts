export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
}

export function getProvider(): ProviderConfig {
  const apiKey = process.env.AIHUBMIX_API_KEY;

  if (!apiKey) {
    throw new Error('AIHUBMIX_API_KEY environment variable is not set');
  }

  return {
    name: 'AIHubMix',
    baseUrl: 'https://aihubmix.com/v1',
    apiKey,
  };
}

export async function forwardRequest(
  provider: ProviderConfig,
  endpoint: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>
) {
  const url = `${provider.baseUrl}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Authorization': `Bearer ${provider.apiKey}`,
    'Content-Type': 'application/json',
    ...headers,
  };

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    ...(body && { body: JSON.stringify(body) }),
  });

  return response;
}
