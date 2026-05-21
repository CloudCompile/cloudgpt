import { NextResponse } from 'next/server';
import { COMING_SOON_PROVIDERS } from '@/lib/providers/coming-soon-providers';
import { getProviderKeyCount } from '@/lib/key-validation';

export const runtime = 'nodejs';

const KEYS_REQUIRED = 3;

// All implemented providers with their metadata
const IMPLEMENTED_PROVIDERS = [
  { id: 'pollinations', name: 'Pollinations', description: 'Multi-modal AI gateway — chat, images, audio, video, transcription, embeddings', freeLimit: 'Unlimited' },
  { id: 'voidai',       name: 'VoidAI',       description: 'OpenAI-compatible inference proxy with a variety of free models', freeLimit: 'Free tier' },
  { id: 'cerebras',     name: 'Cerebras',     description: 'World-fastest inference hardware — Llama 3 at 2000+ tokens/sec', freeLimit: '1M tokens/day' },
  { id: 'groq',         name: 'Groq',         description: 'Lightning-fast LPU inference for open-source models', freeLimit: 'Rate limited' },
  { id: 'aihorde',      name: 'AI Horde',     description: 'Decentralized volunteer GPU network — 160+ image + 26+ text models', freeLimit: 'Priority queue' },
  { id: 'tokenreply',   name: 'TokenReply',   description: 'OpenAI-compatible API aggregating latest frontier models', freeLimit: 'Free tier' },
  { id: 'nagaai',       name: 'NagaAI',       description: 'Multi-modal free-tier API — chat, image, audio, transcription', freeLimit: 'Free tier' },
];

export async function GET() {
  try {
    // Check key counts for implemented providers and coming-soon in parallel
    const [implementedCounts, comingSoonCounts] = await Promise.all([
      Promise.all(
        IMPLEMENTED_PROVIDERS.map(async (p) => ({
          ...p,
          count: await getProviderKeyCount(p.id).catch(() => 0),
        }))
      ),
      Promise.all(
        COMING_SOON_PROVIDERS.map(async (p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          freeLimit: p.freeLimit,
          count: await getProviderKeyCount(p.id).catch(() => 0),
          models: p.models,
        }))
      ),
    ]);

    const implemented = implementedCounts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      freeLimit: p.freeLimit,
      status: p.count >= KEYS_REQUIRED ? 'active' : 'coming_soon',
      keyCount: p.count,
      keysRequired: KEYS_REQUIRED,
      keysNeeded: Math.max(0, KEYS_REQUIRED - p.count),
    }));

    const comingSoon = comingSoonCounts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      freeLimit: p.freeLimit,
      status: p.count >= KEYS_REQUIRED ? 'active' : 'coming_soon',
      keyCount: p.count,
      keysRequired: KEYS_REQUIRED,
      keysNeeded: Math.max(0, KEYS_REQUIRED - p.count),
      models: p.models.map(m => ({
        id: `${p.id}/${m.id}`,
        owned_by: m.owned_by,
        type: m.type,
      })),
    }));

    const allProviders = [...implemented, ...comingSoon];
    const activeCount = allProviders.filter(p => p.status === 'active').length;

    return NextResponse.json({
      providers: allProviders,
      _stats: {
        total_providers: allProviders.length,
        active_providers: activeCount,
        coming_soon_providers: allProviders.length - activeCount,
        keys_required_to_activate: KEYS_REQUIRED,
        donate_url: '/donate',
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
      },
    });
  } catch (error) {
    console.error('Providers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
