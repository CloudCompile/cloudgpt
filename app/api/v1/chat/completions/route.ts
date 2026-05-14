import { NextRequest, NextResponse } from 'next/server';
import { extractApiKey, validateApiKey, checkRateLimit } from '@/lib/api-keys';
import { routeChat, getDynamicRateLimit } from '@/lib/providers';

export const runtime = 'edge';

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

    // Check if streaming is requested
    const streaming = (body as any)?.stream || false;

    const response = await routeChat(body, { streaming, autoFallback: true });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Provider error', details: errorText },
        { status: response.status }
      );
    }

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
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
