// Groq — fast hosted Llama / Mixtral / etc.

import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { registerProvider } from '../providers';

registerProvider({
  info: {
    id: 'groq',
    label: 'Groq',
    supportsBrowser: true,
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    visionModels: ['llama-3.2-90b-vision-preview', 'llama-3.2-11b-vision-preview'],
  },
  build({ apiKey, model }) {
    const p = createGroq({ apiKey });
    return p(model ?? 'llama-3.1-8b-instant');
  },
  async verify({ apiKey }) {
    try {
      const p = createGroq({ apiKey });
      await generateText({ model: p('llama-3.1-8b-instant'), prompt: 'ping', maxOutputTokens: 4 });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
});
