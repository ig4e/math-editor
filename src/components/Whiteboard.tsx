// Whiteboard composes the three layers (stroke / blocks / pen-capture)
// inside the world wrapper, plus the four gesture hooks that drive them.

import { useActiveSheet, useRefNumbers } from '../state/selectors';
import { useStore } from '../state/store';
import { usePanZoom }    from '../hooks/usePanZoom';
import { usePenTool }    from '../hooks/usePenTool';
import { useEraserTool } from '../hooks/useEraserTool';
import { cx } from '../utils/cx';

import { Block } from './Block/Block';
import { MarksLayer } from './MarksLayer';

interface Props {
  onEvaluateRequest: () => void;
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

export function Whiteboard({ onEvaluateRequest, viewportRef }: Props) {
  const sheet       = useActiveSheet();
  const tool        = useStore((s) => s.tool);
  const selectedIds = useStore((s) => s.selectedIds);
  const refNumbers  = useRefNumbers();

  const pan    = usePanZoom(viewportRef);
  const pen    = usePenTool(viewportRef);
  const eraser = useEraserTool(viewportRef);

  const isDrawing = tool === 'pen' || tool === 'eraser';

  return (
    <div
      ref={viewportRef}
      onPointerDown={pan.onPointerDown}
      onPointerMove={pan.onPointerMove}
      onPointerUp={pan.onPointerUp}
      onPointerCancel={pan.onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
      className={cx(
        'absolute inset-0 canvas-dots touch-none overflow-hidden',
        tool === 'move' ? 'cursor-default' : 'cursor-crosshair',
      )}
    >
      {/* World wrapper — translate only. Zoom is baked into each child's
          pixel sizes so MathLive (and SVG strokes) re-layout crisply. */}
      <div
        className="absolute top-0 left-0 w-0 h-0 will-change-transform"
        style={{
          transform: `translate3d(${sheet.view.panX}px, ${sheet.view.panY}px, 0)`,
        }}
      >
        <MarksLayer />
        <div className="absolute left-0 top-0">
          {sheet.blocks.map((b) => (
            <Block
              key={b.id}
              block={b}
              selected={selectedIds.includes(b.id)}
              refNumber={refNumbers[b.id] ?? null}
              viewportRef={viewportRef}
              onEvaluateRequest={onEvaluateRequest}
            />
          ))}
        </div>
      </div>

      {/* Capture layer for pen + eraser. Sitting above blocks (z-5) means
          drawing always wins, even over a math-field. */}
      {isDrawing && (
        <div
          data-export-ignore="true"
          onPointerDown={tool === 'pen' ? pen.onPointerDown : eraser.onPointerDown}
          onPointerMove={tool === 'pen' ? pen.onPointerMove : eraser.onPointerMove}
          onPointerUp={tool === 'pen' ? pen.onPointerUp : eraser.onPointerUp}
          onPointerCancel={tool === 'pen' ? pen.onPointerUp : eraser.onPointerUp}
          className="absolute inset-0 z-[5] cursor-crosshair touch-none"
        />
      )}
    </div>
  );
}
