// Mistral.

import { createMistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';
import { registerProvider } from '../providers';

registerProvider({
  info: {
    id: 'mistral',
    label: 'Mistral',
    supportsBrowser: false, // Mistral's CORS policy blocks browser-direct
    models: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest', 'pixtral-large-latest'],
    visionModels: ['pixtral-large-latest'],
  },
  build({ apiKey, model }) {
    const p = createMistral({ apiKey });
    return p(model ?? 'mistral-small-latest');
  },
  async verify({ apiKey }) {
    try {
      const p = createMistral({ apiKey });
      await generateText({ model: p('mistral-small-latest'), prompt: 'ping', maxOutputTokens: 4 });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
});
