import { NextResponse } from 'next/server';
import { getProvider, forwardRequest } from '@/lib/providers';

export const runtime = 'edge';

export async function GET() {
  try {
    const provider = getProvider();

    const response = await forwardRequest(provider, '/models', 'GET');

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
    console.error('Models API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
