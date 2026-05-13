// Stub for the Reference panel. Phase 7 fills this in.

import { PanelHeader, EmptyState } from '../../components/common';

export default function ReferencePanel() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Reference" icon="book" />
      <div className="flex-1">
        <EmptyState
          icon="book"
          title="Reference coming in Phase 7"
          description="Formula sheet, constants, identities; filtered by curriculum (Phase 16)."
        />
      </div>
    </div>
  );
}
