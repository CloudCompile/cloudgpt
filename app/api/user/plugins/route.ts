import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserKeys, validateApiKey } from '@/lib/api-keys';
import { getPluginConfig, savePluginConfig, DEFAULT_PLUGIN_CONFIG } from '@/lib/plugins';
import { refreshWikiCache } from '@/lib/plugins/lorebook';

export const runtime = 'nodejs';

async function ownsKey(userId: string, keyId: string): Promise<boolean> {
  const userKeys = await getUserKeys(userId);
  if (!userKeys.includes(keyId)) return false;
  const data = await validateApiKey(keyId);
  return !!data;
}

// GET /api/user/plugins?keyId=or_...
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keyId = request.nextUrl.searchParams.get('keyId');
  if (!keyId) return NextResponse.json({ error: 'keyId required' }, { status: 400 });

  if (!(await ownsKey(userId, keyId))) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  const config = await getPluginConfig(keyId);
  return NextResponse.json({ config });
}

// POST /api/user/plugins — save plugin config
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { keyId, config } = body;

  if (!keyId || !config) {
    return NextResponse.json({ error: 'keyId and config required' }, { status: 400 });
  }

  if (!(await ownsKey(userId, keyId))) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  const merged = {
    tokenSaver: { ...DEFAULT_PLUGIN_CONFIG.tokenSaver, ...config.tokenSaver },
    lorebook: {
      ...DEFAULT_PLUGIN_CONFIG.lorebook,
      ...config.lorebook,
      entries: Array.isArray(config.lorebook?.entries) ? config.lorebook.entries : [],
    },
    uncensored: { ...DEFAULT_PLUGIN_CONFIG.uncensored, ...config.uncensored },
    rpOptimize: { ...DEFAULT_PLUGIN_CONFIG.rpOptimize, ...config.rpOptimize },
    webSearch: { ...DEFAULT_PLUGIN_CONFIG.webSearch, ...config.webSearch },
  };

  await savePluginConfig(keyId, merged);
  return NextResponse.json({ success: true });
}

// PUT /api/user/plugins — refresh wiki cache
export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { keyId } = body;

  if (!keyId) return NextResponse.json({ error: 'keyId required' }, { status: 400 });

  if (!(await ownsKey(userId, keyId))) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  const config = await getPluginConfig(keyId);
  if (!config.lorebook.wikiUrl) {
    return NextResponse.json({ error: 'No wiki URL configured' }, { status: 400 });
  }

  const content = await refreshWikiCache(keyId, config.lorebook.wikiUrl);
  return NextResponse.json({ success: true, preview: content?.slice(0, 300) });
}
