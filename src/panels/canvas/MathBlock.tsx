// A single math block — a MathLive <math-field> wrapped in our chrome.
// Positioning is owned by the parent MathOverlay (it computes viewport
// coords from the block's scene-coords via Excalidraw's transform). Drag
// is owned by Excalidraw via the anchor rectangle (see anchors.ts).

import { memo, useCallback, useEffect, useRef } from 'react';
import type { MathfieldElement } from 'mathlive';
import { useStore } from '../../state/store';
import type { MathBlock as MathBlockT } from '../../state/types';
import { Icon } from '../../components/Icons';
import { cx } from '../../utils/cx';

interface Props {
  block: MathBlockT;
  selected: boolean;
  refNumber: number | null;
}

function MathBlockImpl({ block, selected, refNumber }: Props) {
  const mfRef = useRef<MathfieldElement | null>(null);

  const updateBlock = useStore((s) => s.updateBlock);
  const deleteBlock = useStore((s) => s.deleteBlock);
  const duplicateBlock = useStore((s) => s.duplicateBlock);
  const setActive = useStore((s) => s.setActiveMathBlockId);

  // Reflect store latex onto the MathField when it changes externally
  // (e.g. AI rewrite, undo, paste-replace).
  useEffect(() => {
    const mf = mfRef.current;
    if (mf && mf.value !== block.latex) {
      mf.value = block.latex;
    }
  }, [block.latex]);

  const onInput = useCallback(() => {
    const mf = mfRef.current;
    if (!mf) return;
    if (mf.value !== block.latex) {
      updateBlock(block.id, { latex: mf.value });
    }
  }, [block.id, block.latex, updateBlock]);

  // Stop pointer events from bubbling to Excalidraw underneath — the
  // math field handles its own clicks. (Excalidraw still sees mousedown
  // outside the block via its own canvas listener.)
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className={cx(
        'js-mathblock relative inline-flex flex-col gap-0.5 select-none pointer-events-auto',
        'rounded-md border bg-surface',
        selected ? 'border-selected shadow-card' : 'border-border',
        'transition-[border-color] duration-100',
      )}
      data-block-id={block.id}
      style={{ fontSize: block.fontSize }}
      onPointerDown={onPointerDown}
    >
      <header className="flex items-center gap-1 px-1.5 h-6 border-b border-border-soft bg-surface-2 rounded-t-md">
        {refNumber !== null && (
          <span className="text-[10px] font-mono text-fg-muted">({refNumber})</span>
        )}
        <span className="flex-1" />
        <HeaderButton
          icon="copy"
          label="Duplicate"
          onClick={() => duplicateBlock(block.id)}
        />
        <HeaderButton
          icon="trash"
          label="Delete"
          onClick={() => deleteBlock(block.id)}
          variant="danger"
        />
      </header>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <math-field
        ref={mfRef as any}
        onInput={onInput}
        onFocus={() => setActive(block.id)}
        onBlur={(e: React.FocusEvent) => {
          // Don't drop active when focus shifts to a header button inside
          // the same block.
          if (!(e.currentTarget.parentElement?.contains(e.relatedTarget as Node))) {
            setActive(null);
          }
        }}
        className="px-2 py-1"
      >
        {block.latex}
      </math-field>
    </div>
  );
}

function HeaderButton({
  icon, label, onClick, variant,
}: { icon: 'copy' | 'trash'; label: string; onClick(): void; variant?: 'danger' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cx(
        'inline-flex items-center justify-center w-5 h-5 rounded',
        variant === 'danger'
          ? 'text-fg-muted hover:bg-danger/15 hover:text-danger'
          : 'text-fg-muted hover:bg-surface hover:text-fg',
      )}
    >
      <Icon name={icon} className="w-3 h-3" />
    </button>
  );
}

export const MathBlock = memo(MathBlockImpl);
