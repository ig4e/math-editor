// AI provider registry. Each provider is registered as a ProviderAdapter
// in `providers/<name>.ts` files; this module is the registry contract.
//
// The OpenAI-compatible escape hatch handles DeepSeek / Qwen / Moonshot /
// Zhipu / OpenRouter / Together / Ollama / LM Studio — anything that
// speaks the OpenAI HTTP wire format.

import type { ProviderAdapter, OpenAICompatPreset } from './types';

const registry = new Map<string, ProviderAdapter>();

export function registerProvider(p: ProviderAdapter): void {
  registry.set(p.info.id, p);
}

export function getProvider(id: string): ProviderAdapter | undefined {
  return registry.get(id);
}

export function getAllProviders(): readonly ProviderAdapter[] {
  return [...registry.values()];
}

// ----- OpenAI-compat presets ------------------------------------------
// Selecting "OpenAI-compatible" in Settings reveals a preset dropdown.

export const OPENAI_COMPAT_PRESETS: readonly OpenAICompatPreset[] = [
  { id: 'deepseek',   label: 'DeepSeek',         baseURL: 'https://api.deepseek.com',                                defaultModel: 'deepseek-chat',     visionModels: [] },
  { id: 'qwen',       label: 'Qwen (DashScope)', baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-plus' },
  { id: 'moonshot',   label: 'Moonshot',         baseURL: 'https://api.moonshot.cn/v1',                              defaultModel: 'moonshot-v1-32k' },
  { id: 'zhipu',      label: 'Zhipu',            baseURL: 'https://open.bigmodel.cn/api/paas/v4',                    defaultModel: 'glm-4' },
  { id: 'minimax',    label: 'MiniMax',          baseURL: 'https://api.minimax.chat/v1',                             defaultModel: 'abab6.5s-chat' },
  { id: 'together',   label: 'Together',         baseURL: 'https://api.together.xyz/v1' },
  { id: 'openrouter', label: 'OpenRouter',       baseURL: 'https://openrouter.ai/api/v1' },
  { id: 'fireworks',  label: 'Fireworks',        baseURL: 'https://api.fireworks.ai/inference/v1' },
  { id: 'ollama',     label: 'Ollama (local)',   baseURL: 'http://localhost:11434/v1' },
  { id: 'lmstudio',   label: 'LM Studio (local)', baseURL: 'http://localhost:1234/v1' },
  { id: 'vllm',       label: 'vLLM (custom)',    baseURL: 'http://localhost:8000/v1' },
];

export type { ProviderAdapter, ProviderInfo, OpenAICompatPreset } from './types';
