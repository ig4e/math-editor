import { useCallback, useEffect, useRef } from 'react';
import type { MathfieldElement } from 'mathlive';
import { useStore } from '../state/store';
import type { Block as BlockData } from '../state/types';
import { Icon } from './Icons';
import { MathBlock } from './MathBlock';
import { TextBlock } from './TextBlock';
import { screenToWorld } from '../utils/geom';

interface BlockProps {
  block: BlockData;
  selected: boolean;
  /** Label number for math blocks; null for text. */
  refNumber: number | null;
  /** Register live <math-field> element. */
  onMathFieldRef: (el: MathfieldElement | null) => void;
  onEvaluateRequest: () => void;
}

export function Block({
  block, selected, refNumber, onMathFieldRef, onEvaluateRequest,
}: BlockProps) {
  const view          = useStore((s) => s.sheets[s.activeSheetId].view);
  const tool          = useStore((s) => s.tool);
  const setSelection  = useStore((s) => s.setSelection);
  const toggleSelected= useStore((s) => s.toggleSelected);
  const moveBlock     = useStore((s) => s.moveBlock);
  const updateBlock   = useStore((s) => s.updateBlock);
  const setShowNote   = useStore((s) => s.setShowNote);
  const deleteBlock   = useStore((s) => s.deleteBlock);
  const duplicateBlock= useStore((s) => s.duplicateBlock);
  const setActiveMath = useStore((s) => s.setActiveMathBlockId);
  const toast         = useStore((s) => s.toast);

  // Position & font-size in *screen pixels*. Recomputed on every zoom so
  // the math-field re-lays out at proper size (no rasterization blur).
  const left      = block.x * view.zoom;
  const top       = block.y * view.zoom;
  const fontSize  = block.fontSize * view.zoom;

  // ---------- drag to move ----------
  const dragRef = useRef<{
    pointerId: number; dx: number; dy: number; viewport: DOMRect;
  } | null>(null);

  const onHeaderDown = (e: React.PointerEvent) => {
    if (tool !== 'move') return;
    // Selection logic on header click.
    if (e.shiftKey || e.ctrlKey || e.metaKey) toggleSelected(block.id);
    else if (!selected) setSelection([block.id]);

    const viewport = (e.currentTarget.closest('.viewport') as HTMLElement)?.getBoundingClientRect();
    if (!viewport) return;
    const [wx, wy] = screenToWorld(view, viewport, e.clientX, e.clientY);
    dragRef.current = {
      pointerId: e.pointerId,
      dx: wx - block.x,
      dy: wy - block.y,
      viewport,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.stopPropagation();
  };
  const onHeaderMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const [wx, wy] = screenToWorld(view, d.viewport, e.clientX, e.clientY);
    moveBlock(block.id, Math.round(wx - d.dx), Math.round(wy - d.dy));
  };
  const onHeaderUp = (e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  // ---------- resize ----------
  const resizeRef = useRef<{
    pointerId: number; startFs: number; startClient: [number, number];
  } | null>(null);

  const onResizeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      pointerId: e.pointerId,
      startFs: block.fontSize,
      startClient: [e.clientX, e.clientY],
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: React.PointerEvent) => {
    const r = resizeRef.current;
    if (!r || e.pointerId !== r.pointerId) return;
    // Average X+Y drag to feel natural in any direction.
    const delta = ((e.clientX - r.startClient[0]) + (e.clientY - r.startClient[1])) / 2;
    // Scale factor independent of current zoom so resize feels consistent.
    const next = Math.max(10, Math.min(80, r.startFs + delta / Math.max(view.zoom, 0.5) * 0.25));
    updateBlock(block.id, { fontSize: Math.round(next * 10) / 10 });
  };
  const onResizeUp = (e: React.PointerEvent) => {
    if (resizeRef.current?.pointerId === e.pointerId) resizeRef.current = null;
  };

  // ---------- label / note / actions ----------
  const onCopyRef = useCallback(() => {
    if (refNumber == null) return;
    navigator.clipboard?.writeText(`(${refNumber})`);
    toast(`Copied reference (${refNumber})`, 'success');
  }, [refNumber, toast]);

  const onToggleNote = () => setShowNote(block.id, !block.showNote);

  // Note focusing
  const noteRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (block.showNote && noteRef.current && document.activeElement !== noteRef.current) {
      // Let the user start typing immediately when they open the note.
      if (block.note === '') noteRef.current.focus();
    }
  }, [block.showNote, block.note]);

  // Click anywhere on the body selects (without dragging) for non-math edits.
  const onBodyDown = (e: React.PointerEvent) => {
    if (tool !== 'move') return;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      toggleSelected(block.id);
      e.preventDefault();
    } else if (!selected) {
      setSelection([block.id]);
    }
  };

  return (
    <div
      className={`block ${selected ? 'block--selected' : ''}`}
      data-id={block.id}
      style={{
        left,
        top,
        // Per-block scaling lives in fontSize / per-element pixel sizes —
        // intentionally no `transform: scale()` here so MathLive re-renders crisp.
      }}
      onPointerDown={onBodyDown}
    >
      <div
        className="block-head"
        onPointerDown={onHeaderDown}
        onPointerMove={onHeaderMove}
        onPointerUp={onHeaderUp}
        onPointerCancel={onHeaderUp}
      >
        {block.type === 'math' && refNumber != null ? (
          <button
            className="block-label"
            onClick={onCopyRef}
            title="Click to copy reference"
          >
            ({refNumber})
          </button>
        ) : (
          <span className="block-label block-label--text">
            <Icon name="text" />
          </span>
        )}
        <span className="block-spacer" />
        <button onClick={onToggleNote} title="Toggle note">
          <Icon name="note" />
        </button>
        <button onClick={() => duplicateBlock(block.id)} title="Duplicate">
          <Icon name="copy" />
        </button>
        <button onClick={() => deleteBlock(block.id)} title="Delete">
          <Icon name="close" />
        </button>
      </div>

      <div className="block-body">
        {block.type === 'math' ? (
          <MathBlock
            block={block}
            fontSizePx={fontSize}
            registerRef={onMathFieldRef}
            onChange={(latex) => updateBlock(block.id, { latex })}
            onFocus={() => setActiveMath(block.id)}
            onBlur={() => {
              // Don't clear immediately — clicking a toolbar button blurs first.
              // The toolbar suppresses focus-steal via pointerdown preventDefault,
              // so blur only fires for "real" focus changes elsewhere.
              setActiveMath(null);
            }}
            onEvaluateRequest={onEvaluateRequest}
          />
        ) : (
          <TextBlock
            block={block}
            fontSizePx={fontSize}
            onChange={(text) => updateBlock(block.id, { text })}
          />
        )}
      </div>

      {block.showNote && (
        <div
          ref={noteRef}
          className="block-note"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Note…"
          style={{ fontSize: `${Math.max(11, fontSize * 0.6)}px` }}
          onInput={(e) =>
            updateBlock(block.id, {
              note: e.currentTarget.textContent ?? '',
            })
          }
          dangerouslySetInnerHTML={{ __html: escapeHtml(block.note) }}
        />
      )}

      {/* resize handle — bottom-right corner. data-export-ignore hides it from PNG. */}
      <div
        className="block-resize"
        data-export-ignore="true"
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        onPointerCancel={onResizeUp}
        title="Drag to resize"
        aria-label="Resize"
      >
        <Icon name="resize" />
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
