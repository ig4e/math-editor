// DeepSeek — first-class (was reachable via openai-compat before). The
// dedicated SDK adds support for their reasoning models' thought-tag
// markers in the streamed output.

import { createDeepSeek } from '@ai-sdk/deepseek';
import { generateText } from 'ai';
import { registerProvider } from '../providers';

registerProvider({
  info: {
    id: 'deepseek',
    label: 'DeepSeek',
    supportsBrowser: true,
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  build({ apiKey, model }) {
    const p = createDeepSeek({ apiKey });
    return p(model ?? 'deepseek-chat');
  },
  async verify({ apiKey }) {
    try {
      const p = createDeepSeek({ apiKey });
      await generateText({ model: p('deepseek-chat'), prompt: 'ping', maxOutputTokens: 4 });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
});
