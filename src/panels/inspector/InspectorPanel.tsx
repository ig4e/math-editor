// Stub for the Inspector panel. Phase 7 fills this in.

import { PanelHeader, EmptyState } from '../../components/common';

export default function InspectorPanel() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Inspector" icon="search" />
      <div className="flex-1">
        <EmptyState
          icon="search"
          title="Inspector coming in Phase 7"
          description="MathJSON AST viewer for the selected math block — collapsible tree, copy-as-JSON."
        />
      </div>
    </div>
  );
}
