// Plain contentEditable text block. We keep the DOM in sync with external
// text changes via a ref so we don't reset the caret on every keystroke.

import { useEffect, useRef } from 'react';
import type { TextBlock as TextBlockData } from '../state/types';

interface Props {
  block: TextBlockData;
  fontSizePx: number;
  onChange: (text: string) => void;
}

export function TextBlock({ block, fontSizePx, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.textContent !== block.text) el.textContent = block.text;
  }, [block.text]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-placeholder="Write something…"
      style={{ fontSize: `${fontSizePx}px` }}
      className="min-w-[200px] min-h-[1.2em] outline-none whitespace-pre-wrap break-words text-fg"
      onInput={(e) => onChange(e.currentTarget.textContent ?? '')}
    />
  );
}
