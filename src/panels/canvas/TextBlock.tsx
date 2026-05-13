// Text block — contenteditable wrapper alongside MathBlock. Phase 7
// will optionally upgrade to a richer markdown editor; the v2 baseline
// is plain-text editing.

import { memo, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../../state/store';
import type { TextBlock as TextBlockT } from '../../state/types';
import { Icon } from '../../components/Icons';
import { cx } from '../../utils/cx';

interface Props {
  block: TextBlockT;
  selected: boolean;
}

function TextBlockImpl({ block, selected }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const updateBlock = useStore((s) => s.updateBlock);
  const deleteBlock = useStore((s) => s.deleteBlock);
  const duplicateBlock = useStore((s) => s.duplicateBlock);

  // Push store → DOM only when the value drifts (avoids caret jumps).
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
      className={cx(
        'js-textblock relative inline-flex flex-col gap-0.5 select-none pointer-events-auto',
        'rounded-md border bg-surface',
        selected ? 'border-selected shadow-card' : 'border-border',
      )}
      data-block-id={block.id}
      style={{ fontSize: block.fontSize }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <header className="flex items-center gap-1 px-1.5 h-6 border-b border-border-soft bg-surface-2 rounded-t-md">
        <span className="flex-1 text-[10px] text-fg-muted">text</span>
        <HeaderButton icon="copy" label="Duplicate" onClick={() => duplicateBlock(block.id)} />
        <HeaderButton icon="trash" label="Delete" onClick={() => deleteBlock(block.id)} variant="danger" />
      </header>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={onInput}
        data-placeholder="Text…"
        className="px-2 py-1 min-w-[120px] outline-none text-fg whitespace-pre-wrap"
      >
        {block.text}
      </div>
    </div>
  );
}

function HeaderButton({
  icon, label, onClick, variant,
}: { icon: 'copy' | 'trash'; label: string; onClick(): void; variant?: 'danger' }) {
  return (
    // eslint-disable-next-line no-restricted-syntax -- 20×20 micro-affordance inside a draggable block header; mirrors MathBlock
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

export const TextBlock = memo(TextBlockImpl);
