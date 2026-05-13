// Stub for the 3D Graph panel. Phase 5 fills this in.

import { PanelHeader, EmptyState } from '../../components/common';

export default function Graph3DPanel() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Graph 3D" icon="cube" />
      <div className="flex-1">
        <EmptyState
          icon="cube"
          title="Graph 3D coming in Phase 5"
          description="three.js + R3F surfaces, vector fields, parametric curves, orbit controls. Pin frames to canvas."
        />
      </div>
    </div>
  );
}
