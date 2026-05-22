import { NextResponse } from 'next/server';
import { routeModels } from '@/lib/providers';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const response = await routeModels();
    const models = response.data;
    const activeModels = models.filter((m: any) => !m.status || m.status !== 'coming_soon');
    const comingSoonModels = models.filter((m: any) => m.status === 'coming_soon');
    const comingSoonProviders = [...new Set(comingSoonModels.map((m: any) => m.provider))];

    const responseData = {
      object: 'list',
      data: models,
      _info: {
        usage: 'Use the "id" field from any model. Models with status "coming_soon" are not yet available — contribute keys via /donate to unlock them.',
        active_providers: 'pollinations, voidai, cerebras, groq, aihorde, tokenreply, nagaai',
        coming_soon_providers: comingSoonProviders.join(', '),
        active_model_count: activeModels.length,
        coming_soon_model_count: comingSoonModels.length,
      }
    };
    const modelCount = models.length;
    return NextResponse.json(
      responseData,
      {
        headers: {
          'X-Available-Models': activeModels.length.toString(),
          'X-Coming-Soon-Models': comingSoonModels.length.toString(),
          'X-Available-Providers': '7',
          // Cache at CDN edge for 5 min; clients may serve stale for 1 min while revalidating
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120',
        }
      }
    );
  } catch (error) {
    console.error('Models API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
