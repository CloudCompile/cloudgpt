import type { Message, TokenSaverConfig } from './index';

export function applyTokenSaver(messages: Message[], config: TokenSaverConfig): Message[] {
  const { maxMessages, strategy } = config;

  const systemMessages = messages.filter(m => m.role === 'system');
  const conversation = messages.filter(m => m.role !== 'system');

  if (conversation.length <= maxMessages) return messages;

  let trimmed: Message[];
  if (strategy === 'window') {
    trimmed = conversation.slice(-maxMessages);
  } else {
    const keep = Math.max(1, maxMessages - 1);
    trimmed = [conversation[0], ...conversation.slice(-keep)];
  }

  return [...systemMessages, ...trimmed];
}
