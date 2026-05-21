import { NextResponse } from 'next/server';
import { routeModels } from '@/lib/providers';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const response = await routeModels();
    const models = response.data;
    const responseData = {
      object: 'list',
      data: models,
      _info: {
        usage: 'Use the "id" field from any model. For bare model names without a provider prefix (e.g., "gpt-4o-free"), the system will automatically try providers in order. For provider-specific models, prefix with the provider name (e.g., "pollinations/claude-fast", "groq/llama-3.3-70b-versatile").',
        providers: 'pollinations, voidai, cerebras, groq, aihorde, tokenreply, nagaai',
        note: 'airforce disabled - all models have pricing despite "Free" tag. happupy not implemented.',
      }
    };
    const modelCount = models.length;
    return NextResponse.json(
      responseData,
      {
        headers: {
          'X-Available-Models': modelCount.toString(),
          'X-Available-Providers': '7',
          // Cache at CDN edge for 5 min; clients may serve stale for 1 min while revalidating
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
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
