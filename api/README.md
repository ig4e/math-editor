# Edge functions

Every file in this directory is an edge function deployed to **both**
Cloudflare Pages Functions and Vercel Edge from one source. The pattern:

```ts
import { json, preflight, type EdgeHandler } from './_core';
import { toCloudflare, toVercel } from './_adapt';

const handler: EdgeHandler = (req, ctx) => {
  const pre = preflight(req);
  if (pre) return pre;
  // ...
  return json({ ok: true });
};

export const onRequest = toCloudflare(handler); // Cloudflare convention
export default toVercel(handler);               // Vercel convention
export const config = { runtime: 'edge' };      // Vercel: force Edge runtime
```

- **Vercel** picks up `default` + `config` automatically from `api/*.ts`.
- **Cloudflare** wants files under `functions/api/*.ts` exporting `onRequest`. Our build runs `node scripts/build-cf-functions.mjs` which copies these files in place during the CF deploy.

See [`/docs/deploy-cloudflare.md`](../docs/deploy-cloudflare.md) and [`/docs/deploy-vercel.md`](../docs/deploy-vercel.md).

## Helpers

- `_core.ts` — shared types (`EdgeHandler`, `EdgeContext`), `json/text/badRequest/notFound/methodNotAllowed`, `corsHeaders`, `preflight`.
- `_adapt.ts` — `toCloudflare` and `toVercel` wrappers. Underscore-prefixed so neither platform tries to route them.

## Shipping routes

| File | Phase | What it does |
|---|---|---|
| `hello.ts` | P0 | health check |
| `wolfram.ts` | P10 | Wolfram Alpha CORS proxy (needs `WOLFRAM_APPID`) |
| `ai-proxy.ts` | optional | server-side AI BYOK path (needs `ENABLE_AI_PROXY=1`) |
| `share.ts` | P8 | share-link encode helper |
