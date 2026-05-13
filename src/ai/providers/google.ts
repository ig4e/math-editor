// Google Gemini.

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { registerProvider } from '../providers';

registerProvider({
  info: {
    id: 'google',
    label: 'Google (Gemini)',
    supportsBrowser: true,
    models: ['gemini-2.0-pro', 'gemini-2.0-flash', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
    visionModels: ['gemini-2.0-pro', 'gemini-2.0-flash', 'gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
  },
  build({ apiKey, model }) {
    const p = createGoogleGenerativeAI({ apiKey });
    return p(model ?? 'gemini-2.0-flash');
  },
  async verify({ apiKey }) {
    try {
      const p = createGoogleGenerativeAI({ apiKey });
      await generateText({ model: p('gemini-2.0-flash'), prompt: 'ping', maxOutputTokens: 4 });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
});
