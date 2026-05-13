// Excalidraw <Footer> children — a compact status strip showing the
// known-variables count, active AI provider, and a "Cmd+K" prompt.
// Sits on the bottom-center of the canvas alongside Excalidraw's native
// zoom controls and undo/redo.

import { Footer } from '@excalidraw/excalidraw';
import { useStore } from '../../state/store';
import { useActiveSheet } from '../../state/selectors';
import { Kbd } from '../../components/common/Kbd';
import { CollabStatus } from '../../collab/CollabStatus';

export function CanvasFooter() {
  const sheet = useActiveSheet();
  const provider = useStore((s) => s.defaultProvider);

  // P3 will replace this with the real detected-variables count.
  const blockCount = sheet?.blocks.length ?? 0;

  return (
    <Footer>
      <div
        className="flex items-center gap-3 px-3 h-8 ml-2 text-xs text-fg-muted
                   bg-surface-glass border border-border rounded-md backdrop-blur-sm"
      >
        <span>{blockCount} block{blockCount === 1 ? '' : 's'}</span>
        <span className="opacity-30">·</span>
        <span>
          AI: <span className="text-fg-2">{provider ?? 'none'}</span>
        </span>
        <span className="opacity-30">·</span>
        <span className="flex items-center gap-1">
          <Kbd combo="$mod+K" /> commands
        </span>
        <CollabStatus />
      </div>
    </Footer>
  );
}
