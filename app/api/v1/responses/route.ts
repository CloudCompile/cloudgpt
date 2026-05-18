import { NextRequest, NextResponse } from 'next/server';
import { extractApiKey, validateApiKey, checkRateLimit } from '@/lib/api-keys';
import { routeChat, getDynamicRateLimit } from '@/lib/providers';
import { trackRequest, trackUserRequest } from '@/lib/analytics';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    const apiKey = extractApiKey(request.headers);

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Unauthorized - missing or invalid API key' },
        { status: 401 }
      );
    }

    const keyData = await validateApiKey(apiKey);
    if (!keyData) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid API key' },
        { status: 401 }
      );
    }

    body = await request.json();
    const userModel = (body as any)?.model;

    // Get dynamic rate limit based on model
    const limit = await getDynamicRateLimit(userModel);

    const allowed = await checkRateLimit(apiKey, limit);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Convert Anthropic responses format to chat format
    const chatBody = {
      model: body.model,
      messages: body.messages,
      max_tokens: body.max_tokens,
      temperature: body.temperature,
      top_p: body.top_p,
      top_k: body.top_k,
      stop_sequences: body.stop_sequences,
    };

    const response = await routeChat(chatBody, { streaming: false, autoFallback: true });

    if (!response.ok) {
      console.error('Provider error:', response.status, await response.text());
      return NextResponse.json(
        { error: 'Provider error' },
        { status: response.status }
      );
    }

    // Fire-and-forget analytics
    const model = body.model || 'unknown';
    trackRequest(model).catch(e => console.warn('Failed to track request:', e));
    trackUserRequest(keyData.userId, model).catch(e => console.warn('Failed to track user request:', e));

    const data = await response.json();

    // Convert OpenAI chat format to Anthropic responses format
    const anthropicResponse = {
      type: 'message',
      id: data.id || `msg_${Date.now()}`,
      model: data.model || userModel,
      role: 'assistant',
      content: data.choices?.[0]?.message?.content ? [
        {
          type: 'text',
          text: data.choices[0].message.content,
        }
      ] : [],
      stop_reason: data.choices?.[0]?.finish_reason === 'length' ? 'max_tokens' : (data.choices?.[0]?.finish_reason || 'end_turn'),
      stop_sequence: null,
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
      },
    };

    return NextResponse.json(anthropicResponse);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Responses API error:', error);

    if (errorMsg.includes('All providers failed') || errorMsg.includes('model')) {
      const model = body?.model || 'unknown';
      return NextResponse.json(
        {
          error: `Model "${model}" is not available or failed on all providers`,
          hint: 'Call GET /v1/models to see available models. Use format "provider/model-name" (e.g., "pollinations/claude-fast") or a bare model name for automatic provider selection.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
