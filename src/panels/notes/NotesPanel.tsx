// Stub for the Notes panel. Phase 7 fills this in.

import { PanelHeader, EmptyState } from '../../components/common';

export default function NotesPanel() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Notes" icon="note" />
      <div className="flex-1">
        <EmptyState
          icon="note"
          title="Notes coming in Phase 7"
          description="Markdown editor with optional Python code-blocks (powered by the lazy Pyodide kernel)."
        />
      </div>
    </div>
  );
}
