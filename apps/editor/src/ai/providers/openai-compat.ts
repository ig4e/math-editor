// Generic OpenAI-compatible adapter. Covers DeepSeek / Qwen / Moonshot /
// Zhipu / OpenRouter / Together / Fireworks / Ollama / LM Studio / vLLM
// — anything that speaks the OpenAI HTTP wire format.
//
// The user picks "OpenAI-compatible" in Settings, optionally pre-fills
// from OPENAI_COMPAT_PRESETS (e.g. DeepSeek), then enters their key.

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { registerProvider } from '../providers';

registerProvider({
  info: {
    id: 'openai-compat',
    label: 'OpenAI-compatible (BYOK)',
    supportsBrowser: true,
    // Models are unknown ahead of time; the Settings panel reads
    // `OPENAI_COMPAT_PRESETS` for hints and accepts arbitrary input.
    models: [],
  },
  build({ apiKey, baseURL, model }) {
    if (!baseURL) throw new Error('openai-compat needs baseURL');
    const p = createOpenAI({ apiKey, baseURL });
    return p(model ?? 'gpt-3.5-turbo');
  },
  async verify({ apiKey, baseURL }) {
    if (!baseURL) return { ok: false, reason: 'No base URL' };
    try {
      const p = createOpenAI({ apiKey, baseURL });
      await generateText({ model: p('gpt-3.5-turbo'), prompt: 'ping', maxOutputTokens: 4 });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
});
