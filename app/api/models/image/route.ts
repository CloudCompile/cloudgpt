import { NextResponse } from 'next/server';
import { IMAGE_MODELS } from '@/lib/providers';

export const runtime = 'edge';

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function GET() {
  const models = IMAGE_MODELS.map(model => ({
    id: model.id,
    object: 'model',
    created: Math.floor(Date.now() / 1000),
    owned_by: model.provider,
    description: model.description,
    type: 'image',
  }));

  return NextResponse.json({
    object: 'list',
    data: models,
  });
}
