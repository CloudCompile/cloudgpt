import type { Message, WebSearchConfig } from './index';

const RESULT_LIMIT = 3;

interface SearchResult {
  title: string;
  snippet: string;
  url?: string;
}

async function searchDDG(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json() as {
      AbstractText?: string; Heading?: string; AbstractURL?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
    };
    const results: SearchResult[] = [];
    if (data.AbstractText) {
      results.push({ title: data.Heading || 'Summary', snippet: data.AbstractText, url: data.AbstractURL });
    }
    for (const topic of (data.RelatedTopics || []).slice(0, RESULT_LIMIT - results.length)) {
      if (topic.Text && topic.FirstURL) {
        results.push({ title: topic.Text.split(' - ')[0], snippet: topic.Text, url: topic.FirstURL });
      }
    }
    return results.slice(0, RESULT_LIMIT);
  } catch {
    return [];
  }
}

async function searchBrave(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${RESULT_LIMIT}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'X-Subscription-Token': apiKey },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { web?: { results: Array<{ title: string; description?: string; url: string }> } };
    return (data.web?.results || []).slice(0, RESULT_LIMIT).map(r => ({
      title: r.title, snippet: r.description || '', url: r.url,
    }));
  } catch {
    return [];
  }
}

async function searchSerper(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ q: query, num: RESULT_LIMIT }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { organic?: Array<{ title: string; snippet?: string; link: string }> };
    return (data.organic || []).slice(0, RESULT_LIMIT).map(r => ({
      title: r.title, snippet: r.snippet || '', url: r.link,
    }));
  } catch {
    return [];
  }
}

async function searchTavily(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, query, max_results: RESULT_LIMIT }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { results?: Array<{ title: string; content?: string; url: string }> };
    return (data.results || []).slice(0, RESULT_LIMIT).map(r => ({
      title: r.title, snippet: r.content || '', url: r.url,
    }));
  } catch {
    return [];
  }
}

function needsSearch(query: string): boolean {
  return (
    /\b(today|now|current|latest|recent|2024|2025|2026)\b/i.test(query) ||
    /\b(news|update|event|price|weather|stock|score)\b/i.test(query) ||
    /\b(happened|happening|announced|released|launched)\b/i.test(query)
  );
}

async function doSearch(query: string, config: WebSearchConfig): Promise<SearchResult[]> {
  const { provider, apiKey } = config;
  if (provider === 'brave' && apiKey) return searchBrave(query, apiKey);
  if (provider === 'serper' && apiKey) return searchSerper(query, apiKey);
  if (provider === 'tavily' && apiKey) return searchTavily(query, apiKey);
  return searchDDG(query);
}

export async function applyWebSearch(messages: Message[], config: WebSearchConfig): Promise<Message[]> {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const query = lastUser?.content;
  if (!query) return messages;

  if (config.mode === 'auto' && !needsSearch(query)) return messages;

  const results = await doSearch(query, config);
  if (results.length === 0) return messages;

  const block = results
    .map((r, i) => `${i + 1}. **${r.title}**\n${r.snippet}${r.url ? `\nSource: ${r.url}` : ''}`)
    .join('\n\n');

  const injection = `[Web Search Results for: "${query.slice(0, 100)}"]\n${block}`;
  const result = [...messages];
  const sysIdx = result.findIndex(m => m.role === 'system');
  if (sysIdx >= 0) {
    result.splice(sysIdx + 1, 0, { role: 'system', content: injection });
  } else {
    result.unshift({ role: 'system', content: injection });
  }
  return result;
}
