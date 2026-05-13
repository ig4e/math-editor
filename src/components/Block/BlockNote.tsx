// Margin-note row beneath the block body. contentEditable so users can
// type freely; the parent block owns the persisted value.

import { useEffect, useRef } from 'react';
import { escapeHtml } from '../../utils/text';

interface Props {
  text: string;
  fontSize: number;
  /** Focus on mount when the note was just opened with empty content. */
  autoFocus: boolean;
  onChange: (next: string) => void;
}

export function BlockNote({ text, fontSize, autoFocus, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Keep DOM text in sync with external changes without nuking caret.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.textContent !== text) el.textContent = text;
  }, [text]);

  useEffect(() => {
    if (autoFocus && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  }, [autoFocus]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder="Note…"
      style={{ fontSize: `${fontSize}px` }}
      className="border-t border-dashed border-border px-3 py-1.5
                 text-fg-muted italic outline-none whitespace-pre-wrap"
      onInput={(e) => onChange(e.currentTarget.textContent ?? '')}
      dangerouslySetInnerHTML={{ __html: escapeHtml(text) }}
    />
  );
}
