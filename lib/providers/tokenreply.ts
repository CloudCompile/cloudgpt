import { getNextKey } from './keypool';

export async function forwardTokenReply(
  endpoint: string,
  method: string,
  body?: unknown,
  options?: { streaming?: boolean }
) {
  const apiKey = await getNextKey('TOKENREPLY');
  if (!apiKey) {
    throw new Error('No TokenReply API keys configured');
  }

  const response = await fetch(`https://api.tokenreply.com/v1${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  return response;
}
