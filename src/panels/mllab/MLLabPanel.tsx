// Stub for the ML Lab panel. Phase 15 fills this in.

import { PanelHeader, EmptyState } from '../../components/common';

export default function MLLabPanel() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="ML Lab" icon="brain" />
      <div className="flex-1">
        <EmptyState
          icon="brain"
          title="ML Lab coming in Phase 15"
          description="Regression / Gradient descent / Optimizers / PCA / Distributions / Activations / Tiny MLP forward pass."
        />
      </div>
    </div>
  );
}
