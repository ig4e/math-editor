// Anthropic Claude — supports browser-direct via dangerouslyAllowBrowser.

import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { registerProvider } from '../providers';

registerProvider({
  info: {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    supportsBrowser: true,
    models: [
      'claude-opus-4-5',
      'claude-sonnet-4-5',
      'claude-haiku-4-5',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
    ],
    visionModels: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3-5-sonnet-latest'],
  },
  build({ apiKey, model }) {
    const p = createAnthropic({ apiKey, headers: { 'anthropic-dangerous-direct-browser-access': 'true' } });
    return p(model ?? 'claude-sonnet-4-5');
  },
  async verify({ apiKey }) {
    try {
      const p = createAnthropic({ apiKey, headers: { 'anthropic-dangerous-direct-browser-access': 'true' } });
      await generateText({ model: p('claude-haiku-4-5'), prompt: 'ping', maxOutputTokens: 4 });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
});
