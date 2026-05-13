// Server-side AI proxy. Lets the browser delegate AI calls so the user's
// provider key never leaves the server, and so providers with no
// browser-CORS (Mistral) become reachable.
//
// Gated by `ENABLE_AI_PROXY=1` on the deployment. Without that flag,
// every POST returns 503 so the path can't be abused if someone forgets
// to scope the env vars. Origins are validated against
// `AI_PROXY_ALLOWED_ORIGINS` (comma-separated, exact match) — never use
// a wildcard here unless you understand the implications.
//
// Provider key env vars (set whichever you want enabled):
//   ANTHROPIC_API_KEY · OPENAI_API_KEY · GOOGLE_GENERATIVE_AI_API_KEY ·
//   XAI_API_KEY · MISTRAL_API_KEY · GROQ_API_KEY · OPENAI_COMPAT_API_KEY +
//   OPENAI_COMPAT_BASE_URL
//
// Request body (JSON):
//   { providerId, model, system?, messages, baseURL? }
//
// Response: a `text/plain` SSE-ish stream produced by AI SDK v6's
// `toTextStreamResponse()`. Client side decodes via the standard
// `Response.body.getReader()` loop in src/ai/proxyStream.ts.

import { badRequest, methodNotAllowed, preflight, json, type EdgeHandler } from './_core.js';
import { toCloudflare, toVercel } from './_adapt.js';

type ProviderId = 'anthropic' | 'openai' | 'google' | 'xai' | 'mistral' | 'groq' | 'openai-compat';

interface ProxyBody {
  providerId: ProviderId;
  model: string;
  system?: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  /** baseURL for the OpenAI-compatible adapter; ignored for others. */
  baseURL?: string;
}

const handler: EdgeHandler = async (req, ctx) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'POST') return methodNotAllowed(['POST', 'OPTIONS']);

  if (ctx.env('ENABLE_AI_PROXY') !== '1') {
    return json({ ok: false, reason: 'AI proxy disabled. Set ENABLE_AI_PROXY=1 on the deployment.' }, { status: 503 });
  }

  // Origin allowlist. Empty list = reject everything (fail-closed).
  const allowed = (ctx.env('AI_PROXY_ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.get('origin') ?? '';
  if (!allowed.includes(origin)) {
    ctx.log('ai-proxy origin rejected', { origin, allowedCount: allowed.length });
    return json({ ok: false, reason: `Origin "${origin}" not in AI_PROXY_ALLOWED_ORIGINS.` }, { status: 403 });
  }

  let body: ProxyBody;
  try {
    body = (await req.json()) as ProxyBody;
  } catch {
    return badRequest('invalid JSON body');
  }
  if (!body?.providerId || !body?.model || !Array.isArray(body.messages)) {
    return badRequest('missing providerId / model / messages');
  }

  const key = lookupKey(body.providerId, ctx);
  if (!key) return json({ ok: false, reason: `No server key configured for provider "${body.providerId}".` }, { status: 503 });

  try {
    // Dynamic imports keep the cold-start small: only the chosen
    // provider's SDK loads per request.
    const { streamText } = await import('ai');
    const model = await buildModel(body.providerId, body.model, key, body.baseURL);

    const result = streamText({
      model,
      system: body.system,
      messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    // toTextStreamResponse() returns a Response whose body is the
    // streaming text. The CORS headers we want on it aren't there by
    // default, so we layer them on top.
    const res = result.toTextStreamResponse();
    res.headers.set('access-control-allow-origin', origin);
    res.headers.set('access-control-allow-methods', 'POST, OPTIONS');
    res.headers.set('access-control-allow-headers', 'content-type');
    return res;
  } catch (e) {
    ctx.log('ai-proxy upstream error', { msg: (e as Error).message });
    return json({ ok: false, reason: (e as Error).message }, { status: 502 });
  }
};

function lookupKey(provider: ProviderId, ctx: { env: (n: string) => string | undefined }): string | undefined {
  switch (provider) {
    case 'anthropic':     return ctx.env('ANTHROPIC_API_KEY');
    case 'openai':        return ctx.env('OPENAI_API_KEY');
    case 'google':        return ctx.env('GOOGLE_GENERATIVE_AI_API_KEY');
    case 'xai':           return ctx.env('XAI_API_KEY');
    case 'mistral':       return ctx.env('MISTRAL_API_KEY');
    case 'groq':          return ctx.env('GROQ_API_KEY');
    case 'openai-compat': return ctx.env('OPENAI_COMPAT_API_KEY');
  }
}

// We dynamic-import each provider so the function's cold-start only pays
// for what's needed. The handful of factory shapes:
async function buildModel(providerId: ProviderId, model: string, apiKey: string, baseURL?: string) {
  switch (providerId) {
    case 'anthropic': {
      const { createAnthropic } = await import('@ai-sdk/anthropic');
      return createAnthropic({ apiKey })(model);
    }
    case 'openai': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      return createOpenAI({ apiKey })(model);
    }
    case 'google': {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
      return createGoogleGenerativeAI({ apiKey })(model);
    }
    case 'xai': {
      const { createXai } = await import('@ai-sdk/xai');
      return createXai({ apiKey })(model);
    }
    case 'mistral': {
      const { createMistral } = await import('@ai-sdk/mistral');
      return createMistral({ apiKey })(model);
    }
    case 'groq': {
      const { createGroq } = await import('@ai-sdk/groq');
      return createGroq({ apiKey })(model);
    }
    case 'openai-compat': {
      const { createOpenAI } = await import('@ai-sdk/openai');
      return createOpenAI({ apiKey, baseURL: baseURL ?? '' })(model);
    }
  }
}

export const onRequest = toCloudflare(handler);
export default toVercel(handler);
export const config = { runtime: 'edge' };
