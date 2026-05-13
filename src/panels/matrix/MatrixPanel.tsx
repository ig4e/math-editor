// Stub for the Matrix panel. Phase 13 fills this in.

import { PanelHeader, EmptyState } from '../../components/common';

export default function MatrixPanel() {
  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Matrix" icon="matrix" />
      <div className="flex-1">
        <EmptyState
          icon="matrix"
          title="Matrix panel coming in Phase 13"
          description="Symbolic linear algebra GUI — RREF, det, inverse, rank, eigenvalues, characteristic polynomial, LU, QR — with steps."
        />
      </div>
    </div>
  );
}
