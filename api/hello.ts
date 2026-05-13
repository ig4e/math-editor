// Canonical example edge function. Hit /api/hello on either CF or Vercel
// and it answers with the platform + a timestamp. The Wolfram, AI-proxy,
// and share-link edge functions in later phases follow the same shape.

import { json, preflight, type EdgeHandler } from './_core.js';
import { toCloudflare, toVercel } from './_adapt.js';

const handler: EdgeHandler = (req, ctx) => {
  const pre = preflight(req);
  if (pre) return pre;

  const platform = ctx.env('CF_PAGES') ? 'cloudflare' : 'vercel-or-local';
  return json({
    ok: true,
    platform,
    method: req.method,
    timestamp: new Date().toISOString(),
    message: 'Math Notebook edge runtime is alive.',
  });
};

export const onRequest = toCloudflare(handler);
export default toVercel(handler);
export const config = { runtime: 'edge' };
