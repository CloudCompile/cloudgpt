import { NextRequest, NextResponse } from 'next/server';
import { routeModels } from '@/lib/providers';

// In-memory storage (would be Redis/DB in production)
const virtualModels: Record<string, any> = {
  'gpt-4': {
    id: 'gpt-4',
    providers: [
      { provider: 'groq', modelId: 'groq/openai/gpt-oss-120b', type: 'text' },
      { provider: 'aihorde', modelId: 'aihorde/gpt-4-turbo', type: 'text' },
    ]
  },
};

export async function GET() {
  try {
    // Fetch all available models from providers
    const allModels = await routeModels();

    // Group models by provider
    const modelsByProvider: Record<string, any[]> = {};
    allModels.data.forEach((model: any) => {
      if (!modelsByProvider[model.provider]) {
        modelsByProvider[model.provider] = [];
      }
      modelsByProvider[model.provider].push(model);
    });

    return NextResponse.json({
      models: Object.values(virtualModels),
      availableModels: modelsByProvider
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({
      models: Object.values(virtualModels),
      availableModels: {},
      error: 'Failed to fetch some models'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, providers } = body;

    if (!id || !providers || providers.length === 0) {
      return NextResponse.json({ error: 'Invalid model data' }, { status: 400 });
    }

    virtualModels[id] = { id, providers };
    return NextResponse.json({ success: true, model: virtualModels[id] });
  } catch {
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id || !virtualModels[id]) {
    return NextResponse.json({ error: 'Model not found' }, { status: 404 });
  }

  delete virtualModels[id];
  return NextResponse.json({ success: true });
}

