// Wires Excalidraw's built-in "Text to Diagram" (Mermaid) dialog to
// the user's configured AI provider. When the user types a prompt and
// hits submit, Excalidraw calls onTextSubmit; we forward it to our
// AI chat machinery with a Mermaid-specific system prompt and return
// the generated source. Excalidraw then renders the diagram inline
// and lets the user drop it on the canvas as native shapes.

import { TTDDialog } from '@excalidraw/excalidraw';
import { useStore } from '../../state/store';

type Result =
  | { generatedResponse: string | undefined; error?: null }
  | { error: Error; generatedResponse?: null };

export function CanvasTTDDialog() {
  const onSubmit = async (value: string): Promise<Result> => {
    const state = useStore.getState();
    const provider = state.defaultProvider;
    const model = state.defaultModel;
    if (!provider || !model) {
      return { error: new Error('Pick a default AI provider in Settings → API keys first.') };
    }

    const sys =
      'You are a Mermaid diagram generator. Reply with ONLY a Mermaid source ' +
      'code block (no prose, no fences, just the directives). Pick the best ' +
      'Mermaid chart type for the user request (flowchart, sequence, class, ' +
      'state, ER, gantt, mindmap, etc.).';

    try {
      const { startChat } = await import('../../ai/chat');
      const ctrl = new AbortController();
      const handle = await startChat(
        {
          providerId: provider,
          model,
          history: [
            { role: 'system', content: sys },
            { role: 'user', content: value },
          ],
        },
        ctrl.signal,
      );
      let text = '';
      for await (const chunk of handle.textStream) text += chunk;
      // Strip code fence if the model emitted one anyway.
      const fence = text.match(/```(?:mermaid)?\n?([\s\S]*?)```/i);
      const cleaned = (fence?.[1] ?? text).trim();
      return { generatedResponse: cleaned };
    } catch (e) {
      return { error: e as Error };
    }
  };

  return <TTDDialog onTextSubmit={onSubmit} />;
}
