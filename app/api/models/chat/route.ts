import { NextResponse } from 'next/server';
import { CHAT_MODELS } from '@/lib/providers';

export const runtime = 'edge';

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  // Return OpenAI-compatible model list format
  const models = CHAT_MODELS.map(model => ({
    id: model.id,
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    owned_by: model.provider,
    description: model.description,
  }));

  return NextResponse.json({
    object: 'list',
    data: models,
  });
}
