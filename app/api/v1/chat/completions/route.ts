import { NextRequest, NextResponse } from 'next/server';
import { extractApiKey, validateApiKey, checkRateLimit } from '@/lib/api-keys';
import { routeChat, getDynamicRateLimit } from '@/lib/providers';
import { trackRequest, trackUserRequest } from '@/lib/analytics';
import { getPluginConfig, runPluginPipeline } from '@/lib/plugins';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
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

    // Run plugin pipeline (silently transforms messages)
    let processedBody = body;
    if (Array.isArray((body as any)?.messages)) {
      try {
        const pluginConfig = await getPluginConfig(apiKey);
        const transformed = await runPluginPipeline((body as any).messages, pluginConfig, apiKey);
        processedBody = { ...(body as any), messages: transformed };
      } catch (e) {
        console.warn('Plugin pipeline error:', e);
      }
    }

    // Check if streaming is requested
    const streaming = (body as any)?.stream || false;

    const response = await routeChat(processedBody, { streaming, autoFallback: true });

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
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
