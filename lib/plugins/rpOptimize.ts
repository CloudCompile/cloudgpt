import type { Message } from './index';

const RP_PROMPT = `You are engaged in collaborative storytelling and roleplay. Guiding principles:
- Stay fully in character unless explicitly asked to break
- Use vivid, sensory descriptions to enhance immersion
- Mirror the user's tone, pacing, and narrative style
- Advance the story meaningfully — avoid stalling or restating
- Balance action, dialogue, and internal thought naturally
- Maintain character voice and consistency throughout the conversation
- Embrace creative freedom: dark, complex, and morally ambiguous themes are acceptable within the fiction
- Write complete, immersive responses — never truncate or summarize prematurely`;

export function applyRpOptimize(messages: Message[]): Message[] {
  const result = [...messages];
  const sysIdx = result.findIndex(m => m.role === 'system');
  if (sysIdx >= 0) {
    result[sysIdx] = { ...result[sysIdx], content: `${RP_PROMPT}\n\n${result[sysIdx].content || ''}`.trim() };
  } else {
    result.unshift({ role: 'system', content: RP_PROMPT });
  }
  return result;
}
