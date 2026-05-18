import type { Message, LorebookConfig } from './index';
import { redis } from '@/lib/redis';
import { createHash } from 'crypto';

const WIKI_TTL = 7 * 24 * 60 * 60; // 7 days
const MAX_WIKI_WORDS = 2000;

async function fetchWikiContent(url: string): Promise<string | null> {
  try {
    const match = url.match(/wikipedia\.org\/wiki\/(.+)/);
    if (match) {
      const title = decodeURIComponent(match[1].split('#')[0]);
      const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      const data = await res.json() as { extract?: string };
      return data.extract || null;
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.split(' ').slice(0, MAX_WIKI_WORDS).join(' ');
  } catch {
    return null;
  }
}

async function getCachedWiki(apiKey: string, url: string): Promise<string | null> {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 16);
  const cacheKey = `wiki-cache:${apiKey}:${hash}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
  const content = await fetchWikiContent(url);
  if (content) await redis.setEx(cacheKey, WIKI_TTL, content);
  return content;
}

export async function refreshWikiCache(apiKey: string, url: string): Promise<string | null> {
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 16);
  const cacheKey = `wiki-cache:${apiKey}:${hash}`;
  await redis.del(cacheKey);
  const content = await fetchWikiContent(url);
  if (content) await redis.setEx(cacheKey, WIKI_TTL, content);
  return content;
}

export async function applyLorebook(
  messages: Message[],
  config: LorebookConfig,
  apiKey: string
): Promise<Message[]> {
  const allText = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => m.content || '')
    .join(' ')
    .toLowerCase();

  const injections: string[] = [];

  if (config.wikiUrl) {
    const wiki = await getCachedWiki(apiKey, config.wikiUrl);
    if (wiki) injections.push(`[World Knowledge]\n${wiki}`);
  }

  for (const entry of config.entries) {
    if (entry.keywords.some(kw => allText.includes(kw.toLowerCase()))) {
      injections.push(entry.content);
    }
  }

  if (injections.length === 0) return messages;

  const injection = `[Lorebook]\n${injections.join('\n\n---\n\n')}`;
  const result = [...messages];
  const sysIdx = result.findIndex(m => m.role === 'system');
  if (sysIdx >= 0) {
    result.splice(sysIdx + 1, 0, { role: 'system', content: injection });
  } else {
    result.unshift({ role: 'system', content: injection });
  }
  return result;
}
