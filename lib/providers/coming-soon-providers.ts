/**
 * Coming-soon providers: 100+ free AI API providers
 * Each requires 3+ verified keys before activation
 * These will show in /v1/models but won't route until keys are donated
 */

export interface ComingSoonProvider {
  id: string;
  name: string;
  models: {
    id: string;
    owned_by: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'transcription';
  }[];
  description: string;
  freeLimit: string;
  keysRequired: number; // always 3 for now
  signupUrl?: string;
}

export const COMING_SOON_PROVIDERS: ComingSoonProvider[] = [
  // Tier 1: Major providers (top 20)
  {
    id: 'gemini',
    name: 'Google Gemini (AI Studio)',
    models: [
      { id: 'gemini-2.5-pro', owned_by: 'Google', type: 'text' },
      { id: 'gemini-2.5-flash', owned_by: 'Google', type: 'text' },
      { id: 'gemini-2.0-flash', owned_by: 'Google', type: 'text' },
    ],
    description: '1,500 req/day, 60 RPM',
    freeLimit: '1500/day',
    keysRequired: 3,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: [
      { id: 'deepseek/deepseek-v4-flash:free', owned_by: 'DeepSeek', type: 'text' },
      { id: 'minimax/minimax-m2.5:free', owned_by: 'MiniMax', type: 'text' },
      { id: 'google/gemma-4-31b-it:free', owned_by: 'Google', type: 'text' },
      { id: 'nvidia/nemotron-3-super-120b-a12b:free', owned_by: 'NVIDIA', type: 'text' },
      { id: 'openai/gpt-oss-120b:free', owned_by: 'OpenAI', type: 'text' },
      { id: 'arcee-ai/trinity-large-thinking:free', owned_by: 'Arcee AI', type: 'text' },
      { id: 'google/gemma-4-26b-a4b-it:free', owned_by: 'Google', type: 'text' },
      { id: 'qwen/qwen3-coder:free', owned_by: 'Qwen', type: 'text' },
      { id: 'openai/gpt-oss-20b:free', owned_by: 'OpenAI', type: 'text' },
      { id: 'nvidia/nemotron-3-nano-30b-a3b:free', owned_by: 'NVIDIA', type: 'text' },
      { id: 'z-ai/glm-4.5-air:free', owned_by: 'Z.ai', type: 'text' },
      { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', owned_by: 'NVIDIA', type: 'text' },
      { id: 'qwen/qwen3-next-80b-a3b-instruct:free', owned_by: 'Qwen', type: 'text' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', owned_by: 'Meta', type: 'text' },
      { id: 'meta-llama/llama-3.2-3b-instruct:free', owned_by: 'Meta', type: 'text' },
      { id: 'liquid/lfm-2.5-1.2b-thinking:free', owned_by: 'LiquidAI', type: 'text' },
      { id: 'openrouter/free', owned_by: 'OpenRouter', type: 'text' },
    ],
    description: '20+ free models including DeepSeek V4, Gemma 4, Nemotron 3, Qwen, and more',
    freeLimit: '200K - 1M context depending on model',
    keysRequired: 3,
  },
  {
    id: 'nvidia-nim',
    name: 'NVIDIA NIM',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'deepseek-r1', owned_by: 'DeepSeek', type: 'text' },
      { id: 'nemotron-3-super', owned_by: 'NVIDIA', type: 'text' },
    ],
    description: '91 free endpoint models',
    freeLimit: 'Variable',
    keysRequired: 3,
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    models: [
      { id: 'qwen3-8b', owned_by: 'Alibaba', type: 'text' },
      { id: 'deepseek-r1-distill-qwen-7b', owned_by: 'DeepSeek', type: 'text' },
    ],
    description: 'Fast Chinese inference, generous free tier',
    freeLimit: 'Generous',
    keysRequired: 3,
  },
  {
    id: 'sambanova',
    name: 'Sambanova Cloud',
    models: [
      { id: 'llama-3.3-70b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'llama-4-scout', owned_by: 'Meta', type: 'text' },
      { id: 'deepseek-r1', owned_by: 'DeepSeek', type: 'text' },
    ],
    description: 'Fastest Llama inference',
    freeLimit: 'Free tier available',
    keysRequired: 3,
  },
  {
    id: 'cloudflare-workers-ai',
    name: 'Cloudflare Workers AI',
    models: [
      { id: 'llama-3.1-8b', owned_by: 'Meta', type: 'text' },
      { id: 'mistral-7b', owned_by: 'Mistral', type: 'text' },
    ],
    description: '10,000 neurons/day free',
    freeLimit: '10k neurons/day',
    keysRequired: 3,
  },
  {
    id: 'huggingface',
    name: 'Hugging Face Inference',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'mistral-7b', owned_by: 'Mistral', type: 'text' },
      { id: 'qwen3-8b', owned_by: 'Alibaba', type: 'text' },
    ],
    description: 'Thousands of open-source models',
    freeLimit: 'Hundreds of req/hour',
    keysRequired: 3,
  },
  {
    id: 'mistral-ai',
    name: 'Mistral AI',
    models: [
      { id: 'mistral-small', owned_by: 'Mistral', type: 'text' },
      { id: 'codestral', owned_by: 'Mistral', type: 'text' },
      { id: 'pixtral-12b', owned_by: 'Mistral', type: 'text' },
    ],
    description: '1B tokens/month free',
    freeLimit: '1B tokens/month',
    keysRequired: 3,
  },
  {
    id: 'github-models',
    name: 'GitHub Models',
    models: [
      { id: 'gpt-4o', owned_by: 'OpenAI', type: 'text' },
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'phi-4', owned_by: 'Microsoft', type: 'text' },
    ],
    description: 'Free via GitHub token',
    freeLimit: 'Rate limited',
    keysRequired: 3,
  },
  {
    id: 'cohere',
    name: 'Cohere',
    models: [
      { id: 'command-r-plus', owned_by: 'Cohere', type: 'text' },
      { id: 'command-r', owned_by: 'Cohere', type: 'text' },
    ],
    description: '1,000 calls/month free',
    freeLimit: '1000/month',
    keysRequired: 3,
  },

  // Tier 2: Major providers (20-40)
  {
    id: 'fireworks-ai',
    name: 'Fireworks AI',
    models: [
      { id: 'llama-v3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'deepseek-r1', owned_by: 'DeepSeek', type: 'text' },
    ],
    description: 'Fast serverless inference, free credits',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },
  {
    id: 'together-ai',
    name: 'Together AI',
    models: [
      { id: 'llama-3.3-70b-instruct-turbo', owned_by: 'Meta', type: 'text' },
      { id: 'deepseek-r1', owned_by: 'DeepSeek', type: 'text' },
    ],
    description: '$100 signup credits',
    freeLimit: '$100 credits',
    keysRequired: 3,
  },
  {
    id: 'featherless-ai',
    name: 'Featherless AI',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'qwen3-8b', owned_by: 'Alibaba', type: 'text' },
    ],
    description: '3,000+ open-source models',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'scaleway',
    name: 'Scaleway',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'mistral-nemo', owned_by: 'Mistral', type: 'text' },
    ],
    description: 'EU-based, privacy-friendly',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'hyperbolic',
    name: 'Hyperbolic',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'deepseek-r1', owned_by: 'DeepSeek', type: 'text' },
    ],
    description: 'Community GPU network',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },
  {
    id: 'novita-ai',
    name: 'Novita AI',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'deepseek-v3', owned_by: 'DeepSeek', type: 'text' },
    ],
    description: '100+ models, free credits',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },
  {
    id: 'modal',
    name: 'Modal',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Serverless compute for ML',
    freeLimit: '$30/month credit',
    keysRequired: 3,
  },
  {
    id: 'replicate',
    name: 'Replicate',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'flux-pro', owned_by: 'Black Forest Labs', type: 'image' },
    ],
    description: 'ML model hosting, free tier',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },
  {
    id: 'baseten',
    name: 'Baseten',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
    ],
    description: 'ML inference platform',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'banana',
    name: 'Banana',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Serverless GPU inference',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'runwayml',
    name: 'Runway ML',
    models: [
      { id: 'gen-3-alpha', owned_by: 'Runway', type: 'video' },
      { id: 'stable-diffusion-3', owned_by: 'Stability AI', type: 'image' },
    ],
    description: 'Creative AI tools, video/image gen',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },

  // Tier 3: Specialized providers (40-60)
  {
    id: 'perplexity',
    name: 'Perplexity AI',
    models: [
      { id: 'sonar', owned_by: 'Perplexity', type: 'text' },
      { id: 'sonar-pro', owned_by: 'Perplexity', type: 'text' },
    ],
    description: 'Search-enhanced LLM',
    freeLimit: 'Free tier available',
    keysRequired: 3,
  },
  {
    id: 'anthropic-claude',
    name: 'Anthropic Claude',
    models: [
      { id: 'claude-3.5-sonnet', owned_by: 'Anthropic', type: 'text' },
      { id: 'claude-3-opus', owned_by: 'Anthropic', type: 'text' },
    ],
    description: 'Advanced reasoning models',
    freeLimit: 'Trial credits',
    keysRequired: 3,
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    models: [
      { id: 'grok-3', owned_by: 'xAI', type: 'text' },
      { id: 'grok-vision', owned_by: 'xAI', type: 'text' },
    ],
    description: 'Real-time knowledge access',
    freeLimit: 'Limited free',
    keysRequired: 3,
  },
  {
    id: 'stability-ai',
    name: 'Stability AI',
    models: [
      { id: 'stable-diffusion-3', owned_by: 'Stability AI', type: 'image' },
      { id: 'stable-diffusion-3-turbo', owned_by: 'Stability AI', type: 'image' },
    ],
    description: 'Image generation, free tier',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },
  {
    id: 'eleven-labs',
    name: 'ElevenLabs',
    models: [
      { id: 'tts-1', owned_by: 'ElevenLabs', type: 'audio' },
      { id: 'voice-changer', owned_by: 'ElevenLabs', type: 'audio' },
    ],
    description: 'Text-to-speech, voice synthesis',
    freeLimit: '10k char/month',
    keysRequired: 3,
  },
  {
    id: 'jasper',
    name: 'Jasper AI',
    models: [
      { id: 'jasper-3', owned_by: 'Jasper', type: 'text' },
    ],
    description: 'Content AI platform',
    freeLimit: 'Trial available',
    keysRequired: 3,
  },
  {
    id: 'copy-ai',
    name: 'Copy.ai',
    models: [
      { id: 'copywriting-pro', owned_by: 'Copy.ai', type: 'text' },
    ],
    description: 'Marketing copy generation',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'writesonic',
    name: 'Writesonic',
    models: [
      { id: 'chatsonic', owned_by: 'Writesonic', type: 'text' },
    ],
    description: 'Content and copywriting',
    freeLimit: 'Free trial',
    keysRequired: 3,
  },
  {
    id: 'syntheticy',
    name: 'SynthEtic.AI',
    models: [
      { id: 'synthetic-chat', owned_by: 'SynthEtic.AI', type: 'text' },
    ],
    description: 'Synthetic data generation',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'databricks',
    name: 'Databricks DBRX',
    models: [
      { id: 'dbrx-instruct', owned_by: 'Databricks', type: 'text' },
    ],
    description: 'Open-source LLM',
    freeLimit: 'Available via other providers',
    keysRequired: 3,
  },

  // Tier 4: Niche & Emerging (60-80)
  {
    id: 'modal-ai',
    name: 'Modal Labs',
    models: [
      { id: 'llama-inference', owned_by: 'Modal', type: 'text' },
    ],
    description: 'Cloud functions for ML',
    freeLimit: '$30 monthly',
    keysRequired: 3,
  },
  {
    id: 'together-computer',
    name: 'Together Computer',
    models: [
      { id: 'open-llama', owned_by: 'Together', type: 'text' },
    ],
    description: 'Open LLM inference',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'aleph-alpha',
    name: 'Aleph Alpha',
    models: [
      { id: 'luminous-extended', owned_by: 'Aleph Alpha', type: 'text' },
    ],
    description: 'Explainable AI',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    models: [
      { id: 'gpt-4o', owned_by: 'OpenAI', type: 'text' },
      { id: 'gpt-4-turbo', owned_by: 'OpenAI', type: 'text' },
    ],
    description: 'Microsoft Azure hosting',
    freeLimit: 'Trial available',
    keysRequired: 3,
  },
  {
    id: 'aws-bedrock',
    name: 'AWS Bedrock',
    models: [
      { id: 'claude-3-sonnet', owned_by: 'Anthropic', type: 'text' },
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
    ],
    description: 'AWS managed models',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'gcp-vertex',
    name: 'Google Vertex AI',
    models: [
      { id: 'gemini-pro', owned_by: 'Google', type: 'text' },
    ],
    description: 'GCP ML platform',
    freeLimit: '$300 credits',
    keysRequired: 3,
  },
  {
    id: 'oracle-generative',
    name: 'Oracle Generative AI',
    models: [
      { id: 'oracle-cohere', owned_by: 'Cohere', type: 'text' },
    ],
    description: 'Oracle cloud integration',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'ibm-watsonx',
    name: 'IBM watsonx.ai',
    models: [
      { id: 'granite-13b', owned_by: 'IBM', type: 'text' },
    ],
    description: 'IBM enterprise AI',
    freeLimit: 'Trial',
    keysRequired: 3,
  },
  {
    id: 'intel-arc',
    name: 'Intel Arc AI',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Intel AI acceleration',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'qualcomm-snapdragon',
    name: 'Qualcomm Snapdragon',
    models: [
      { id: 'snapdragon-genai', owned_by: 'Qualcomm', type: 'text' },
    ],
    description: 'Mobile AI inference',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },

  // Tier 5: Emerging & Community (80-100+)
  {
    id: 'ollama',
    name: 'Ollama',
    models: [
      { id: 'llama-3.3', owned_by: 'Meta', type: 'text' },
      { id: 'mistral', owned_by: 'Mistral', type: 'text' },
    ],
    description: 'Local LLM runtime, open-source',
    freeLimit: '100% free',
    keysRequired: 3,
  },
  {
    id: 'vllm',
    name: 'vLLM',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Fast LLM serving',
    freeLimit: 'Open-source',
    keysRequired: 3,
  },
  {
    id: 'llamaindex',
    name: 'LlamaIndex',
    models: [
      { id: 'rag-pipeline', owned_by: 'LlamaIndex', type: 'text' },
    ],
    description: 'Data framework for LLMs',
    freeLimit: 'Open-source',
    keysRequired: 3,
  },
  {
    id: 'langchain',
    name: 'LangChain',
    models: [
      { id: 'chain-orchestration', owned_by: 'LangChain', type: 'text' },
    ],
    description: 'LLM app framework',
    freeLimit: 'Open-source',
    keysRequired: 3,
  },
  {
    id: 'flowise',
    name: 'Flowise AI',
    models: [
      { id: 'low-code-llm', owned_by: 'Flowise', type: 'text' },
    ],
    description: 'No-code LLM app builder',
    freeLimit: 'Open-source',
    keysRequired: 3,
  },
  {
    id: 'dust',
    name: 'Dust',
    models: [
      { id: 'dust-engine', owned_by: 'Dust', type: 'text' },
    ],
    description: 'Workflow automation',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'talktoai',
    name: 'TalkToAI',
    models: [
      { id: 'conversation-engine', owned_by: 'TalkToAI', type: 'text' },
    ],
    description: 'Conversational AI',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'chatbase',
    name: 'Chatbase',
    models: [
      { id: 'chatbot-builder', owned_by: 'Chatbase', type: 'text' },
    ],
    description: 'Custom chatbot platform',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'activeloop',
    name: 'Activeloop Hub',
    models: [
      { id: 'hub-datasets', owned_by: 'Activeloop', type: 'text' },
    ],
    description: 'ML dataset platform',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'huggingchat',
    name: 'HuggingChat',
    models: [
      { id: 'huggingface-llms', owned_by: 'HuggingFace', type: 'text' },
    ],
    description: 'Browser-based chat',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },

  // Final batch: More emerging providers
  {
    id: 'puter',
    name: 'Puter',
    models: [
      { id: 'puter-ai', owned_by: 'Puter', type: 'text' },
    ],
    description: 'Cloud OS with AI',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'vercel-ai',
    name: 'Vercel AI',
    models: [
      { id: 'vercel-models', owned_by: 'Vercel', type: 'text' },
    ],
    description: 'Serverless AI platform',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'supabase-ai',
    name: 'Supabase Vectors',
    models: [
      { id: 'pgvector-search', owned_by: 'Supabase', type: 'text' },
    ],
    description: 'Vector database + AI',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    models: [
      { id: 'vector-search', owned_by: 'Pinecone', type: 'text' },
    ],
    description: 'Vector database',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'weaviate',
    name: 'Weaviate',
    models: [
      { id: 'semantic-search', owned_by: 'Weaviate', type: 'text' },
    ],
    description: 'Vector search engine',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'milvus',
    name: 'Milvus',
    models: [
      { id: 'vector-database', owned_by: 'Milvus', type: 'text' },
    ],
    description: 'Open-source vector DB',
    freeLimit: 'Open-source',
    keysRequired: 3,
  },
  {
    id: 'qdrant',
    name: 'Qdrant',
    models: [
      { id: 'vector-engine', owned_by: 'Qdrant', type: 'text' },
    ],
    description: 'Fast vector search',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'chroma',
    name: 'Chroma',
    models: [
      { id: 'embedding-db', owned_by: 'Chroma', type: 'text' },
    ],
    description: 'AI-native embedding DB',
    freeLimit: 'Open-source',
    keysRequired: 3,
  },
  {
    id: 'neo4j-ai',
    name: 'Neo4j',
    models: [
      { id: 'graph-ai', owned_by: 'Neo4j', type: 'text' },
    ],
    description: 'Graph database + AI',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'elasticsearch-ai',
    name: 'Elasticsearch',
    models: [
      { id: 'semantic-search-es', owned_by: 'Elastic', type: 'text' },
    ],
    description: 'Search + AI',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },

  // Tier 6: Asian & International Providers (61-80)
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', owned_by: 'DeepSeek', type: 'text' },
      { id: 'deepseek-reasoner', owned_by: 'DeepSeek', type: 'text' },
      { id: 'deepseek-coder', owned_by: 'DeepSeek', type: 'text' },
    ],
    description: 'Powerful open-source frontier models',
    freeLimit: 'Free credits on signup',
    keysRequired: 3,
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI (Kimi)',
    models: [
      { id: 'moonshot-v1-8k', owned_by: 'Moonshot', type: 'text' },
      { id: 'moonshot-v1-32k', owned_by: 'Moonshot', type: 'text' },
      { id: 'moonshot-v1-128k', owned_by: 'Moonshot', type: 'text' },
    ],
    description: '128k context window, free tier',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },
  {
    id: 'zhipu',
    name: 'Zhipu AI (GLM)',
    models: [
      { id: 'glm-4', owned_by: 'Zhipu', type: 'text' },
      { id: 'glm-4-flash', owned_by: 'Zhipu', type: 'text' },
      { id: 'glm-4v', owned_by: 'Zhipu', type: 'text' },
    ],
    description: 'Advanced bilingual models, GLM-4 free tier',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },
  {
    id: 'qwen-api',
    name: 'Qwen (Alibaba DashScope)',
    models: [
      { id: 'qwen-turbo', owned_by: 'Alibaba', type: 'text' },
      { id: 'qwen-plus', owned_by: 'Alibaba', type: 'text' },
      { id: 'qwen-long', owned_by: 'Alibaba', type: 'text' },
      { id: 'qwen-vl-plus', owned_by: 'Alibaba', type: 'text' },
    ],
    description: 'Alibaba DashScope API, multilingual',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },
  {
    id: 'ai21',
    name: 'AI21 Labs',
    models: [
      { id: 'jamba-1.5-mini', owned_by: 'AI21', type: 'text' },
      { id: 'jamba-1.5-large', owned_by: 'AI21', type: 'text' },
      { id: 'j2-ultra', owned_by: 'AI21', type: 'text' },
    ],
    description: 'Jamba SSM models, 256k context',
    freeLimit: 'Free trial credits',
    keysRequired: 3,
  },
  {
    id: 'coze',
    name: 'Coze (ByteDance)',
    models: [
      { id: 'coze-chat', owned_by: 'ByteDance', type: 'text' },
    ],
    description: 'ByteDance AI bot platform with API',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'deepinfra',
    name: 'DeepInfra',
    models: [
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', owned_by: 'Meta', type: 'text' },
      { id: 'deepseek-ai/DeepSeek-R1', owned_by: 'DeepSeek', type: 'text' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', owned_by: 'Alibaba', type: 'text' },
    ],
    description: 'Serverless AI inference, 200+ open models',
    freeLimit: '$1.80 free credits',
    keysRequired: 3,
  },
  {
    id: 'lepton',
    name: 'Lepton AI',
    models: [
      { id: 'llama3-1-70b', owned_by: 'Meta', type: 'text' },
      { id: 'qwen2-72b', owned_by: 'Alibaba', type: 'text' },
    ],
    description: 'Easy serverless AI inference',
    freeLimit: '$10 free credits',
    keysRequired: 3,
  },
  {
    id: 'textsynth',
    name: 'TextSynth',
    models: [
      { id: 'mistral_7B_instruct', owned_by: 'Mistral', type: 'text' },
      { id: 'llama2_70b', owned_by: 'Meta', type: 'text' },
      { id: 'codellama_34b', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Simple text generation API',
    freeLimit: '100 req/day',
    keysRequired: 3,
  },
  {
    id: 'fal-ai',
    name: 'Fal.ai',
    models: [
      { id: 'stable-diffusion-v3-medium', owned_by: 'Stability AI', type: 'image' },
      { id: 'flux/dev', owned_by: 'Black Forest Labs', type: 'image' },
      { id: 'kling-video', owned_by: 'Kling', type: 'video' },
    ],
    description: 'Serverless AI for images, video, and audio',
    freeLimit: '$5 free credits',
    keysRequired: 3,
  },
  {
    id: 'maritaca',
    name: 'Maritaca AI',
    models: [
      { id: 'sabia-3', owned_by: 'Maritaca', type: 'text' },
    ],
    description: 'Brazilian Portuguese specialized LLM',
    freeLimit: 'Free tier available',
    keysRequired: 3,
  },
  {
    id: 'octoai',
    name: 'OctoAI',
    models: [
      { id: 'meta-llama-3.1-70b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'mistral-7b-instruct', owned_by: 'Mistral', type: 'text' },
    ],
    description: 'Fast model serving, optimized inference',
    freeLimit: 'Free trial',
    keysRequired: 3,
  },
  {
    id: 'krutrim',
    name: 'Krutrim AI',
    models: [
      { id: 'krutrim-1', owned_by: 'Ola', type: 'text' },
      { id: 'krutrim-2', owned_by: 'Ola', type: 'text' },
    ],
    description: 'Indian AI with multilingual support',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'phind',
    name: 'Phind',
    models: [
      { id: 'Phind-70B', owned_by: 'Phind', type: 'text' },
    ],
    description: 'AI for developers and coding',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'upstage',
    name: 'Upstage',
    models: [
      { id: 'solar-pro', owned_by: 'Upstage', type: 'text' },
      { id: 'solar-mini', owned_by: 'Upstage', type: 'text' },
    ],
    description: 'SOLAR model family, high-performance',
    freeLimit: 'Free trial',
    keysRequired: 3,
  },
  {
    id: 'anyscale',
    name: 'Anyscale (Endpoints)',
    models: [
      { id: 'meta-llama/Llama-3-70b-chat-hf', owned_by: 'Meta', type: 'text' },
      { id: 'codellama/CodeLlama-70b-Instruct-hf', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Ray-based scalable AI inference',
    freeLimit: '$10 free credits',
    keysRequired: 3,
  },
  {
    id: 'mistral-codestral',
    name: 'Mistral Codestral',
    models: [
      { id: 'codestral-latest', owned_by: 'Mistral', type: 'text' },
      { id: 'codestral-mamba', owned_by: 'Mistral', type: 'text' },
    ],
    description: 'Code-specialized Mistral models',
    freeLimit: '1B tokens/month',
    keysRequired: 3,
  },
  {
    id: 'writer',
    name: 'Writer AI',
    models: [
      { id: 'palmyra-x-004', owned_by: 'Writer', type: 'text' },
      { id: 'palmyra-vision', owned_by: 'Writer', type: 'text' },
    ],
    description: 'Enterprise AI writing platform',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'voyage-ai',
    name: 'Voyage AI',
    models: [
      { id: 'voyage-3', owned_by: 'Voyage', type: 'text' },
      { id: 'voyage-code-3', owned_by: 'Voyage', type: 'text' },
    ],
    description: 'State-of-the-art embedding models',
    freeLimit: '50M tokens/month free',
    keysRequired: 3,
  },
  {
    id: 'jina-ai',
    name: 'Jina AI',
    models: [
      { id: 'jina-embeddings-v3', owned_by: 'Jina', type: 'text' },
      { id: 'jina-reranker-v2', owned_by: 'Jina', type: 'text' },
    ],
    description: 'Multimodal embeddings and reranker',
    freeLimit: '1M tokens free',
    keysRequired: 3,
  },

  // Tier 7: More Specialized Providers (81-100+)
  {
    id: 'mistral-embed',
    name: 'Mistral Embeddings',
    models: [
      { id: 'mistral-embed', owned_by: 'Mistral', type: 'text' },
    ],
    description: 'Mistral-native embedding model',
    freeLimit: '1B tokens/month',
    keysRequired: 3,
  },
  {
    id: 'nvidia-embedding',
    name: 'NVIDIA Embeddings',
    models: [
      { id: 'nvidia/nv-embedqa-e5-v5', owned_by: 'NVIDIA', type: 'text' },
      { id: 'nvidia/nv-rerank-qa-mistral-4b', owned_by: 'NVIDIA', type: 'text' },
    ],
    description: 'NVIDIA embedding and reranking models',
    freeLimit: '1000 req/month free',
    keysRequired: 3,
  },
  {
    id: 'cohere-embed',
    name: 'Cohere Embeddings',
    models: [
      { id: 'embed-english-v3.0', owned_by: 'Cohere', type: 'text' },
      { id: 'embed-multilingual-v3.0', owned_by: 'Cohere', type: 'text' },
      { id: 'rerank-english-v3.0', owned_by: 'Cohere', type: 'text' },
    ],
    description: 'Best-in-class multilingual embeddings',
    freeLimit: '1000 calls/month free',
    keysRequired: 3,
  },
  {
    id: 'google-vertex-embed',
    name: 'Google Vertex Embeddings',
    models: [
      { id: 'text-embedding-005', owned_by: 'Google', type: 'text' },
      { id: 'multimodalembedding@001', owned_by: 'Google', type: 'text' },
    ],
    description: 'Google Cloud embedding models',
    freeLimit: '$300 free credits',
    keysRequired: 3,
  },
  {
    id: 'openai-compatible',
    name: 'Custom OpenAI-Compatible',
    models: [
      { id: 'custom-model', owned_by: 'Custom', type: 'text' },
    ],
    description: 'Connect any OpenAI-compatible endpoint',
    freeLimit: 'Depends on provider',
    keysRequired: 3,
  },
  {
    id: 'nousresearch',
    name: 'Nous Research',
    models: [
      { id: 'Hermes-3-Llama-3.1-405B', owned_by: 'Nous Research', type: 'text' },
      { id: 'Nous-Hermes-2-Mixtral-8x7B-DPO', owned_by: 'Nous Research', type: 'text' },
    ],
    description: 'Hermes model family, open-source',
    freeLimit: 'Via community providers',
    keysRequired: 3,
  },
  {
    id: 'mixtral',
    name: 'Mixtral API (Mistral)',
    models: [
      { id: 'open-mixtral-8x7b', owned_by: 'Mistral', type: 'text' },
      { id: 'open-mixtral-8x22b', owned_by: 'Mistral', type: 'text' },
    ],
    description: 'Mistral MoE models via Mistral API',
    freeLimit: '1B tokens/month',
    keysRequired: 3,
  },
  {
    id: 'llm-nexus',
    name: 'LLM Nexus',
    models: [
      { id: 'llama-3.1-70b', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Open-source model API gateway',
    freeLimit: 'Free tier',
    keysRequired: 3,
  },
  {
    id: 'chat-01ai',
    name: '01.AI (Yi)',
    models: [
      { id: 'yi-large', owned_by: '01.AI', type: 'text' },
      { id: 'yi-medium', owned_by: '01.AI', type: 'text' },
      { id: 'yi-vision', owned_by: '01.AI', type: 'text' },
    ],
    description: 'Yi model family with bilingual support',
    freeLimit: 'Free trial credits',
    keysRequired: 3,
  },
  {
    id: 'stepfun',
    name: 'StepFun',
    models: [
      { id: 'step-2-16k', owned_by: 'StepFun', type: 'text' },
      { id: 'step-1v-32k', owned_by: 'StepFun', type: 'text' },
    ],
    description: 'Chinese frontier models by StepFun',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },
  {
    id: 'baichuan',
    name: 'Baichuan AI',
    models: [
      { id: 'Baichuan4', owned_by: 'Baichuan', type: 'text' },
      { id: 'Baichuan3-Turbo', owned_by: 'Baichuan', type: 'text' },
    ],
    description: 'Chinese LLM provider',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    models: [
      { id: 'abab6.5s-chat', owned_by: 'MiniMax', type: 'text' },
      { id: 'abab6.5g-chat', owned_by: 'MiniMax', type: 'text' },
    ],
    description: 'MiniMax Chinese AI platform',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },
  {
    id: 'rwkv',
    name: 'RWKV',
    models: [
      { id: 'rwkv-5-world-7b', owned_by: 'RWKV', type: 'text' },
    ],
    description: 'Linear attention RNN language model',
    freeLimit: 'Open-source',
    keysRequired: 3,
  },
  {
    id: 'fishaudio',
    name: 'Fish Audio',
    models: [
      { id: 'fish-speech-1.5', owned_by: 'Fish Audio', type: 'audio' },
    ],
    description: 'High-quality TTS and voice cloning',
    freeLimit: '5000 char/day free',
    keysRequired: 3,
  },
  {
    id: 'suno',
    name: 'Suno AI',
    models: [
      { id: 'chirp-v3', owned_by: 'Suno', type: 'audio' },
    ],
    description: 'AI music generation',
    freeLimit: '50 songs/day free',
    keysRequired: 3,
  },
  {
    id: 'udio',
    name: 'Udio',
    models: [
      { id: 'udio-v1', owned_by: 'Udio', type: 'audio' },
    ],
    description: 'AI music generation platform',
    freeLimit: '100 tracks/month free',
    keysRequired: 3,
  },
  {
    id: 'luma-ai',
    name: 'Luma AI',
    models: [
      { id: 'dream-machine', owned_by: 'Luma', type: 'video' },
    ],
    description: 'Photorealistic video generation',
    freeLimit: 'Free credits on signup',
    keysRequired: 3,
  },
  {
    id: 'kling-ai',
    name: 'Kling AI',
    models: [
      { id: 'kling-v1', owned_by: 'Kuaishou', type: 'video' },
      { id: 'kling-v1-5', owned_by: 'Kuaishou', type: 'video' },
    ],
    description: 'Advanced video generation by Kuaishou',
    freeLimit: '66 free credits/day',
    keysRequired: 3,
  },
  {
    id: 'haiper',
    name: 'Haiper AI',
    models: [
      { id: 'haiper-video-v2', owned_by: 'Haiper', type: 'video' },
    ],
    description: 'Fast AI video generation',
    freeLimit: 'Free credits',
    keysRequired: 3,
  },
  {
    id: 'ideogram',
    name: 'Ideogram',
    models: [
      { id: 'ideogram-v3', owned_by: 'Ideogram', type: 'image' },
      { id: 'ideogram-v2-turbo', owned_by: 'Ideogram', type: 'image' },
    ],
    description: 'AI image generation with excellent text rendering',
    freeLimit: '10 images/day free',
    keysRequired: 3,
  },
  {
    id: 'leonardo-ai',
    name: 'Leonardo AI',
    models: [
      { id: 'phoenix', owned_by: 'Leonardo', type: 'image' },
      { id: 'flux-dev', owned_by: 'Black Forest Labs', type: 'image' },
    ],
    description: 'Creative AI image generation platform',
    freeLimit: '150 tokens/day free',
    keysRequired: 3,
  },
  {
    id: 'bfl',
    name: 'Black Forest Labs (FLUX API)',
    models: [
      { id: 'flux-pro-1.1', owned_by: 'Black Forest Labs', type: 'image' },
      { id: 'flux-dev', owned_by: 'Black Forest Labs', type: 'image' },
      { id: 'flux-schnell', owned_by: 'Black Forest Labs', type: 'image' },
    ],
    description: 'Official FLUX model API',
    freeLimit: 'Credits per image',
    keysRequired: 3,
    signupUrl: 'https://api.bfl.ml',
  },

  // ── Batch 2: 50 additional free-tier providers ────────────────────────────

  // Inference APIs
  {
    id: 'lambda-labs',
    name: 'Lambda Labs',
    models: [
      { id: 'llama-3.3-70b-instruct-fp8', owned_by: 'Meta', type: 'text' },
      { id: 'llama-3.1-405b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'qwen2.5-72b-instruct', owned_by: 'Alibaba', type: 'text' },
      { id: 'hermes-3-llama-3.1-405b', owned_by: 'Nous Research', type: 'text' },
    ],
    description: 'GPU cloud with free inference credits — Llama, Qwen, Hermes',
    freeLimit: 'Free inference credits',
    keysRequired: 3,
    signupUrl: 'https://cloud.lambdalabs.com',
  },
  {
    id: 'chutes',
    name: 'Chutes AI',
    models: [
      { id: 'deepseek-r1', owned_by: 'DeepSeek', type: 'text' },
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'qwen2.5-72b', owned_by: 'Alibaba', type: 'text' },
    ],
    description: 'Decentralized GPU inference marketplace with free tier',
    freeLimit: 'Free tier available',
    keysRequired: 3,
    signupUrl: 'https://chutes.ai',
  },
  {
    id: 'kluster',
    name: 'Kluster AI',
    models: [
      { id: 'llama-3.3-70b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'deepseek-r1', owned_by: 'DeepSeek', type: 'text' },
      { id: 'qwen-2.5-72b', owned_by: 'Alibaba', type: 'text' },
    ],
    description: 'OpenAI-compatible inference API with free tier',
    freeLimit: 'Free tier',
    keysRequired: 3,
    signupUrl: 'https://kluster.ai',
  },
  {
    id: 'targon',
    name: 'Targon (Manifold)',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'mistral-7b', owned_by: 'Mistral', type: 'text' },
      { id: 'deepseek-r1', owned_by: 'DeepSeek', type: 'text' },
    ],
    description: 'OpenAI-compatible free inference API by Manifold',
    freeLimit: 'Free',
    keysRequired: 3,
    signupUrl: 'https://targon.com',
  },
  {
    id: 'glhf',
    name: 'GLHF Chat',
    models: [
      { id: 'hf:meta-llama/Llama-3.3-70B-Instruct', owned_by: 'Meta', type: 'text' },
      { id: 'hf:Qwen/Qwen2.5-72B-Instruct', owned_by: 'Alibaba', type: 'text' },
      { id: 'hf:deepseek-ai/DeepSeek-R1', owned_by: 'DeepSeek', type: 'text' },
      { id: 'hf:mistralai/Mistral-7B-Instruct-v0.3', owned_by: 'Mistral', type: 'text' },
    ],
    description: 'Free OpenAI-compatible API for 30+ Hugging Face models',
    freeLimit: 'Free (HF models)',
    keysRequired: 3,
    signupUrl: 'https://glhf.chat',
  },
  {
    id: 'nebius',
    name: 'Nebius AI',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct', owned_by: 'Meta', type: 'text' },
      { id: 'deepseek-ai/DeepSeek-R1', owned_by: 'DeepSeek', type: 'text' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', owned_by: 'Alibaba', type: 'text' },
      { id: 'black-forest-labs/FLUX.1-schnell', owned_by: 'Black Forest Labs', type: 'image' },
    ],
    description: 'European AI cloud — LLMs, image gen, embeddings with free credits',
    freeLimit: 'Free credits on signup',
    keysRequired: 3,
    signupUrl: 'https://studio.nebius.ai',
  },
  {
    id: 'cerebrium',
    name: 'Cerebrium',
    models: [
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'whisper-large-v3', owned_by: 'OpenAI', type: 'transcription' },
    ],
    description: 'Serverless GPU inference platform with free trial',
    freeLimit: 'Free trial credits',
    keysRequired: 3,
    signupUrl: 'https://www.cerebrium.ai',
  },
  {
    id: 'friendli',
    name: 'Friendli AI',
    models: [
      { id: 'meta-llama-3.3-70b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'mixtral-8x7b-instruct-v0-1', owned_by: 'Mistral', type: 'text' },
      { id: 'codestral-22b', owned_by: 'Mistral', type: 'text' },
    ],
    description: 'Generative AI inference with OpenAI-compatible API, free tier',
    freeLimit: 'Free tier',
    keysRequired: 3,
    signupUrl: 'https://suite.friendli.ai',
  },
  {
    id: 'aimlapi',
    name: 'AIML API',
    models: [
      { id: 'gpt-4o-mini', owned_by: 'OpenAI', type: 'text' },
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'flux-schnell', owned_by: 'Black Forest Labs', type: 'image' },
      { id: 'whisper-large', owned_by: 'OpenAI', type: 'transcription' },
    ],
    description: '200+ models via one API — text, image, audio, video with free tier',
    freeLimit: '100 requests/day free',
    keysRequired: 3,
    signupUrl: 'https://aimlapi.com',
  },
  {
    id: 'llama-api',
    name: 'Llama API',
    models: [
      { id: 'llama4-scout-17b-16e-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'llama4-maverick-17b-128e-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'llama-3.3-70b-instruct', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Official Meta Llama API with free tier',
    freeLimit: 'Free tier',
    keysRequired: 3,
    signupUrl: 'https://www.llama-api.com',
  },
  {
    id: 'predibase',
    name: 'Predibase',
    models: [
      { id: 'llama-3.1-8b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'mistral-7b-instruct', owned_by: 'Mistral', type: 'text' },
      { id: 'qwen2.5-7b-instruct', owned_by: 'Alibaba', type: 'text' },
    ],
    description: 'Fine-tuned model inference with free plan',
    freeLimit: 'Free plan available',
    keysRequired: 3,
    signupUrl: 'https://app.predibase.com',
  },
  {
    id: 'neets',
    name: 'Neets AI',
    models: [
      { id: 'ara-1', owned_by: 'Neets', type: 'audio' },
      { id: 'vits', owned_by: 'Neets', type: 'audio' },
      { id: 'style-diff-500', owned_by: 'Neets', type: 'audio' },
      { id: 'llama-3-8b-instruct', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Free TTS API with 900+ voices and LLM inference',
    freeLimit: '100K chars/month free (TTS)',
    keysRequired: 3,
    signupUrl: 'https://neets.ai',
  },
  {
    id: 'clarifai',
    name: 'Clarifai',
    models: [
      { id: 'llama-3-70b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'gpt-4-turbo', owned_by: 'OpenAI', type: 'text' },
      { id: 'stable-diffusion-xl', owned_by: 'Stability AI', type: 'image' },
      { id: 'whisper-large-v2', owned_by: 'OpenAI', type: 'transcription' },
    ],
    description: 'Full-stack AI platform with 1000+ models and free tier',
    freeLimit: '1000 ops/month free',
    keysRequired: 3,
    signupUrl: 'https://clarifai.com',
  },
  {
    id: 'edenai',
    name: 'Eden AI',
    models: [
      { id: 'gpt-4o-mini', owned_by: 'OpenAI', type: 'text' },
      { id: 'gemini-1.5-flash', owned_by: 'Google', type: 'text' },
      { id: 'claude-3-haiku', owned_by: 'Anthropic', type: 'text' },
      { id: 'dall-e-3', owned_by: 'OpenAI', type: 'image' },
    ],
    description: 'Multi-provider AI API aggregator with free tier',
    freeLimit: 'Free trial credits',
    keysRequired: 3,
    signupUrl: 'https://app.edenai.run',
  },
  {
    id: 'reka',
    name: 'Reka AI',
    models: [
      { id: 'reka-flash-3', owned_by: 'Reka', type: 'text' },
      { id: 'reka-core', owned_by: 'Reka', type: 'text' },
    ],
    description: 'Multimodal AI models with free API credits',
    freeLimit: 'Free trial credits',
    keysRequired: 3,
    signupUrl: 'https://platform.reka.ai',
  },
  {
    id: '302ai',
    name: '302.AI',
    models: [
      { id: 'gpt-4o', owned_by: 'OpenAI', type: 'text' },
      { id: 'claude-3.5-sonnet', owned_by: 'Anthropic', type: 'text' },
      { id: 'gemini-2.0-flash', owned_by: 'Google', type: 'text' },
      { id: 'flux-1.1-pro', owned_by: 'Black Forest Labs', type: 'image' },
    ],
    description: 'AI API aggregator with free daily credits — 300+ models',
    freeLimit: 'Free daily credits',
    keysRequired: 3,
    signupUrl: 'https://302.ai',
  },
  {
    id: 'straico',
    name: 'Straico',
    models: [
      { id: 'gpt-4o', owned_by: 'OpenAI', type: 'text' },
      { id: 'claude-3.5-sonnet', owned_by: 'Anthropic', type: 'text' },
      { id: 'llama-3.1-70b', owned_by: 'Meta', type: 'text' },
      { id: 'dall-e-3', owned_by: 'OpenAI', type: 'image' },
    ],
    description: 'Unified AI API with free plan — 50+ models',
    freeLimit: 'Free plan with credits',
    keysRequired: 3,
    signupUrl: 'https://straico.com',
  },
  {
    id: 'mancer',
    name: 'Mancer AI',
    models: [
      { id: 'nethermind-gemma-3-27b', owned_by: 'Nethermind', type: 'text' },
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
      { id: 'qwen2.5-72b', owned_by: 'Alibaba', type: 'text' },
    ],
    description: 'Privacy-focused inference API with free tier, no filtering',
    freeLimit: 'Free tier',
    keysRequired: 3,
    signupUrl: 'https://mancer.tech',
  },
  {
    id: 'helix',
    name: 'HelixML',
    models: [
      { id: 'helix-3.5', owned_by: 'HelixML', type: 'text' },
      { id: 'helix-4', owned_by: 'HelixML', type: 'text' },
    ],
    description: 'Open-source AI deployment platform with free tier',
    freeLimit: 'Free tier',
    keysRequired: 3,
    signupUrl: 'https://helix.ml',
  },

  // Asian / Regional Providers
  {
    id: 'ernie',
    name: 'Baidu ERNIE',
    models: [
      { id: 'ernie-4.0-8k', owned_by: 'Baidu', type: 'text' },
      { id: 'ernie-speed-128k', owned_by: 'Baidu', type: 'text' },
      { id: 'ernie-lite-8k', owned_by: 'Baidu', type: 'text' },
    ],
    description: 'Baidu\'s ERNIE LLM API — free tier via Qianfan platform',
    freeLimit: 'Free tier (ERNIE Speed/Lite)',
    keysRequired: 3,
    signupUrl: 'https://qianfan.cloud.baidu.com',
  },
  {
    id: 'hunyuan',
    name: 'Tencent Hunyuan',
    models: [
      { id: 'hunyuan-lite', owned_by: 'Tencent', type: 'text' },
      { id: 'hunyuan-standard', owned_by: 'Tencent', type: 'text' },
      { id: 'hunyuan-video', owned_by: 'Tencent', type: 'video' },
    ],
    description: 'Tencent\'s Hunyuan LLM and video generation API, free tier',
    freeLimit: 'Free tier (Hunyuan-Lite)',
    keysRequired: 3,
    signupUrl: 'https://hunyuan.tencent.com',
  },
  {
    id: 'doubao',
    name: 'ByteDance Doubao (Ark)',
    models: [
      { id: 'doubao-pro-32k', owned_by: 'ByteDance', type: 'text' },
      { id: 'doubao-lite-4k', owned_by: 'ByteDance', type: 'text' },
      { id: 'moonshot-v1-8k', owned_by: 'Moonshot', type: 'text' },
    ],
    description: 'ByteDance Ark platform — Doubao and partner models, free credits',
    freeLimit: 'Free credits on signup',
    keysRequired: 3,
    signupUrl: 'https://console.volcengine.com/ark',
  },
  {
    id: 'internlm',
    name: 'InternLM',
    models: [
      { id: 'internlm2.5-20b-chat', owned_by: 'Shanghai AI Lab', type: 'text' },
      { id: 'internlm2.5-7b-chat', owned_by: 'Shanghai AI Lab', type: 'text' },
    ],
    description: 'Shanghai AI Lab open-source models via free API',
    freeLimit: 'Free',
    keysRequired: 3,
    signupUrl: 'https://internlm.intern-ai.org.cn',
  },
  {
    id: 'spark',
    name: 'iFlytek Spark',
    models: [
      { id: 'spark-lite', owned_by: 'iFlytek', type: 'text' },
      { id: 'spark-pro', owned_by: 'iFlytek', type: 'text' },
      { id: 'spark-max', owned_by: 'iFlytek', type: 'text' },
    ],
    description: 'iFlytek Spark cognitive LLM API — free Lite tier',
    freeLimit: 'Free (Spark Lite)',
    keysRequired: 3,
    signupUrl: 'https://www.xfyun.cn/spark',
  },
  {
    id: 'infini',
    name: 'Infini-AI',
    models: [
      { id: 'deepseek-r1', owned_by: 'DeepSeek', type: 'text' },
      { id: 'qwen2.5-72b', owned_by: 'Alibaba', type: 'text' },
      { id: 'llama-3.3-70b', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Chinese GPU cloud inference API with free tier',
    freeLimit: 'Free tier',
    keysRequired: 3,
    signupUrl: 'https://infini-ai.com',
  },
  {
    id: 'sensetime',
    name: 'SenseTime Nova',
    models: [
      { id: 'sensechat-5', owned_by: 'SenseTime', type: 'text' },
      { id: 'sensechat-5-turbo', owned_by: 'SenseTime', type: 'text' },
    ],
    description: 'SenseTime\'s SenseChat LLM API with free credits',
    freeLimit: 'Free credits',
    keysRequired: 3,
    signupUrl: 'https://platform.sensetime.com',
  },
  {
    id: 'skywork',
    name: 'Skywork AI',
    models: [
      { id: 'skywork-o3-mini', owned_by: 'Skywork', type: 'text' },
      { id: 'sky-t1', owned_by: 'Skywork', type: 'text' },
    ],
    description: 'Skywork reasoning models API with free tier',
    freeLimit: 'Free tier',
    keysRequired: 3,
    signupUrl: 'https://www.skywork.ai',
  },

  // Proxy / Aggregator Services with Free Tiers
  {
    id: 'zukijourney',
    name: 'Zukijourney',
    models: [
      { id: 'gpt-4o', owned_by: 'OpenAI', type: 'text' },
      { id: 'claude-3.5-sonnet', owned_by: 'Anthropic', type: 'text' },
      { id: 'gemini-2.0-flash', owned_by: 'Google', type: 'text' },
      { id: 'dall-e-3', owned_by: 'OpenAI', type: 'image' },
    ],
    description: 'Community-run free AI API proxy — GPT-4, Claude, Gemini and more',
    freeLimit: 'Free (community-run)',
    keysRequired: 3,
    signupUrl: 'https://zukijourney.com',
  },
  {
    id: 'pawan',
    name: 'PawanOsman AI',
    models: [
      { id: 'gpt-4', owned_by: 'OpenAI', type: 'text' },
      { id: 'claude-3-sonnet', owned_by: 'Anthropic', type: 'text' },
      { id: 'llama-2-70b', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Free reverse-proxy API for GPT-4, Claude, and open-source models',
    freeLimit: 'Free (reverse proxy)',
    keysRequired: 3,
    signupUrl: 'https://pawan.krd',
  },
  {
    id: 'crusoe',
    name: 'Crusoe AI',
    models: [
      { id: 'llama-3.1-405b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'llama-3.1-70b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'mistral-7b-instruct', owned_by: 'Mistral', type: 'text' },
    ],
    description: 'Sustainable GPU cloud with OpenAI-compatible inference, free credits',
    freeLimit: 'Free credits on signup',
    keysRequired: 3,
    signupUrl: 'https://inference.crusoe.ai',
  },

  // Specialized / Niche Providers
  {
    id: 'youcom',
    name: 'You.com AI',
    models: [
      { id: 'you-ai', owned_by: 'You.com', type: 'text' },
      { id: 'research', owned_by: 'You.com', type: 'text' },
    ],
    description: 'AI search and chat API with web access, free research tier',
    freeLimit: '60 queries/day free',
    keysRequired: 3,
    signupUrl: 'https://api.you.com',
  },
  {
    id: 'lamini',
    name: 'Lamini AI',
    models: [
      { id: 'meta-llama-3.1-8b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'mistral-7b-instruct-v0.3', owned_by: 'Mistral', type: 'text' },
    ],
    description: 'LLM fine-tuning and inference platform with free API tier',
    freeLimit: 'Free inference tier',
    keysRequired: 3,
    signupUrl: 'https://app.lamini.ai',
  },
  {
    id: 'koboldai',
    name: 'KoboldAI Horde',
    models: [
      { id: 'koboldcpp', owned_by: 'KoboldAI', type: 'text' },
      { id: 'aphrodite', owned_by: 'KoboldAI', type: 'text' },
    ],
    description: 'Volunteer-powered distributed AI inference, always free',
    freeLimit: 'Free (volunteer network)',
    keysRequired: 3,
    signupUrl: 'https://koboldai.net',
  },
  {
    id: 'deepl',
    name: 'DeepL AI',
    models: [
      { id: 'deepl-translate', owned_by: 'DeepL', type: 'text' },
      { id: 'deepl-write', owned_by: 'DeepL', type: 'text' },
    ],
    description: 'Best-in-class AI translation and writing API — 500K chars/month free',
    freeLimit: '500K chars/month free',
    keysRequired: 3,
    signupUrl: 'https://www.deepl.com/pro-api',
  },
  {
    id: 'langflow',
    name: 'Langflow',
    models: [
      { id: 'langflow-pipeline', owned_by: 'Langflow', type: 'text' },
    ],
    description: 'Open-source LLM orchestration with free cloud tier',
    freeLimit: 'Free cloud tier',
    keysRequired: 3,
    signupUrl: 'https://astra.datastax.com',
  },
  {
    id: 'dify',
    name: 'Dify.ai',
    models: [
      { id: 'dify-agent', owned_by: 'Dify', type: 'text' },
    ],
    description: 'Open-source LLM app platform with hosted free tier',
    freeLimit: '200 messages/day free',
    keysRequired: 3,
    signupUrl: 'https://cloud.dify.ai',
  },
  {
    id: 'openhermes',
    name: 'OpenHermes',
    models: [
      { id: 'openhermes-2.5-mistral-7b', owned_by: 'Nous Research', type: 'text' },
      { id: 'openhermes-2-mistral-7b', owned_by: 'Nous Research', type: 'text' },
    ],
    description: 'Free inference for Nous Research Hermes fine-tuned models',
    freeLimit: 'Free',
    keysRequired: 3,
    signupUrl: 'https://nousresearch.com',
  },
  {
    id: 'together-free',
    name: 'Together Free Models',
    models: [
      { id: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo', owned_by: 'Meta', type: 'text' },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', owned_by: 'Alibaba', type: 'text' },
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Together AI permanently free model endpoints (no credits required)',
    freeLimit: 'Permanently free models',
    keysRequired: 3,
    signupUrl: 'https://api.together.ai',
  },
  {
    id: 'openrouter-free',
    name: 'OpenRouter Free Models',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', owned_by: 'Meta', type: 'text' },
      { id: 'deepseek/deepseek-r1:free', owned_by: 'DeepSeek', type: 'text' },
      { id: 'qwen/qwen3-8b:free', owned_by: 'Alibaba', type: 'text' },
      { id: 'google/gemma-3-27b-it:free', owned_by: 'Google', type: 'text' },
    ],
    description: 'OpenRouter permanently free model tier — no credits required',
    freeLimit: 'Free models (rate limited)',
    keysRequired: 3,
    signupUrl: 'https://openrouter.ai/keys',
  },
  {
    id: 'huggingchat-api',
    name: 'HuggingChat API',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct', owned_by: 'Meta', type: 'text' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', owned_by: 'Alibaba', type: 'text' },
      { id: 'mistralai/Mistral-7B-Instruct-v0.3', owned_by: 'Mistral', type: 'text' },
    ],
    description: 'Hugging Face\'s free chat API — open-source models only',
    freeLimit: 'Free (HF models)',
    keysRequired: 3,
    signupUrl: 'https://huggingface.co/settings/tokens',
  },
  {
    id: 'mistral-free',
    name: 'Mistral Free Tier',
    models: [
      { id: 'mistral-small-latest', owned_by: 'Mistral', type: 'text' },
      { id: 'open-mistral-nemo', owned_by: 'Mistral', type: 'text' },
      { id: 'codestral-mamba-latest', owned_by: 'Mistral', type: 'text' },
    ],
    description: 'Mistral AI free-tier endpoints for smaller models',
    freeLimit: 'Free tier (rate limited)',
    keysRequired: 3,
    signupUrl: 'https://console.mistral.ai',
  },
  {
    id: 'runpod',
    name: 'RunPod Serverless',
    models: [
      { id: 'llama-3.1-70b', owned_by: 'Meta', type: 'text' },
      { id: 'stable-diffusion-xl', owned_by: 'Stability AI', type: 'image' },
      { id: 'whisper-large-v3', owned_by: 'OpenAI', type: 'transcription' },
    ],
    description: 'GPU cloud serverless inference — cheap on-demand with free credits',
    freeLimit: 'Free credits on signup',
    keysRequired: 3,
    signupUrl: 'https://runpod.io',
  },
  {
    id: 'deepinfra-free',
    name: 'DeepInfra Free Models',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', owned_by: 'Meta', type: 'text' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', owned_by: 'Alibaba', type: 'text' },
      { id: 'deepseek-ai/DeepSeek-R1-Turbo', owned_by: 'DeepSeek', type: 'text' },
    ],
    description: 'DeepInfra free model tier — fast OpenAI-compatible inference',
    freeLimit: 'Free $0.10 credit/signup',
    keysRequired: 3,
    signupUrl: 'https://deepinfra.com',
  },
  {
    id: 'novita-free',
    name: 'Novita AI Free Models',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'deepseek/deepseek-r1', owned_by: 'DeepSeek', type: 'text' },
      { id: 'black-forest-labs/FLUX.1-schnell', owned_by: 'Black Forest Labs', type: 'image' },
    ],
    description: 'Novita AI free model endpoints — text and image generation',
    freeLimit: 'Free credits + free models',
    keysRequired: 3,
    signupUrl: 'https://novita.ai',
  },
  {
    id: 'perplexity-free',
    name: 'Perplexity Free Models',
    models: [
      { id: 'llama-3.1-sonar-small-128k-online', owned_by: 'Perplexity', type: 'text' },
      { id: 'llama-3.1-8b-instruct', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Perplexity API free-tier endpoints with web search capability',
    freeLimit: 'Free tier (rate limited)',
    keysRequired: 3,
    signupUrl: 'https://www.perplexity.ai/settings/api',
  },
  {
    id: 'sambanova-free',
    name: 'SambaNova Cloud Free',
    models: [
      { id: 'Meta-Llama-3.3-70B-Instruct', owned_by: 'Meta', type: 'text' },
      { id: 'DeepSeek-R1', owned_by: 'DeepSeek', type: 'text' },
      { id: 'Qwen2.5-72B-Instruct', owned_by: 'Alibaba', type: 'text' },
    ],
    description: 'SambaNova RDU-accelerated inference — fast free tier',
    freeLimit: 'Free tier (fast)',
    keysRequired: 3,
    signupUrl: 'https://cloud.sambanova.ai',
  },
  {
    id: 'scaleway-free',
    name: 'Scaleway Generative APIs',
    models: [
      { id: 'llama-3.3-70b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'mistral-nemo-instruct-2407', owned_by: 'Mistral', type: 'text' },
      { id: 'qwen2.5-72b-instruct', owned_by: 'Alibaba', type: 'text' },
    ],
    description: 'Scaleway European AI cloud — free tier for open-source models',
    freeLimit: 'Free tier',
    keysRequired: 3,
    signupUrl: 'https://console.scaleway.com',
  },
  {
    id: 'poe',
    name: 'Poe API',
    models: [
      { id: 'claude-3-5-sonnet', owned_by: 'Anthropic', type: 'text' },
      { id: 'gpt-4o', owned_by: 'OpenAI', type: 'text' },
      { id: 'gemini-2.0-flash', owned_by: 'Google', type: 'text' },
      { id: 'llama-3.1-405b', owned_by: 'Meta', type: 'text' },
    ],
    description: 'Poe creator API — access GPT-4, Claude, Gemini with free credits',
    freeLimit: 'Free credits for creators',
    keysRequired: 3,
    signupUrl: 'https://poe.com/api_key',
  },
  {
    id: 'github-models-free',
    name: 'GitHub Models (Free)',
    models: [
      { id: 'meta-llama-3.3-70b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'gpt-4o-mini', owned_by: 'OpenAI', type: 'text' },
      { id: 'mistral-nemo', owned_by: 'Mistral', type: 'text' },
      { id: 'phi-3.5-mini-instruct', owned_by: 'Microsoft', type: 'text' },
    ],
    description: 'GitHub Models marketplace — free tier with GitHub personal access token',
    freeLimit: 'Free with GitHub account',
    keysRequired: 3,
    signupUrl: 'https://github.com/marketplace/models',
  },
  {
    id: 'cloudflare-ai-free',
    name: 'Cloudflare Workers AI (Free)',
    models: [
      { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', owned_by: 'Meta', type: 'text' },
      { id: '@cf/black-forest-labs/flux-1-schnell', owned_by: 'Black Forest Labs', type: 'image' },
      { id: '@cf/openai/whisper-large-v3-turbo', owned_by: 'OpenAI', type: 'transcription' },
      { id: '@cf/baai/bge-large-en-v1.5', owned_by: 'BAAI', type: 'text' },
    ],
    description: 'Cloudflare edge AI inference — 10K neurons/day free forever',
    freeLimit: '10K neurons/day free',
    keysRequired: 3,
    signupUrl: 'https://dash.cloudflare.com',
  },
  {
    id: 'bentocloud',
    name: 'BentoCloud',
    models: [
      { id: 'llama-3.1-70b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'stable-diffusion-xl', owned_by: 'Stability AI', type: 'image' },
      { id: 'whisper-large', owned_by: 'OpenAI', type: 'transcription' },
    ],
    description: 'BentoML cloud deployment for AI models with free credits',
    freeLimit: 'Free credits on signup',
    keysRequired: 3,
    signupUrl: 'https://cloud.bentoml.com',
  },
  {
    id: 'lightning',
    name: 'Lightning AI',
    models: [
      { id: 'llama-3.2-3b-instruct', owned_by: 'Meta', type: 'text' },
      { id: 'phi-4', owned_by: 'Microsoft', type: 'text' },
    ],
    description: 'Lightning AI Studios — free GPU compute and LLM inference',
    freeLimit: 'Free tier compute',
    keysRequired: 3,
    signupUrl: 'https://lightning.ai',
  },
];

export function getComingSoonModels() {
  const models: any[] = [];
  for (const provider of COMING_SOON_PROVIDERS) {
    for (const model of provider.models) {
      models.push({
        id: `${provider.id}/${model.id}`,
        object: 'model',
        owned_by: model.owned_by,
        provider: provider.name,
        type: model.type,
        status: 'coming_soon',
        keysRequired: provider.keysRequired,
        freeLimit: provider.freeLimit,
      });
    }
  }
  return models;
}

export function isProviderActive(providerId: string, keyCount: number): boolean {
  const provider = COMING_SOON_PROVIDERS.find(p => p.id === providerId);
  if (!provider) return false;
  return keyCount >= provider.keysRequired;
}
