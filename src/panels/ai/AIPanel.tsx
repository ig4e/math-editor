// Stub for the AI chat panel. Phase 6 fills this in.

import { PanelHeader, EmptyState } from '../../components/common';

export default function AIPanel() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="AI chat" icon="sparkles" />
      <div className="flex-1">
        <EmptyState
          icon="sparkles"
          title="AI chat coming in Phase 6"
          description="BYOK across Anthropic / OpenAI / Google / xAI / Mistral / Groq + OpenAI-compatible (DeepSeek, Qwen, Moonshot). Streaming, tool use, vision OCR."
        />
      </div>
    </div>
  );
}
