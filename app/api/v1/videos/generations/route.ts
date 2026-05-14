import { NextRequest, NextResponse } from 'next/server';
import { extractApiKey, validateApiKey, checkRateLimit } from '@/lib/api-keys';
import { getProvider, forwardRequest } from '@/lib/providers';

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

    const allowed = await checkRateLimit(apiKey, 60);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const provider = getProvider();

    const response = await forwardRequest(
      provider,
      '/videos/generations',
      'POST',
      body
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Provider error', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Videos API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
