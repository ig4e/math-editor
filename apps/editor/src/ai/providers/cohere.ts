// Cohere — Command family.

import { createCohere } from '@ai-sdk/cohere';
import { generateText } from 'ai';
import { registerProvider } from '../providers';

registerProvider({
  info: {
    id: 'cohere',
    label: 'Cohere (Command)',
    supportsBrowser: true,
    models: ['command-r-plus', 'command-r', 'command-r7b', 'command-light'],
  },
  build({ apiKey, model }) {
    const p = createCohere({ apiKey });
    return p(model ?? 'command-r');
  },
  async verify({ apiKey }) {
    try {
      const p = createCohere({ apiKey });
      await generateText({ model: p('command-r'), prompt: 'ping', maxOutputTokens: 4 });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
});
