// Two adapters wrap one EdgeHandler so the same file deploys to both
// Cloudflare Pages Functions and Vercel Edge.
//
//   import { handler } from './my-route-core';
//   export const onRequest = toCloudflare(handler);
//   export default        toVercel(handler);
//   export const config   = { runtime: 'edge' };
//
// scripts/build-cf-functions.mjs picks `onRequest` out and copies it into
// functions/api/ at build time so Cloudflare's auto-routing finds it.

import type { EdgeHandler, EdgeContext } from './_core.js';

// ----- Cloudflare Pages Function adapter --------------------------------
// CF passes a context object with { request, env, waitUntil, ... }.

interface CloudflareCtx {
  request: Request;
  env: Record<string, string | undefined>;
  waitUntil?(p: Promise<unknown>): void;
}

export function toCloudflare(h: EdgeHandler) {
  return async (ctx: CloudflareCtx): Promise<Response> => {
    const edge: EdgeContext = {
      env: (name) => ctx.env?.[name],
      log: (msg, data) => console.log(`[cf] ${msg}`, data ?? ''),
    };
    return h(ctx.request, edge);
  };
}

// ----- Vercel Edge adapter ----------------------------------------------
// Vercel passes a plain Request. Env comes from process.env at runtime
// (Edge runtime injects it as a global, indistinguishable from Node).

export function toVercel(h: EdgeHandler) {
  return async (req: Request): Promise<Response> => {
    const edge: EdgeContext = {
      env: (name) => {
        // process is defined in the Edge runtime via globalThis.
        const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } })
          .process;
        return proc?.env?.[name];
      },
      log: (msg, data) => console.log(`[vercel] ${msg}`, data ?? ''),
    };
    return h(req, edge);
  };
}
