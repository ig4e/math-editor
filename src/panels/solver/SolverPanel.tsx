// Stub for the Solver panel. Phase 3 fills this in.

import { PanelHeader, EmptyState } from '../../components/common';

export default function SolverPanel() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Solver" icon="eval" />
      <div className="flex-1">
        <EmptyState
          icon="eval"
          title="Solver coming in Phase 3"
          description="Step-by-step solve / simplify / system solve, backed by compute-engine + mathsteps + (lazy) Pyodide SymPy."
        />
      </div>
    </div>
  );
}
