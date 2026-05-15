import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo
const virtualModels: Record<string, any> = {
  'gpt-4': {
    id: 'gpt-4',
    providers: [
      { provider: 'groq', modelId: 'groq/openai/gpt-oss-120b', type: 'text' },
      { provider: 'aihorde', modelId: 'aihorde/gpt-4-turbo', type: 'text' },
    ]
  },
  'claude': {
    id: 'claude',
    providers: [
      { provider: 'pollinations', modelId: 'pollinations/claude-fast', type: 'text' },
      { provider: 'aihorde', modelId: 'aihorde/claude-3-sonnet', type: 'text' },
    ]
  },
};

export async function GET() {
  return NextResponse.json({ models: Object.values(virtualModels) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, providers } = body;

    if (!id || !providers || providers.length === 0) {
      return NextResponse.json({ error: 'Invalid model data' }, { status: 400 });
    }

    virtualModels[id] = { id, providers };
    return NextResponse.json({ success: true });
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
