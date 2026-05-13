// xAI Grok.

import { createXai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { registerProvider } from '../providers';

registerProvider({
  info: {
    id: 'xai',
    label: 'xAI (Grok)',
    supportsBrowser: true,
    models: ['grok-3', 'grok-3-mini', 'grok-2-vision', 'grok-2-latest'],
    visionModels: ['grok-2-vision'],
  },
  build({ apiKey, model }) {
    const p = createXai({ apiKey });
    return p(model ?? 'grok-3-mini');
  },
  async verify({ apiKey }) {
    try {
      const p = createXai({ apiKey });
      await generateText({ model: p('grok-3-mini'), prompt: 'ping', maxOutputTokens: 4 });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
});
