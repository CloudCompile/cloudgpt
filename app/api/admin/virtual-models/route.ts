import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { routeModels } from '@/lib/providers';

const VIRTUAL_MODELS_KEY = 'virtual_models';

export async function GET() {
  try {
    const allModels = await routeModels();

    const modelsByProvider: Record<string, any[]> = {};
    allModels.data.forEach((model: any) => {
      if (!modelsByProvider[model.provider]) {
        modelsByProvider[model.provider] = [];
      }
      modelsByProvider[model.provider].push(model);
    });

    let virtualModels = [];
    try {
      const stored = await redis.get(VIRTUAL_MODELS_KEY);
      if (stored) {
        virtualModels = JSON.parse(stored);
      }
    } catch (redisError) {
      console.warn('Redis read failed, returning empty models:', redisError);
    }

    return NextResponse.json({
      models: virtualModels,
      availableModels: modelsByProvider
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({
      models: [],
      availableModels: {},
      error: 'Failed to fetch some models'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, providers } = body;

    console.log('[POST /api/admin/virtual-models] Received:', { id, providers });

    if (!id || !providers || providers.length === 0) {
      console.error('[POST /api/admin/virtual-models] Validation failed:', { id, providers });
      return NextResponse.json({ error: 'Invalid model data' }, { status: 400 });
    }

    const newModel = { id, providers };

    let models = [];
    try {
      const stored = await redis.get(VIRTUAL_MODELS_KEY);
      if (stored) {
        models = JSON.parse(stored);
      }
    } catch (redisError) {
      console.warn('Redis read failed, starting with empty array:', redisError);
    }

    const existingIndex = models.findIndex((m: any) => m.id === id);
    if (existingIndex >= 0) {
      models[existingIndex] = newModel;
    } else {
      models.push(newModel);
    }

    await redis.set(VIRTUAL_MODELS_KEY, JSON.stringify(models));
    console.log('[POST /api/admin/virtual-models] Model saved successfully:', newModel);

    return NextResponse.json({ success: true, model: newModel });
  } catch (error) {
    console.error('[POST /api/admin/virtual-models] Error:', error);
    return NextResponse.json({ error: 'Failed to create model: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('[DELETE /api/admin/virtual-models] Deleting model:', id);

    if (!id) {
      return NextResponse.json({ error: 'Model ID required' }, { status: 400 });
    }

    let models = [];
    try {
      const stored = await redis.get(VIRTUAL_MODELS_KEY);
      if (stored) {
        models = JSON.parse(stored);
      }
    } catch (redisError) {
      console.warn('Redis read failed:', redisError);
      return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 });
    }

    const filtered = models.filter((m: any) => m.id !== id);

    if (filtered.length === models.length) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    await redis.set(VIRTUAL_MODELS_KEY, JSON.stringify(filtered));
    console.log('[DELETE /api/admin/virtual-models] Model deleted successfully:', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/virtual-models] Error:', error);
    return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 });
  }
}
