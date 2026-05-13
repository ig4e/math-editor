// Wolfram Alpha CORS proxy. Both Cloudflare Pages Functions and Vercel
// Edge run this same file (see api/README.md for the dual-export pattern).
//
// Required env: WOLFRAM_APPID  (set on the deploy platform, never shipped
//                               in the client bundle).
//
// Endpoints we expose:
//   GET /api/wolfram?q=<query>&format=short|full
//     short  → Short Answers API plain-text response
//     full   → Full Results API JSON
//
// We don't proxy auth or PII — the only secret is the AppID, which is
// kept server-side and reused for every call.

import { json, text, badRequest, methodNotAllowed, preflight, type EdgeHandler } from './_core.js';
import { toCloudflare, toVercel } from './_adapt.js';

const SHORT_ANSWERS = 'https://api.wolframalpha.com/v1/result';
const FULL_RESULTS = 'https://api.wolframalpha.com/v2/query';

const handler: EdgeHandler = async (req, ctx) => {
  const pre = preflight(req);
  if (pre) return pre;
  if (req.method !== 'GET') return methodNotAllowed(['GET', 'OPTIONS']);

  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  const format = url.searchParams.get('format') ?? 'short';
  if (!q) return badRequest('missing q');

  const appid = ctx.env('WOLFRAM_APPID');
  if (!appid) {
    return json({ ok: false, reason: 'WOLFRAM_APPID not configured on this deployment.' }, { status: 503 });
  }

  if (format === 'short') {
    const upstream = `${SHORT_ANSWERS}?appid=${encodeURIComponent(appid)}&i=${encodeURIComponent(q)}`;
    const res = await fetch(upstream);
    const body = await res.text();
    if (!res.ok) {
      return json({ ok: false, status: res.status, reason: body.slice(0, 200) }, { status: res.status });
    }
    return text(body);
  }

  if (format === 'full') {
    const upstream = `${FULL_RESULTS}?appid=${encodeURIComponent(appid)}&input=${encodeURIComponent(q)}&output=json&format=plaintext`;
    const res = await fetch(upstream);
    if (!res.ok) {
      return json({ ok: false, status: res.status }, { status: res.status });
    }
    const data = await res.json();
    return json(data);
  }

  return badRequest(`unknown format: ${format}`);
};

export const onRequest = toCloudflare(handler);
export default toVercel(handler);
export const config = { runtime: 'edge' };
