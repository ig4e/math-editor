// Client-side consumer for the /api/ai-proxy text-stream response.
// AI SDK v6's toTextStreamResponse() emits plain UTF-8 text chunks
// (newline-delimited frames are not used by this transport — chunks
// arrive as raw text). We expose the same shape as chat.ts's
// ChatHandle so the panel can swap one for the other.

import type { ChatHandle, ChatRequest } from './chat';

export async function startChatViaProxy(req: ChatRequest, signal: AbortSignal): Promise<ChatHandle> {
  const res = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      providerId: req.providerId,
      model: req.model,
      baseURL: req.baseURL,
      system: undefined,           // chat.ts builds the system prompt; proxy reads `system` directly. The caller may pre-stuff it via the first message; we keep this simple for now.
      messages: req.history.map((m) => ({
        role: m.role === 'user' || m.role === 'assistant' || m.role === 'system' ? m.role : 'user',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    let reason = `HTTP ${res.status}`;
    try {
      const j = await res.json() as { reason?: string };
      if (j.reason) reason = j.reason;
    } catch { /* not JSON — stick with the status */ }
    throw new Error(reason);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  // No tool-calls over this transport in v1 — the proxy strips them so
  // the response is pure text. UI surfaces this in the AI panel by
  // disabling the tool-affordances when proxy mode is on.
  const noToolCalls: ChatHandle['toolCalls'] = (async function* () {
    /* empty */
  })();

  const textStream: ChatHandle['textStream'] = (async function* () {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      yield decoder.decode(value, { stream: true });
    }
  })();

  return {
    textStream,
    toolCalls: noToolCalls,
    cancel: () => reader.cancel().catch(() => {}),
  };
}
