# Deploying to Vercel

Math Notebook deploys to both Cloudflare Pages and Vercel from the same repo. This guide covers Vercel; see [`deploy-cloudflare.md`](./deploy-cloudflare.md) for the other.

## What you get

- Static SPA hosted on Vercel's edge network.
- Edge functions under `/api/*` (Wolfram proxy, optional AI proxy, share helpers).
- PWA + service worker.
- Free preview deployments per pull request.

## Prerequisites

- A Vercel account.
- The `vercel` CLI (`npm i -g vercel` or use `npx vercel …`).
- (Optional) a Wolfram Alpha AppID for the Wolfram features.

## One-shot deploy

From a clean checkout:

```bash
npm install
npx vercel link        # interactive — pick or create a project
npx vercel deploy --prod
```

Vercel detects the Vite config and runs `npm run build` automatically.

## Edge functions

Functions live in `api/*.ts` and export a `default` handler — Vercel's convention. (The same file also exports a Cloudflare `onRequest` for the CF deploy.)

Vercel auto-deploys anything in `api/`. No build step needed beyond the standard `vercel deploy`.

To force a function to run on Vercel's **Edge runtime** (rather than Node), export:

```ts
export const config = { runtime: 'edge' };
```

This is set in `api/wolfram.ts` and the optional `api/ai-proxy.ts`.

## Environment variables

Set in **Vercel project → Settings → Environment Variables**:

| Var | Required? | What for |
|---|---|---|
| `WOLFRAM_APPID` | only for Wolfram | the AppID for the edge function proxy |
| `ENABLE_AI_PROXY` | optional | `1` to enable the server-side `/api/ai-proxy` route |
| `AI_PROXY_ALLOWED_ORIGINS` | optional | comma-separated origins for the AI proxy |

No vars are required to deploy a fully working app — AI runs from the browser via BYOK (see [`ai-byok.md`](./ai-byok.md)) and Wolfram features stay disabled until you set the AppID.

## Custom domain

In **Vercel project → Settings → Domains**, add your domain. TLS is automatic.

## CI / continuous deploy

The repo ships a GitHub Actions workflow that, on push to `main`:

1. Runs `npm ci && npm run typecheck && npm run build`.
2. Deploys to Vercel via the official `vercel deploy --prebuilt` flow.
3. Gates production behind a manual approval.

To enable the Vercel job, add these repo secrets:

| Secret | Where to find it |
|---|---|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens). Create a token with full scope. |
| `VERCEL_ORG_ID` | `cat .vercel/project.json` after `vercel link`. |
| `VERCEL_PROJECT_ID` | `cat .vercel/project.json` after `vercel link`. |

## Preview deployments

Every pull request gets its own preview URL. AI BYOK and Wolfram both work on previews — you set env vars at the project level, so previews inherit them. (Optional: scope `WOLFRAM_APPID` to `Production` only to avoid sending preview traffic to your quota.)

## Local testing of edge functions

```bash
npx vercel dev
```

Hits `http://localhost:3000/api/wolfram?q=2+2` to exercise the proxy.

## Troubleshooting

- **404 on `/api/*`** — make sure the file exists at `api/<name>.ts` and exports a default handler.
- **Function timeout** — the default for Edge functions is 30 s. Wolfram should never take that long; if it does, the function returns an error response with the upstream status.
- **PWA stale after deploy** — service workers update on next reload but cache the old shell. Force a hard reload once.
- **Bundle too big** — the bundle-size CI check fails over budget. See `scripts/check-bundle.mjs`.
