// Shared types across the AI module. Kept separate so the providers
// registry can import them without dragging in the SDK runtime.

import type { LanguageModel } from 'ai';

export interface ProviderInfo {
  id: string;
  label: string;
  /** Whether the SDK supports calling this provider directly from the browser. */
  supportsBrowser: boolean;
  /** Suggested model names — UI exposes both these and a free-form input. */
  models: readonly string[];
  /** Marks vision-capable models so OCR can filter. Format: model id suffix. */
  visionModels?: readonly string[];
}

export interface ProviderAdapter {
  info: ProviderInfo;
  /** Build a Vercel AI SDK LanguageModel from a key + optional baseURL/model. */
  build(opts: { apiKey: string; baseURL?: string; model?: string }): LanguageModel;
  /** Cheap verify ping — the Settings panel's "Verify" button. */
  verify(opts: { apiKey: string; baseURL?: string }): Promise<{ ok: true } | { ok: false; reason: string }>;
}

export interface OpenAICompatPreset {
  id: string;
  label: string;
  baseURL: string;
  defaultModel?: string;
  visionModels?: readonly string[];
}
