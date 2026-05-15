import { getNextKey } from './keypool';

export async function forwardNagaAI(
  endpoint: string,
  method: string,
  body?: unknown,
  options?: { streaming?: boolean }
) {
  const apiKey = await getNextKey('NAGAAI');
  if (!apiKey) throw new Error('No NagaAI API keys configured');

  const response = await fetch(`https://api.naga.ac/v1${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return response;
}
