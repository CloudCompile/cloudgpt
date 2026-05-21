import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAdmin } from '@/lib/admin';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';

export interface Endpoint {
  id: string;
  name: string;
  path: string;
  description: string;
  category: 'text' | 'image' | 'audio' | 'video';
}

const ALL_ENDPOINTS: Endpoint[] = [
  { id: 'chat', name: 'Chat Completions', path: '/v1/chat/completions', description: 'Text generation and conversation', category: 'text' },
  { id: 'images', name: 'Image Generation', path: '/v1/images/generations', description: 'Create, edit, and generate images', category: 'image' },
  { id: 'videos', name: 'Video Generation', path: '/v1/videos/generations', description: 'Create and edit videos', category: 'video' },
  { id: 'audio-speech', name: 'Text to Speech', path: '/v1/audio/speech', description: 'Convert text to audio', category: 'audio' },
  { id: 'audio-transcription', name: 'Audio Transcription', path: '/v1/audio/transcriptions', description: 'Convert audio to text', category: 'audio' },
  { id: 'embeddings', name: 'Embeddings', path: '/v1/embeddings', description: 'Generate text embeddings', category: 'text' },
];

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const enabledJson = await redis.get('admin:endpoints:enabled');
    const enabled = enabledJson ? JSON.parse(enabledJson) : ALL_ENDPOINTS.map(e => e.id);

    const endpoints = ALL_ENDPOINTS.map(ep => ({
      ...ep,
      enabled: enabled.includes(ep.id),
    }));

    return NextResponse.json({
      endpoints,
      stats: {
        total: endpoints.length,
        enabled: endpoints.filter(e => e.enabled).length,
        disabled: endpoints.filter(e => !e.enabled).length,
      },
    });
  } catch (error) {
    console.error('Endpoints API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = await checkAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { endpointId, enabled } = body;

    if (!endpointId || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const enabledJson = await redis.get('admin:endpoints:enabled');
    let enabled_list = enabledJson ? JSON.parse(enabledJson) : ALL_ENDPOINTS.map(e => e.id);

    if (enabled) {
      enabled_list = [...new Set([...enabled_list, endpointId])];
    } else {
      enabled_list = enabled_list.filter((id: string) => id !== endpointId);
    }

    await redis.set('admin:endpoints:enabled', JSON.stringify(enabled_list));

    const endpoints = ALL_ENDPOINTS.map(ep => ({
      ...ep,
      enabled: enabled_list.includes(ep.id),
    }));

    return NextResponse.json({
      success: true,
      endpoints,
      stats: {
        total: endpoints.length,
        enabled: endpoints.filter((e: any) => e.enabled).length,
        disabled: endpoints.filter((e: any) => !e.enabled).length,
      },
    });
  } catch (error) {
    console.error('Endpoints update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
