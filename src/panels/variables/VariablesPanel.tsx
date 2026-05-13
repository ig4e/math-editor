// Stub for the Variables panel. Phase 3 fills this in.

import { PanelHeader, EmptyState } from '../../components/common';

export default function VariablesPanel() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Variables" icon="tag" />
      <div className="flex-1">
        <EmptyState
          icon="tag"
          title="Variables coming in Phase 3"
          description="Detected `name = number` definitions with drag-to-edit sliders that update the source block live."
        />
      </div>
    </div>
  );
}
