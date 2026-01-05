import { NextRequest, NextResponse } from 'next/server';
import { extractApiKey, checkRateLimit, getRateLimitInfo } from '@/lib/api-keys';
import { VIDEO_MODELS, PROVIDER_URLS } from '@/lib/providers';

export const runtime = 'edge';

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    // Extract and validate API key
    const apiKey = extractApiKey(request.headers);
    
    // Check rate limit (video generation is expensive, stricter limits)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'anonymous';
    const effectiveKey = apiKey || clientIp;
    const limit = apiKey ? 10 : 2;
    
    if (!checkRateLimit(effectiveKey, limit)) {
      const rateLimitInfo = getRateLimitInfo(effectiveKey);
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetAt: rateLimitInfo.resetAt },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitInfo.resetAt),
          },
        }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    // Get model or use default
    const modelId = body.model || 'veo';
    const model = VIDEO_MODELS.find(m => m.id === modelId);
    
    if (!model) {
      return NextResponse.json(
        { error: `Unknown model: ${modelId}. Available models: ${VIDEO_MODELS.map(m => m.id).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate duration
    const duration = body.duration || 4;
    if (model.maxDuration && duration > model.maxDuration) {
      return NextResponse.json(
        { error: `Duration exceeds maximum of ${model.maxDuration} seconds for ${modelId}` },
        { status: 400 }
      );
    }

    // Build Pollinations URL with query params
    // Note: Pollinations uses the same /image/ endpoint for video generation
    // The model parameter (veo, seedance) determines the output type
    const params = new URLSearchParams();
    params.set('model', modelId);
    if (body.duration) params.set('duration', String(body.duration));
    if (body.aspectRatio) params.set('aspectRatio', body.aspectRatio);
    if (body.image) params.set('image', body.image);
    if (body.audio) params.set('audio', 'true');
    
    const encodedPrompt = encodeURIComponent(body.prompt);
    const pollinationsUrl = `${PROVIDER_URLS.pollinations}/image/${encodedPrompt}?${params.toString()}`;
    
    const headers: Record<string, string> = {};
    if (process.env.POLLINATIONS_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.POLLINATIONS_API_KEY}`;
    }
    
    const pollinationsResponse = await fetch(pollinationsUrl, { headers });

    if (!pollinationsResponse.ok) {
      const errorText = await pollinationsResponse.text();
      return NextResponse.json(
        { error: 'Upstream API error', details: errorText },
        { status: pollinationsResponse.status }
      );
    }

    // Check if response is JSON (error) or binary (video)
    const contentType = pollinationsResponse.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await pollinationsResponse.json();
      return NextResponse.json(data);
    }

    // Return the video
    const videoBuffer = await pollinationsResponse.arrayBuffer();
    
    const rateLimitInfo = getRateLimitInfo(effectiveKey);
    return new NextResponse(videoBuffer, {
      headers: {
        'Content-Type': contentType || 'video/mp4',
        'X-RateLimit-Remaining': String(rateLimitInfo.remaining),
        'X-RateLimit-Reset': String(rateLimitInfo.resetAt),
      },
    });
    
  } catch (error) {
    console.error('Video API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
