// Stub for the Numerics panel. Phase 14 fills this in.

import { PanelHeader, EmptyState } from '../../components/common';

export default function NumericsPanel() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Numerics" icon="function" />
      <div className="flex-1">
        <EmptyState
          icon="function"
          title="Numerics panel coming in Phase 14"
          description="Newton / Bisection / Secant / Euler / RK4 / Trapezoid / Simpson / FFT / Gradient Descent — iteration tables, convergence chart, send-to-graph."
        />
      </div>
    </div>
  );
}
