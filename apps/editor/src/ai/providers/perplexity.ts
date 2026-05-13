// Perplexity Sonar — answer-grounded with citations.

import { createPerplexity } from '@ai-sdk/perplexity';
import { generateText } from 'ai';
import { registerProvider } from '../providers';

registerProvider({
  info: {
    id: 'perplexity',
    label: 'Perplexity (Sonar)',
    supportsBrowser: true,
    models: ['sonar', 'sonar-pro', 'sonar-reasoning', 'sonar-deep-research'],
  },
  build({ apiKey, model }) {
    const p = createPerplexity({ apiKey });
    return p(model ?? 'sonar');
  },
  async verify({ apiKey }) {
    try {
      const p = createPerplexity({ apiKey });
      await generateText({ model: p('sonar'), prompt: 'ping', maxOutputTokens: 4 });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
});
