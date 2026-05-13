// OpenAI GPT — supports dangerouslyAllowBrowser via createOpenAI.

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { registerProvider } from '../providers';

registerProvider({
  info: {
    id: 'openai',
    label: 'OpenAI (GPT)',
    supportsBrowser: true,
    models: ['gpt-5', 'gpt-5-mini', 'gpt-4o', 'gpt-4o-mini', 'o3-mini'],
    visionModels: ['gpt-5', 'gpt-4o', 'gpt-4o-mini'],
  },
  build({ apiKey, model }) {
    const p = createOpenAI({ apiKey });
    return p(model ?? 'gpt-5-mini');
  },
  async verify({ apiKey }) {
    try {
      const p = createOpenAI({ apiKey });
      await generateText({ model: p('gpt-4o-mini'), prompt: 'ping', maxOutputTokens: 4 });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
});
