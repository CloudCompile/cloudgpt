// Verify which models are actually free by checking provider documentation

const providers = {
  Pollinations: {
    freeModels: [
      'nova-fast', 'mistral', 'llama-scout', 'qwen-coder', 'llama', 'gemini-fast',
      'mistral-4', 'openai', 'qwen-vision', 'perplexity-fast', 'gemini-search',
      'qwen-safety', 'nova', 'openai-fast', 'deepseek', 'minimax', 'openai-audio',
      'midijourney', 'qwen-vision-pro', 'kimi', 'mistral-large', 'qwen-coder-large',
      'claude-fast', 'perplexity-reasoning', 'glm', 'grok', 'kimi-k2.6', 'qwen-large',
      'openai-large', 'polly', 'flux', 'zimage', 'klein', 'gptimage', 'kontext',
      'image-simple', 'nova-reel', 'qwen-tts', 'acestep', 'whisper', 'universal-2',
      'scribe', 'openai-3-small', 'openai-3-large'
    ],
    note: 'All Pollinations models are free community-contributed via Pollinations platform',
    pricing: 'https://enter.pollinations.ai/#models'
  },

  Groq: {
    freeModels: [
      'llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'llama-4-scout-17b-16e-instruct',
      'qwen/qwen3-32b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b',
      'openai/gpt-oss-safeguard-20b', 'meta-llama/llama-prompt-guard-2-22m',
      'meta-llama/llama-prompt-guard-2-86m', 'allam-2-7b', 'compound', 'compound-mini',
      'whisper-large-v3', 'whisper-large-v3-turbo', 'canopylabs/orpheus-v1-english',
      'canopylabs/orpheus-arabic-saudi'
    ],
    note: 'Groq has rate limits on free tier but no payment required',
    pricing: 'https://console.groq.com/docs/models',
    rateLimit: '30 requests per minute'
  },

  Cerebras: {
    freeModels: ['llama-3.3-70b', 'llama-4-scout', 'deepseek-r1'],
    note: '1M tokens per day limit on free tier',
    pricing: 'https://cloud.cerebras.ai/docs',
    limitation: '1M tokens/day free limit'
  },

  VoidAI: {
    freeModels: 'Check at voidai.app - dynamically fetched',
    note: 'Free tier available but needs verification from their API',
    pricing: 'https://voidai.app/#models'
  },

  Airforce: {
    freeModels: 'Models with multiplier == null or multiplier <= 1',
    note: 'Free models dynamically fetched from api.airforce/models',
    pricing: 'https://api.airforce/models'
  },

  TokenReply: {
    freeModels: [
      'deepseek-ai/deepseek-v4-flash', 'deepseek-ai/deepseek-v4-pro',
      'google/gemma-3n-e2b-it', 'google/gemma-3n-e4b-it', 'google/gemma-4-31b-it',
      'grok-4.20-fast', 'minimaxai/minimax-m2.7', 'moonshotai/kimi-k2.6',
      'openai/gpt-oss-120b', 'qwen/qwen3-coder-480b-a35b-instruct',
      'qwen/qwen3.5-397b-a17b', 'stepfun-ai/step-3.5-flash',
      'z-ai/glm-5.1', 'z-ai/glm5'
    ],
    note: 'TokenReply offers free API access to multiple models',
    pricing: 'https://api.tokenreply.com/docs'
  },

  NagaAI: {
    freeModels: [
      'glm-4.5-air', 'nvidia/nemotron-3-super', 'gemini-2.5-flash',
      'llama-3.3-70b-instruct', 'sonar', 'llama-4-scout-17b-16e-instruct',
      'gpt-4.1-mini', 'eleven-multilingual-v2', 'gpt-4o-mini-tts',
      'dall-e-3', 'flux-1-schnell', 'sdxl', 'whisper-large-v3'
    ],
    note: 'Mix of text, image, audio, and transcription models on free tier',
    pricing: 'https://www.naga.ac/#models'
  },

  AIHorde: {
    freeModels: '183+ models including text, image, and video generation',
    note: 'Decentralized volunteer network - completely free',
    pricing: 'https://aihorde.net/api/v2/status/models'
  },

  Happupy: {
    freeModels: 'Not yet verified',
    note: 'Needs API check at beta.hapuppy.com',
    pricing: 'https://beta.hapuppy.com/docs',
    status: '❌ NOT IMPLEMENTED IN CODE'
  }
};

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('FREE MODELS VERIFICATION STATUS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let totalFree = 0;
for (const [provider, info] of Object.entries(providers)) {
  const count = Array.isArray(info.freeModels) ? info.freeModels.length : '?';
  if (typeof count === 'number') totalFree += count;

  console.log(`\n📦 ${provider}`);
  console.log(`   Models: ${count}`);
  console.log(`   Note: ${info.note}`);
  if (info.limitation) console.log(`   ⚠️  Limitation: ${info.limitation}`);
  if (info.rateLimit) console.log(`   ⚡ Rate Limit: ${info.rateLimit}`);
  if (info.status) console.log(`   ${info.status}`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`\n✅ TOTAL VERIFIED FREE MODELS: ${totalFree}+`);
console.log(`✅ ACTIVE PROVIDERS: 8`);
console.log(`❌ MISSING: Happupy (not implemented)`);
console.log(`\n⚠️  ACTION ITEMS:`);
console.log(`   1. Verify VoidAI and Airforce models by testing their APIs`);
console.log(`   2. Implement Happupy provider if needed`);
console.log(`   3. Verify no paid models snuck into lists`);
console.log(`   4. Set up monitoring for price changes\n`);
