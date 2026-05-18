import { NextRequest, NextResponse } from 'next/server';
import { extractApiKey, validateApiKey, checkRateLimit } from '@/lib/api-keys';
import { routeChat, getDynamicRateLimit } from '@/lib/providers';
import { trackRequest, trackUserRequest } from '@/lib/analytics';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    const apiKey = extractApiKey(request.headers);

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid API key' },
        { status: 401 }
      );
    }

    const keyData = await validateApiKey(apiKey);
    if (!keyData) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid API key' },
        { status: 401 }
      );
    }

    body = await request.json();
    const userModel = (body as any)?.model;

    // Get dynamic rate limit based on model
    const limit = await getDynamicRateLimit(userModel);

    const allowed = await checkRateLimit(apiKey, limit);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Check if streaming is requested
    const streaming = (body as any)?.stream || false;

    const response = await routeChat(body, { streaming, autoFallback: true });

    if (!response.ok) {
      console.error('Provider error:', response.status, await response.text());
      return NextResponse.json(
        { error: 'Provider error' },
        { status: response.status }
      );
    }

    // Fire-and-forget analytics (never blocks or throws)
    const model = (body as any)?.model || 'unknown';
    trackRequest(model).catch(e => console.warn('Failed to track request:', e));
    trackUserRequest(keyData.userId, model).catch(e => console.warn('Failed to track user request:', e));

    // Handle streaming
    if (streaming && response.body) {
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Chat API error:', error);

    // Provide helpful guidance for model-related errors
    if (errorMsg.includes('All providers failed') || errorMsg.includes('model')) {
      const model = body?.model || 'unknown';
      return NextResponse.json(
        {
          error: `Model "${model}" is not available or failed on all providers`,
          hint: 'Call GET /v1/models to see available models. Use format "provider/model-name" (e.g., "pollinations/claude-fast") or a bare model name for automatic provider selection.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
