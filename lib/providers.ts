// AI Provider configurations and model definitions

export interface ChatModel {
  id: string;
  name: string;
  provider: 'pollinations' | 'mapleai';
  description?: string;
  contextWindow?: number;
}

export interface ImageModel {
  id: string;
  name: string;
  provider: 'pollinations' | 'mapleai';
  description?: string;
}

export interface VideoModel {
  id: string;
  name: string;
  provider: 'pollinations' | 'mapleai';
  description?: string;
  maxDuration?: number;
}

// Available chat models
export const CHAT_MODELS: ChatModel[] = [
  { id: 'openai', name: 'OpenAI GPT-4o', provider: 'pollinations', description: 'OpenAI GPT-4o model' },
  { id: 'openai-fast', name: 'OpenAI GPT-4o Mini', provider: 'pollinations', description: 'Faster OpenAI model' },
  { id: 'openai-large', name: 'OpenAI GPT-4.5', provider: 'pollinations', description: 'Large OpenAI model' },
  { id: 'claude', name: 'Claude 3.5 Sonnet', provider: 'pollinations', description: 'Anthropic Claude 3.5 Sonnet' },
  { id: 'claude-fast', name: 'Claude 3 Haiku', provider: 'pollinations', description: 'Fast Claude model' },
  { id: 'claude-large', name: 'Claude 3.5 Opus', provider: 'pollinations', description: 'Large Claude model' },
  { id: 'gemini', name: 'Gemini 2.0 Flash', provider: 'pollinations', description: 'Google Gemini 2.0 Flash' },
  { id: 'gemini-large', name: 'Gemini 2.5 Pro', provider: 'pollinations', description: 'Google Gemini 2.5 Pro' },
  { id: 'deepseek', name: 'DeepSeek V3', provider: 'pollinations', description: 'DeepSeek V3 model' },
  { id: 'grok', name: 'Grok 3', provider: 'pollinations', description: 'xAI Grok 3' },
  { id: 'mistral', name: 'Mistral Large', provider: 'pollinations', description: 'Mistral AI Large' },
  { id: 'qwen-coder', name: 'Qwen 2.5 Coder', provider: 'pollinations', description: 'Qwen 2.5 Coder 32B' },
];

// Available image models
export const IMAGE_MODELS: ImageModel[] = [
  { id: 'flux', name: 'Flux', provider: 'pollinations', description: 'High quality image generation' },
  { id: 'turbo', name: 'Turbo', provider: 'pollinations', description: 'Fast image generation' },
  { id: 'gptimage', name: 'GPT Image', provider: 'pollinations', description: 'OpenAI image generation' },
  { id: 'kontext', name: 'Kontext', provider: 'pollinations', description: 'Context-aware image generation' },
  { id: 'seedream', name: 'Seedream', provider: 'pollinations', description: 'Creative image generation' },
];

// Available video models
export const VIDEO_MODELS: VideoModel[] = [
  { id: 'veo', name: 'Veo', provider: 'pollinations', description: 'Google Veo video generation', maxDuration: 8 },
  { id: 'seedance', name: 'Seedance', provider: 'pollinations', description: 'Creative video generation', maxDuration: 10 },
];

// Provider base URLs
export const PROVIDER_URLS = {
  pollinations: 'https://gen.pollinations.ai',
  mapleai: 'https://api.mapleai.de',
};
