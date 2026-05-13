// Thin wrapper around the Vercel AI SDK's streamText. Builds a model
// from the user's chosen provider + key, attaches the canvas-block
// context as a system message, and streams to the panel's chat thread.

import { streamText, type LanguageModel, type ModelMessage } from 'ai';
export type CoreMessage = ModelMessage;
import { getProvider } from './providers';
import { loadProviderKey } from './byok';
import { buildTools } from './tools';
import { useStore } from '../state/store';
import './providers/index';

export interface ChatRequest {
  providerId: string;
  model: string;
  baseURL?: string;
  history: ModelMessage[];
  /** Optional canvas-context block injected as system message. */
  contextSummary?: string;
}

export interface ChatHandle {
  /** Async iterator of UI-ready deltas (text chunks). */
  textStream: AsyncIterable<string>;
  /** All tool-call notifications. */
  toolCalls: AsyncIterable<{ toolName: string; args: unknown }>;
  /** Cancel the in-flight request. */
  cancel(): void;
}

export async function startChat(req: ChatRequest, signal: AbortSignal): Promise<ChatHandle> {
  const provider = getProvider(req.providerId);
  if (!provider) throw new Error(`Unknown provider: ${req.providerId}`);

  const apiKey = await loadProviderKey(req.providerId);
  if (!apiKey) throw new Error('No API key stored for this provider — add one in Settings.');

  const model: LanguageModel = provider.build({
    apiKey,
    baseURL: req.baseURL,
    model: req.model,
  });

  const system = systemPrompt(req.contextSummary);
  const tools = buildTools(provider, {
    openPanel: (id) => useStore.getState().openPanel(id),
  });

  const result = streamText({
    model,
    system,
    messages: req.history,
    tools,
    abortSignal: signal,
  });

  return {
    textStream: result.textStream,
    toolCalls: (async function* () {
      for await (const part of result.fullStream) {
        if (part.type === 'tool-call') {
          yield { toolName: part.toolName, args: part.input };
        }
      }
    })(),
    cancel() {
      // streamText respects the AbortSignal we passed in.
    },
  };
}

function systemPrompt(contextSummary?: string): string {
  const base = [
    'You are a math notebook assistant embedded in an Excalidraw-powered workspace.',
    'You can call tools to solve / simplify / plot / drop blocks on the canvas.',
    'Default to LaTeX for math. Be concise; prefer one short paragraph + a tool call over a long essay.',
  ];
  if (contextSummary) {
    base.push('', '## Current canvas context', contextSummary);
  }
  return base.join('\n');
}

/** Build a plain-text summary of the active sheet's blocks for the LLM. */
export function buildCanvasContext(): string {
  const s = useStore.getState();
  const sheet = s.sheets[s.activeSheetId];
  if (!sheet) return '';
  const blocks = sheet.blocks.slice(0, 30);
  if (blocks.length === 0) return '(canvas is empty)';
  return blocks
    .map((b, i) => b.type === 'math' ? `(${i + 1}) [math] ${b.latex}` : `(${i + 1}) [text] ${b.text}`)
    .join('\n');
}
