// Renders the React contents of a math or text block inside an
// Excalidraw embeddable element. The wrapping element owns position,
// size, drag, zoom, scroll, select, undo, delete — Excalidraw handles
// all of it natively. This component only renders the math-field /
// contenteditable inside the bounds.
//
// `data-excalidraw-prevent-events` (Excalidraw's documented passthrough
// flag) is set on inputs that need to swallow pointer events so the
// canvas doesn't intercept typing.

import { memo, useCallback, useEffect, useRef } from 'react';
import type { MathfieldElement } from 'mathlive';
import { useStore } from '../../state/store';
import { useActiveSheet } from '../../state/selectors';
import type { MathBlock as MathBlockT, TextBlock as TextBlockT } from '../../state/types';
import { Icon } from '../../components/Icons';
import { cx } from '../../utils/cx';

interface Props {
  blockId: string;
  type: 'math' | 'text';
}

function BlockEmbedImpl({ blockId, type }: Props) {
  const sheet = useActiveSheet();
  const block = sheet?.blocks.find((b) => b.id === blockId);

  if (!block || block.type !== type) {
    return <div className="h-full w-full bg-surface rounded-md flex items-center justify-center text-fg-faint text-xs">block missing</div>;
  }

  return (
    <div
      className="js-block-embed h-full w-full flex flex-col rounded-md overflow-hidden bg-surface text-fg"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <Header block={block} />
      <div className="flex-1 min-h-0 overflow-auto">
        {block.type === 'math'
          ? <MathBody block={block} />
          : <TextBody block={block} />}
      </div>
      {block.showNote && block.note && (
        <div className="border-t border-border-soft px-2 py-1 text-[11px] italic text-fg-muted">
          {block.note}
        </div>
      )}
    </div>
  );
}

// ----- header -------------------------------------------------------

function Header({ block }: { block: MathBlockT | TextBlockT }) {
  const duplicate = useStore((s) => s.duplicateBlock);
  const remove = useStore((s) => s.deleteBlock);
  return (
    <header className="flex items-center gap-1 px-1.5 h-6 shrink-0 border-b border-border-soft bg-surface-2">
      <span className="text-[10px] font-mono text-fg-muted">
        {block.type === 'math' ? 'fx' : 'text'}
      </span>
      <span className="flex-1" />
      <HeaderButton icon="copy" label="Duplicate" onClick={() => duplicate(block.id)} />
      <HeaderButton icon="trash" label="Delete"   onClick={() => remove(block.id)} variant="danger" />
    </header>
  );
}

function HeaderButton({
  icon, label, onClick, variant,
}: { icon: 'copy' | 'trash'; label: string; onClick(): void; variant?: 'danger' }) {
  return (
    // eslint-disable-next-line no-restricted-syntax -- micro-affordance inside an Excalidraw embeddable; Tooltip would re-anchor on every drag
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

// ----- math body ----------------------------------------------------

function MathBody({ block }: { block: MathBlockT }) {
  const mfRef = useRef<MathfieldElement | null>(null);
  const updateBlock = useStore((s) => s.updateBlock);
  const setActive = useStore((s) => s.setActiveMathBlockId);

  useEffect(() => {
    const mf = mfRef.current;
    if (mf && mf.value !== block.latex) {
      mf.value = block.latex;
    }
  }, [block.latex]);

  const onInput = useCallback(() => {
    const mf = mfRef.current;
    if (!mf) return;
    if (mf.value !== block.latex) updateBlock(block.id, { latex: mf.value });
  }, [block.id, block.latex, updateBlock]);

  return (
    <div className="px-2 py-1 h-full" style={{ fontSize: block.fontSize }}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <math-field
        ref={mfRef as any}
        onInput={onInput}
        onFocus={() => setActive(block.id)}
        onBlur={() => setActive(null)}
        // Keep wheel/key events from bubbling to Excalidraw's canvas
        // when the user is interacting with the field.
        onWheel={(e: React.WheelEvent) => e.stopPropagation()}
        onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
        className="block w-full"
      >
        {block.latex}
      </math-field>
    </div>
  );
}

// ----- text body ----------------------------------------------------

function TextBody({ block }: { block: TextBlockT }) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const updateBlock = useStore((s) => s.updateBlock);

  useEffect(() => {
    const el = editorRef.current;
    if (el && el.textContent !== block.text) {
      el.textContent = block.text;
    }
  }, [block.text]);

  const onInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const next = el.textContent ?? '';
    if (next !== block.text) updateBlock(block.id, { text: next });
  }, [block.id, block.text, updateBlock]);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={onInput}
      onWheel={(e: React.WheelEvent) => e.stopPropagation()}
      onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
      data-placeholder="Text…"
      className="px-2 py-1 outline-none text-fg whitespace-pre-wrap min-h-[24px]"
      style={{ fontSize: block.fontSize }}
    >
      {block.text}
    </div>
  );
}

export const BlockEmbed = memo(BlockEmbedImpl);
