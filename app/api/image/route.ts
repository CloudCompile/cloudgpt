import { NextRequest, NextResponse } from 'next/server';
import { extractApiKey, checkRateLimit, getRateLimitInfo } from '@/lib/api-keys';
import { IMAGE_MODELS, PROVIDER_URLS } from '@/lib/providers';

export const runtime = 'edge';

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    // Extract and validate API key
    const apiKey = extractApiKey(request.headers);
    
    // Check rate limit
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'anonymous';
    const effectiveKey = apiKey || clientIp;
    const limit = apiKey ? 30 : 5; // Image generation has lower limits
    
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
    const modelId = body.model || 'flux';
    const model = IMAGE_MODELS.find(m => m.id === modelId);
    
    if (!model) {
      return NextResponse.json(
        { error: `Unknown model: ${modelId}. Available models: ${IMAGE_MODELS.map(m => m.id).join(', ')}` },
        { status: 400 }
      );
    }

    // Build Pollinations URL with query params
    const params = new URLSearchParams();
    if (body.model) params.set('model', body.model);
    if (body.width) params.set('width', String(body.width));
    if (body.height) params.set('height', String(body.height));
    if (body.seed) params.set('seed', String(body.seed));
    if (body.enhance) params.set('enhance', 'true');
    if (body.negative_prompt) params.set('negative_prompt', body.negative_prompt);
    if (body.quality) params.set('quality', body.quality);
    if (body.nologo) params.set('nologo', 'true');
    
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

    // Check if response is JSON (error) or binary (image)
    const contentType = pollinationsResponse.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await pollinationsResponse.json();
      return NextResponse.json(data);
    }

    // Return the image
    const imageBuffer = await pollinationsResponse.arrayBuffer();
    
    const rateLimitInfo = getRateLimitInfo(effectiveKey);
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType || 'image/png',
        'X-RateLimit-Remaining': String(rateLimitInfo.remaining),
        'X-RateLimit-Reset': String(rateLimitInfo.resetAt),
      },
    });
    
  } catch (error) {
    console.error('Image API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET requests with query params
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const prompt = searchParams.get('prompt');
  
  if (!prompt) {
    return NextResponse.json(
      { error: 'prompt query parameter is required' },
      { status: 400 }
    );
  }

  // Convert query params to body and call POST handler
  const body = {
    prompt,
    model: searchParams.get('model') || 'flux',
    width: searchParams.get('width') ? parseInt(searchParams.get('width')!) : undefined,
    height: searchParams.get('height') ? parseInt(searchParams.get('height')!) : undefined,
    seed: searchParams.get('seed') ? parseInt(searchParams.get('seed')!) : undefined,
    enhance: searchParams.get('enhance') === 'true',
    negative_prompt: searchParams.get('negative_prompt'),
    quality: searchParams.get('quality'),
    nologo: searchParams.get('nologo') === 'true',
  };

  // Create a new request with the body
  const newRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: request.headers,
  });

  return POST(newRequest);
}
