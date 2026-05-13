# Adding an AI provider

The app's AI chat panel runs on the [Vercel AI SDK](https://sdk.vercel.ai/). Each provider is **one file** under `src/ai/providers/` exporting a `Provider` record. Adding one new provider almost never requires touching any other code.

## The contract

`src/ai/providers.ts`:

```ts
import type { LanguageModel } from 'ai';

export interface AIProvider {
  /** Stable ID — used as the key in keysSlice and on the UI provider chip. */
  id: string;                            // 'anthropic', 'openai', 'deepseek-compat', …

  /** Shown in Settings → API keys. */
  label: string;

  /** Models we know about; user can also type a custom name. */
  models: string[];

  /** True when this provider uses a generic OpenAI-compatible adapter. */
  isOpenAICompat?: boolean;

  /** Build a Vercel-AI-SDK language model from the user's key + optional base URL. */
  build(key: string, baseURL?: string, model?: string): LanguageModel;

  /** Cheap call that resolves if the key is valid — used by the "Verify" button. */
  verify(key: string, baseURL?: string): Promise<{ ok: true } | { ok: false; reason: string }>;
}

export function registerProvider(provider: AIProvider): void;
```

## Step-by-step

### 1. First-party SDK package

If the provider has a dedicated `@ai-sdk/<name>` package, install it:

```bash
npm i @ai-sdk/<name>
```

If the provider is OpenAI-compatible (most Chinese labs, OpenRouter, Ollama, etc.), you don't need a new dependency — reuse `@ai-sdk/openai`'s `createOpenAI({ baseURL })`.

### 2. Create the provider file

```ts
// src/ai/providers/<name>.ts
import { createMyProvider } from '@ai-sdk/<name>';
import { registerProvider } from '../providers';

registerProvider({
  id: '<name>',
  label: '<Display Name>',
  models: ['model-id-1', 'model-id-2'],
  build(key, _baseURL, model) {
    const p = createMyProvider({ apiKey: key });
    return p(model ?? 'model-id-1');
  },
  async verify(key) {
    try {
      const p = createMyProvider({ apiKey: key });
      // Hit a cheap endpoint — the SDK usually exposes `p.models()` or similar.
      await p.models();
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: (e as Error).message };
    }
  },
});
```

### 3. Register it at boot

Add one line to `src/ai/providers/index.ts`:

```ts
import './<name>';
```

That file is imported once at app bootstrap; every provider's side effect runs.

### 4. (Optional) Add to the OpenAI-compatible preset list

For OpenAI-compatible providers, instead of writing a file, add a row to `src/ai/openai-compat-presets.ts`:

```ts
{ id: 'mylab', label: 'My Lab', baseURL: 'https://api.mylab.example/v1', defaultModel: 'mylab-base' }
```

Users see "My Lab" in the **From preset** dropdown when they pick **OpenAI-compatible** as the provider type. Their key + the preset's baseURL flow through the generic `openai-compat` provider — no per-provider code.

## What the SDK gives you for free

Once your provider is registered, **all of this works without further code**:

- The AI panel chat thread uses `streamText` with your provider's `LanguageModel`.
- Tool calls (`solve`, `graph`, `simplify`, `ocr_image`, `insert_block`) route through the same tool schema — whichever providers support tool use will surface them.
- The Settings → API keys section renders a card for your provider automatically, with masked input, model picker, and Verify button.
- The provider chip at the top of the AI panel includes your provider in its dropdown.

## Tips

- **Tool-use compatibility varies by model**, not just by provider. If your provider has both tool-capable and non-tool-capable models, list them anyway — the panel asks for tool support per-call and falls back gracefully.
- **Browser-direct vs proxied**. Anthropic and OpenAI honor `dangerouslyAllowBrowser: true`. Some providers (notably Google's Gemini and Mistral) block browser calls; for those you should set `isOpenAICompat: false` and provide a server-side path through `/api/ai-proxy` (enabled via the deploy env var; see [`ai-byok.md`](./ai-byok.md)).
- **Vision** is opt-in per model. Mark vision-capable models in `models` with a `*` suffix so the OCR feature can filter for them.

## Anti-patterns

- Don't fork the AI panel to add a custom UI for one provider — providers are interchangeable through the contract.
- Don't bake provider-specific behavior into `panels/ai/AIPanel.tsx`. If a quirk is unavoidable, expose it as an option on the provider's `build()` and surface it through Settings.
- Don't ship a default key. Users always bring their own.
