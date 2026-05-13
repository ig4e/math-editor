// Local types for the AI panel. Kept here (not in src/ai/types.ts) so
// AIPanel + ChatMessageView + ChatComposer can all import without
// pulling in the SDK runtime.

export interface ChatUIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  toolCalls?: { toolName: string; args: unknown }[];
}
