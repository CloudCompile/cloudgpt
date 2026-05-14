import { NextResponse } from 'next/server';
import { routeModels } from '@/lib/providers';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const models = await routeModels();
    return NextResponse.json(models);
  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
