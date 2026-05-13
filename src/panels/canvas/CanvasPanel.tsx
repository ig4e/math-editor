// Stub for the Canvas panel. Phase 2 replaces this with the vendored
// excalidraw-app shell + the math overlay + anchors.

import { PanelHeader, EmptyState } from '../../components/common';

export default function CanvasPanel() {
  return (
    <div className="flex flex-col h-full bg-canvas">
      <PanelHeader title="Canvas" icon="cursor" />
      <div className="flex-1">
        <EmptyState
          icon="palette"
          title="Canvas coming in Phase 2"
          description="The Excalidraw integration lands here — vendored chrome from excalidraw-app, the math overlay, and the bound-arrow anchors for system solves."
        />
      </div>
    </div>
  );
}
