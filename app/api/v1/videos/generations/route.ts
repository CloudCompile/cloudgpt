import { NextRequest, NextResponse } from 'next/server';
import { extractApiKey, validateApiKey, checkRateLimit } from '@/lib/api-keys';
import { routeVideo, getDynamicRateLimit } from '@/lib/providers';

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

    if (!body.prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    const userModel = body.model || 'pollinations/text-to-video';
    const limit = await getDynamicRateLimit(userModel);

    const allowed = await checkRateLimit(apiKey, limit);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const response = await routeVideo(body);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Provider error', details: errorText },
        { status: response.status }
      );
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('video/')) {
      // Return raw video
      const videoBuffer = await response.arrayBuffer();
      return new NextResponse(videoBuffer, {
        headers: { 'Content-Type': 'video/mp4' },
      });
    }

    // Return JSON response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Videos API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
