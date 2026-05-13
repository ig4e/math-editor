import { useEffect, useRef } from 'react';
import type { TextBlock as TextBlockData } from '../state/types';

interface Props {
  block: TextBlockData;
  fontSizePx: number;
  onChange: (text: string) => void;
}

export function TextBlock({ block, fontSizePx, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Keep DOM text in sync with external changes without nuking caret.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.textContent !== block.text) el.textContent = block.text;
  }, [block.text]);

  return (
    <div
      ref={ref}
      className="text-body"
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-placeholder="Write something…"
      style={{ fontSize: `${fontSizePx}px` }}
      onInput={(e) => onChange((e.currentTarget.textContent ?? ''))}
    />
  );
}
