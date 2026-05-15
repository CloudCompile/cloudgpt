import { getNextKey } from './keypool';

/**
 * AI Horde Polling handler for async image/text generation
 * Polls the status endpoint until request completes or times out
 */

const POLL_INTERVAL_MS = 1000; // Poll every 1 second
const MAX_WAIT_MS = 5 * 60 * 1000; // 5 minute timeout

async function pollStatus(
  endpoint: string,
  requestId: string,
  maxWaitMs: number = MAX_WAIT_MS
): Promise<any> {
  let apiKey = await getNextKey('AIHORDE');
  if (!apiKey) {
    apiKey = '0000000000';
  }

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await fetch(
        `https://api.aihorde.net/api/v2/${endpoint}/${requestId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited, wait longer
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS * 2));
          continue;
        }
        if (response.status === 503) {
          // Service temporarily unavailable
          throw new Error('AI Horde service temporarily unavailable');
        }
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();

      // Check if done
      if (data.done === true || (data.finished && !data.processing)) {
        return data;
      }

      // Still processing, wait and retry
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    } catch (error) {
      if (error instanceof Error && error.message.includes('unavailable')) {
        throw error;
      }
      // Continue polling on transient errors
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }

  // Timeout
  throw new Error('AI Horde request timeout (5 minutes)');
}

export async function handleImageRequest(
  requestId: string,
  maxWaitMs?: number
): Promise<any> {
  return pollStatus('generate/status', requestId, maxWaitMs);
}

export async function handleTextRequest(
  requestId: string,
  maxWaitMs?: number
): Promise<any> {
  return pollStatus('generate/text/status', requestId, maxWaitMs);
}

export async function handleInterrogationRequest(
  requestId: string,
  maxWaitMs?: number
): Promise<any> {
  return pollStatus('interrogate/status', requestId, maxWaitMs);
}
