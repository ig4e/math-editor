// Stub for the 2D Graph panel. Phase 4 fills this in.

import { PanelHeader, EmptyState } from '../../components/common';

export default function GraphPanel() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Graph 2D" icon="graph" />
      <div className="flex-1">
        <EmptyState
          icon="graph"
          title="Graph 2D coming in Phase 4"
          description="JSXGraph plotter — f(x), parametric, implicit, intersections, variable sliders, Pin to Canvas."
        />
      </div>
    </div>
  );
}
