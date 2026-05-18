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
        providers: 'pollinations, voidai, airforce, cerebras, groq, aihorde, tokenreply, nagaai, happupy',
      }
    };
    const modelCount = models.length;
    return NextResponse.json(
      responseData,
      {
        headers: {
          'X-Available-Models': modelCount.toString(),
          'X-Available-Providers': '9',
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
