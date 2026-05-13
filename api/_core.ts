// Shared types + helpers for edge functions that target both Cloudflare
// Pages Functions and Vercel Edge. The point: write ONE handler per route
// and re-export it through two adapter shapes (see _adapt.ts).
//
// Both platforms speak the Web `Request` / `Response` API, so the core
// signature is intentionally vanilla — no platform types leak in.

export interface EdgeContext {
  /** Reads an env var across both platforms. Cloudflare passes env in via
   *  the request context; Vercel exposes it on `process.env` at runtime. */
  env(name: string): string | undefined;

  /** Best-effort request log line. Visible in CF wrangler tail / Vercel logs. */
  log(message: string, data?: Record<string, unknown>): void;
}

export type EdgeHandler = (req: Request, ctx: EdgeContext) => Promise<Response> | Response;

// ----- response helpers -------------------------------------------------

export function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

export function text(body: string, init?: ResponseInit): Response {
  return new Response(body, {
    ...init,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      ...corsHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

export function notFound(): Response {
  return json({ error: 'not_found' }, { status: 404 });
}

export function badRequest(reason: string): Response {
  return json({ error: 'bad_request', reason }, { status: 400 });
}

export function methodNotAllowed(allow: string[]): Response {
  return json(
    { error: 'method_not_allowed' },
    { status: 405, headers: { allow: allow.join(', ') } },
  );
}

// ----- CORS -------------------------------------------------------------
// Default to permissive for `/api/*` since the SPA may be served from a
// different origin during dev. Tighten in individual handlers if needed.

export function corsHeaders(origin: string = '*'): Record<string, string> {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-max-age': '86400',
  };
}

export function preflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: corsHeaders() });
}
