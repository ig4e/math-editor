// Cerebras — fast Llama / Qwen inference on their wafer-scale stack.

import { createCerebras } from '@ai-sdk/cerebras';
import { generateText } from 'ai';
import { registerProvider } from '../providers';

registerProvider({
  info: {
    id: 'cerebras',
    label: 'Cerebras',
    supportsBrowser: true,
    models: [
      'llama-3.3-70b',
      'llama3.1-70b',
      'llama3.1-8b',
      'qwen-3-32b',
    ],
  },
  build({ apiKey, model }) {
    const p = createCerebras({ apiKey });
    return p(model ?? 'llama-3.3-70b');
  },
  async verify({ apiKey }) {
    try {
      const p = createCerebras({ apiKey });
      await generateText({ model: p('llama3.1-8b'), prompt: 'ping', maxOutputTokens: 4 });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
});
