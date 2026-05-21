import { NextResponse } from 'next/server';
import { COMING_SOON_PROVIDERS } from '@/lib/providers/coming-soon-providers';
import { getProviderKeyCount } from '@/lib/key-validation';

export const runtime = 'nodejs';

const KEYS_REQUIRED = 3;

// Signup URLs for all providers (used on donate page)
const SIGNUP_URLS: Record<string, string> = {
  // Base providers
  pollinations: 'https://pollinations.ai',
  voidai: 'https://voidai.app',
  cerebras: 'https://cloud.cerebras.ai',
  groq: 'https://console.groq.com',
  aihorde: 'https://aihorde.net/register',
  tokenreply: 'https://tokenreply.com',
  nagaai: 'https://naga.ac',
  airforce: 'https://api.airforce',
  happupy: 'https://beta.hapuppy.com',
  // Coming-soon: Tier 1
  gemini: 'https://aistudio.google.com',
  openrouter: 'https://openrouter.ai/keys',
  'nvidia-nim': 'https://build.nvidia.com',
  siliconflow: 'https://cloud.siliconflow.cn',
  sambanova: 'https://cloud.sambanova.ai',
  'cloudflare-workers-ai': 'https://dash.cloudflare.com',
  huggingface: 'https://huggingface.co/settings/tokens',
  'mistral-ai': 'https://console.mistral.ai',
  'github-models': 'https://github.com/settings/tokens',
  cohere: 'https://dashboard.cohere.com/api-keys',
  'fireworks-ai': 'https://fireworks.ai',
  'together-ai': 'https://api.together.ai',
  'featherless-ai': 'https://featherless.ai',
  scaleway: 'https://console.scaleway.com',
  hyperbolic: 'https://app.hyperbolic.xyz',
  'novita-ai': 'https://novita.ai',
  replicate: 'https://replicate.com/account/api-tokens',
  perplexity: 'https://www.perplexity.ai/settings/api',
  'anthropic-claude': 'https://console.anthropic.com',
  xai: 'https://console.x.ai',
  'stability-ai': 'https://platform.stability.ai',
  'eleven-labs': 'https://elevenlabs.io',
  deepseek: 'https://platform.deepseek.com',
  moonshot: 'https://platform.moonshot.cn',
  zhipu: 'https://open.bigmodel.cn',
  'qwen-api': 'https://bailian.aliyun.com',
  ai21: 'https://studio.ai21.com',
  deepinfra: 'https://deepinfra.com',
  lepton: 'https://www.lepton.ai',
  'fal-ai': 'https://fal.ai',
  'voyage-ai': 'https://dash.voyageai.com',
  'jina-ai': 'https://jina.ai',
  octoai: 'https://octoai.cloud',
  krutrim: 'https://cloud.olakrutrim.com',
  upstage: 'https://console.upstage.ai',
  writer: 'https://dev.writer.com',
  anyscale: 'https://app.endpoints.anyscale.com',
  'mistral-codestral': 'https://console.mistral.ai',
  fishaudio: 'https://fish.audio',
  ideogram: 'https://ideogram.ai',
  'leonardo-ai': 'https://app.leonardo.ai',
  bfl: 'https://api.bfl.ml',
  'luma-ai': 'https://lumalabs.ai',
  'kling-ai': 'https://klingai.com',
  coze: 'https://www.coze.com',
  phind: 'https://www.phind.com',
  maritaca: 'https://plataforma.maritaca.ai',
};

// All providers that have native routing implementations (still need donated keys when no env keys set)
const BASE_PROVIDERS = [
  { id: 'pollinations', name: 'Pollinations', description: 'Multi-modal AI gateway — chat, images, audio, video, transcription, embeddings', freeLimit: 'Unlimited' },
  { id: 'voidai',       name: 'VoidAI',       description: 'OpenAI-compatible inference proxy with a variety of free models', freeLimit: 'Free tier' },
  { id: 'cerebras',     name: 'Cerebras',     description: 'World-fastest inference hardware — Llama 3 at 2000+ tokens/sec', freeLimit: '1M tokens/day' },
  { id: 'groq',         name: 'Groq',         description: 'Lightning-fast LPU inference for open-source models', freeLimit: 'Rate limited' },
  { id: 'aihorde',      name: 'AI Horde',     description: 'Decentralized volunteer GPU network — 160+ image + 26+ text models', freeLimit: 'Priority queue' },
  { id: 'tokenreply',   name: 'TokenReply',   description: 'OpenAI-compatible API aggregating latest frontier models', freeLimit: 'Free tier' },
  { id: 'nagaai',       name: 'NagaAI',       description: 'Multi-modal free-tier API — chat, image, audio, transcription', freeLimit: 'Free tier' },
  { id: 'airforce',     name: 'Airforce',     description: 'Free API endpoints across 50+ models', freeLimit: 'Free' },
  { id: 'happupy',      name: 'Happupy',      description: '100k tokens/day free — easy sign-up, no card required', freeLimit: '100k tokens/day' },
];

export async function GET() {
  try {
    const allRaw = [
      ...BASE_PROVIDERS.map(p => ({ ...p, isBase: true, signupUrl: SIGNUP_URLS[p.id] })),
      ...COMING_SOON_PROVIDERS.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        freeLimit: p.freeLimit,
        isBase: false,
        signupUrl: p.signupUrl ?? SIGNUP_URLS[p.id],
        models: p.models,
      })),
    ];

    const withCounts = await Promise.all(
      allRaw.map(async (p) => ({
        ...p,
        count: await getProviderKeyCount(p.id).catch(() => 0),
      }))
    );

    const providers = withCounts.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      freeLimit: p.freeLimit,
      signupUrl: p.signupUrl ?? null,
      status: p.count >= KEYS_REQUIRED ? 'active' : 'coming_soon',
      keyCount: p.count,
      keysRequired: KEYS_REQUIRED,
      keysNeeded: Math.max(0, KEYS_REQUIRED - p.count),
    }));

    const activeCount = providers.filter(p => p.status === 'active').length;

    return NextResponse.json({
      providers,
      _stats: {
        total_providers: providers.length,
        active_providers: activeCount,
        coming_soon_providers: providers.length - activeCount,
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
