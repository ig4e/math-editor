# AI — bring your own key

Math Notebook ships with **no AI keys**. Every AI feature runs against a key you provide. The app never proxies your key through any of our servers — by default the request goes straight from your browser to the provider.

If you don't want a key in your browser, an alternate **server-side proxy** path is available on self-hosted Cloudflare / Vercel deployments (see [`deploy-cloudflare.md`](./deploy-cloudflare.md) / [`deploy-vercel.md`](./deploy-vercel.md)). That trades a self-hosted server for browser key safety.

## Supported providers

| Provider | Auth | Notes |
|---|---|---|
| Anthropic | `ANTHROPIC_API_KEY` | Claude family; supports `dangerouslyAllowBrowser` |
| OpenAI | `OPENAI_API_KEY` | GPT family; supports `dangerouslyAllowBrowser` |
| Google | `GOOGLE_API_KEY` | Gemini family |
| xAI | `XAI_API_KEY` | Grok family |
| Mistral | `MISTRAL_API_KEY` | Mistral / Codestral |
| Groq | `GROQ_API_KEY` | host of Llama / Mixtral / etc. |
| **OpenAI-compatible** | `apiKey` + `baseURL` | escape hatch for any OpenAI-compatible API |

The OpenAI-compatible adapter covers DeepSeek, Qwen / Aliyun DashScope, Moonshot, Zhipu, MiniMax, Baichuan, OpenRouter, Together, Fireworks, Ollama (local), LM Studio (local), vLLM (self-host), and anything else that speaks the OpenAI wire format.

## How to add a key

1. Open **Settings → API keys**.
2. Pick a provider card.
3. Paste your key. The input is masked; the key is encrypted at rest (see "Key safety" below).
4. Optionally pick a default model from the dropdown. (Model lists are pre-seeded; you can type a custom model name too.)
5. Click **Verify** — a tiny ping confirms the key works.
6. Open the AI panel (**Cmd+L**). Your provider is now selectable from the top-of-panel chip.

### OpenAI-compatible providers

Pick **OpenAI-compatible** in the Settings, then fill:

| Field | Example |
|---|---|
| Provider name (label) | `DeepSeek` |
| Base URL | `https://api.deepseek.com` |
| API key | `sk-…` |
| Default model | `deepseek-chat` |

A short list of preset base URLs is available behind a **From preset** dropdown for the common Chinese-lab APIs:

| Lab | Base URL |
|---|---|
| DeepSeek | `https://api.deepseek.com` |
| Qwen (DashScope) | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Moonshot | `https://api.moonshot.cn/v1` |
| Zhipu | `https://open.bigmodel.cn/api/paas/v4` |
| MiniMax | `https://api.minimax.chat/v1` |
| Together | `https://api.together.xyz/v1` |
| Groq (via OpenAI-compat) | `https://api.groq.com/openai/v1` |
| OpenRouter | `https://openrouter.ai/api/v1` |
| Ollama (local) | `http://localhost:11434/v1` |
| LM Studio (local) | `http://localhost:1234/v1` |

## Key safety

Keys live **only in this browser**. Specifically:

- Stored in IndexedDB (`keysSlice`) — never in `localStorage`, never in cookies.
- Encrypted at rest with WebCrypto AES-GCM. The encryption key is derived from a per-install random salt also stored in IDB. This is **defense in depth**, not cryptographic safety: anyone with physical access to your browser profile can in principle decrypt the keys. The point is that a casual JS leak (an extension reading localStorage, a page screenshot of devtools) doesn't directly expose the keys.
- Never sent to any server we operate. By default they're sent directly to the provider's API endpoint from the browser.
- "Remove key" in Settings clears both the key and its salt.

For deployments that want stronger guarantees (e.g. shared kiosks, classroom installs), the Cloudflare / Vercel deploy includes an optional **server-side proxy** mode: keys live in the platform's secret store, and the browser calls `/api/ai-proxy` instead of the provider directly. See deploy docs.

## What features need a key?

| Feature | Provider type required |
|---|---|
| AI chat panel | any |
| Tool use (solve / graph / simplify) | any with tool support — Anthropic, OpenAI, Google, xAI, OpenAI-compat (model-dependent) |
| Convert handwriting to math (OCR) | a vision-capable model (Claude 3.5+ / GPT-4o / Gemini 1.5+ / etc.) |
| Practice generator | any |
| "Ask Wolfram" tool | requires `WOLFRAM_APPID` in your deployment env, not an LLM key |

Everything else (math editing, solving via compute-engine, graphing, PCA, etc.) works without any key.

## Network behavior

- AI requests are detected when offline and fail with an in-panel banner (never a silent failure). The rest of the app keeps working.
- Streaming uses `streamText` from the Vercel AI SDK. Cancellation is wired to a "Stop" button.
- Tool calls are surfaced in the chat thread as collapsible cards so you can see exactly what the model invoked.
