import { NextRequest, NextResponse } from 'next/server';
import { extractApiKey, checkRateLimit, getRateLimitInfo } from '@/lib/api-keys';
import { CHAT_MODELS, PROVIDER_URLS } from '@/lib/providers';

export const runtime = 'edge';

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    // Extract and validate API key
    const apiKey = extractApiKey(request.headers);
    
    // Check rate limit (allow anonymous with lower limits)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'anonymous';
    const effectiveKey = apiKey || clientIp;
    const limit = apiKey ? 60 : 10; // Higher limit for authenticated users
    
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
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      );
    }

    // Get model or use default
    const modelId = body.model || 'openai';
    const model = CHAT_MODELS.find(m => m.id === modelId);
    
    if (!model) {
      return NextResponse.json(
        { error: `Unknown model: ${modelId}. Available models: ${CHAT_MODELS.map(m => m.id).join(', ')}` },
        { status: 400 }
      );
    }

    // Forward to Pollinations API
    const pollinationsUrl = `${PROVIDER_URLS.pollinations}/v1/chat/completions`;
    
    const pollinationsResponse = await fetch(pollinationsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.POLLINATIONS_API_KEY && {
          'Authorization': `Bearer ${process.env.POLLINATIONS_API_KEY}`,
        }),
      },
      body: JSON.stringify({
        model: modelId,
        messages: body.messages,
        temperature: body.temperature,
        max_tokens: body.max_tokens,
        stream: body.stream || false,
        top_p: body.top_p,
        frequency_penalty: body.frequency_penalty,
        presence_penalty: body.presence_penalty,
      }),
    });

    if (!pollinationsResponse.ok) {
      const errorText = await pollinationsResponse.text();
      return NextResponse.json(
        { error: 'Upstream API error', details: errorText },
        { status: pollinationsResponse.status }
      );
    }

    // Handle streaming response
    if (body.stream) {
      return new NextResponse(pollinationsResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Return JSON response
    const data = await pollinationsResponse.json();
    
    const rateLimitInfo = getRateLimitInfo(effectiveKey);
    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Remaining': String(rateLimitInfo.remaining),
        'X-RateLimit-Reset': String(rateLimitInfo.resetAt),
      },
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
