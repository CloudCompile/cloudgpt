import { redis } from '@/lib/redis';

export type Message = {
  role: string;
  content: string | null;
  name?: string;
};

export interface TokenSaverConfig {
  enabled: boolean;
  maxMessages: number;
  strategy: 'window' | 'trim-middle';
}

export interface LorebookEntry {
  keywords: string[];
  content: string;
}

export interface LorebookConfig {
  enabled: boolean;
  entries: LorebookEntry[];
  wikiUrl?: string;
}

export interface UncensoredConfig {
  enabled: boolean;
}

export interface RpOptimizeConfig {
  enabled: boolean;
}

export interface WebSearchConfig {
  enabled: boolean;
  mode: 'always' | 'auto';
  provider: 'ddg' | 'brave' | 'serper' | 'tavily';
  apiKey?: string;
}

export interface PluginConfig {
  tokenSaver: TokenSaverConfig;
  lorebook: LorebookConfig;
  uncensored: UncensoredConfig;
  rpOptimize: RpOptimizeConfig;
  webSearch: WebSearchConfig;
}

export const DEFAULT_PLUGIN_CONFIG: PluginConfig = {
  tokenSaver: { enabled: false, maxMessages: 20, strategy: 'window' },
  lorebook: { enabled: false, entries: [] },
  uncensored: { enabled: false },
  rpOptimize: { enabled: false },
  webSearch: { enabled: false, mode: 'auto', provider: 'ddg' },
};

export async function getPluginConfig(apiKey: string): Promise<PluginConfig> {
  const raw = await redis.get(`plugins:${apiKey}`);
  if (!raw) return { ...DEFAULT_PLUGIN_CONFIG, lorebook: { ...DEFAULT_PLUGIN_CONFIG.lorebook, entries: [] } };
  try {
    const stored = JSON.parse(raw);
    return {
      tokenSaver: { ...DEFAULT_PLUGIN_CONFIG.tokenSaver, ...stored.tokenSaver },
      lorebook: {
        ...DEFAULT_PLUGIN_CONFIG.lorebook,
        ...stored.lorebook,
        entries: Array.isArray(stored.lorebook?.entries) ? stored.lorebook.entries : [],
      },
      uncensored: { ...DEFAULT_PLUGIN_CONFIG.uncensored, ...stored.uncensored },
      rpOptimize: { ...DEFAULT_PLUGIN_CONFIG.rpOptimize, ...stored.rpOptimize },
      webSearch: { ...DEFAULT_PLUGIN_CONFIG.webSearch, ...stored.webSearch },
    };
  } catch {
    return { ...DEFAULT_PLUGIN_CONFIG, lorebook: { ...DEFAULT_PLUGIN_CONFIG.lorebook, entries: [] } };
  }
}

export async function savePluginConfig(apiKey: string, config: PluginConfig): Promise<void> {
  await redis.set(`plugins:${apiKey}`, JSON.stringify(config));
}

export async function runPluginPipeline(
  messages: Message[],
  config: PluginConfig,
  apiKey: string
): Promise<Message[]> {
  const { applyTokenSaver } = await import('./tokenSaver');
  const { applyUncensored } = await import('./uncensored');
  const { applyRpOptimize } = await import('./rpOptimize');
  const { applyLorebook } = await import('./lorebook');
  const { applyWebSearch } = await import('./webSearch');

  let msgs = [...messages];

  if (config.tokenSaver.enabled) {
    msgs = applyTokenSaver(msgs, config.tokenSaver);
  }
  if (config.uncensored.enabled) {
    msgs = applyUncensored(msgs);
  }
  if (config.rpOptimize.enabled) {
    msgs = applyRpOptimize(msgs);
  }
  if (config.lorebook.enabled) {
    msgs = await applyLorebook(msgs, config.lorebook, apiKey);
  }
  if (config.webSearch.enabled) {
    msgs = await applyWebSearch(msgs, config.webSearch);
  }

  return msgs;
}
