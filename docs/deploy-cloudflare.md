# Deploying to Cloudflare Pages

Math Notebook deploys to both Cloudflare Pages and Vercel from the same repo. This guide covers Cloudflare; see [`deploy-vercel.md`](./deploy-vercel.md) for the other side.

## What you get

- Static SPA hosted on Cloudflare's edge.
- Edge functions under `/api/*` (Wolfram proxy, optional AI proxy, share helpers).
- PWA + service worker.
- Free TLS, free bandwidth, global CDN.

## Prerequisites

- A Cloudflare account.
- The `wrangler` CLI (`npm i -g wrangler` or use `npx wrangler …`).
- (Optional) a Wolfram Alpha AppID if you want the Wolfram features to work — get one free from [developer.wolframalpha.com](https://developer.wolframalpha.com).

## One-shot deploy

```bash
npm install
npm run build
npx wrangler pages deploy dist --project-name=math-notebook
```

That's it. Cloudflare prints a `*.pages.dev` URL.

## Edge functions

Functions in `api/*.ts` are dual-target — each exports both a Cloudflare `onRequest` handler and a Vercel `default` handler. Our Cloudflare build copies the appropriate shape into `functions/api/` (Cloudflare's auto-routing convention).

If you're using `wrangler pages deploy` directly, run the helper first:

```bash
node scripts/build-cf-functions.mjs
```

This script reads each `api/*.ts`, extracts the Cloudflare handler, and writes `functions/api/<name>.ts` so Cloudflare picks it up.

## Environment variables

Set these in **Cloudflare Pages → Settings → Environment variables**:

| Var | Required? | What for |
|---|---|---|
| `WOLFRAM_APPID` | only for Wolfram | the AppID for the edge function proxy |
| `ENABLE_AI_PROXY` | optional | `1` to enable the server-side `/api/ai-proxy` route (otherwise it 404s) |
| `AI_PROXY_ALLOWED_ORIGINS` | optional | comma-separated list of origins the AI proxy will accept |

No vars are required to deploy a fully working app — AI just runs from the browser via BYOK (see [`ai-byok.md`](./ai-byok.md)) and Wolfram features stay disabled.

## Custom domain

In **Cloudflare Pages → Custom domains**, add your domain. Cloudflare handles the TLS automatically.

## CI / continuous deploy

The repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. Runs `npm ci && npm run typecheck && npm run build` on push to `main`.
2. In parallel jobs, deploys to Cloudflare Pages and Vercel.
3. Gates production behind a manual approval (configurable per repo).

To enable the Cloudflare job, add these repo secrets:

| Secret | Where to find it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens. Create a token with **Pages: Edit**. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → on the right rail. |

## Local testing of edge functions

```bash
npx wrangler pages dev dist
```

Hits `http://localhost:8788/api/wolfram?q=2+2` to exercise the proxy.

## Troubleshooting

- **404 on `/api/*`** — `functions/api/<name>.ts` doesn't exist. Re-run `node scripts/build-cf-functions.mjs`.
- **Wolfram returns "no AppID"** — `WOLFRAM_APPID` isn't set on the Pages project.
- **PWA stale after deploy** — service workers update on next reload but cache the old shell. Force a hard reload once, or wait for the SW to detect the new version (within ~1 minute).
- **Bundle too big** — the bundle-size CI check fails over budget. See `scripts/check-bundle.mjs` for current budgets, or lazy-load the offender via `utils/lazy.ts`.
