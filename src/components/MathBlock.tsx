// Thin wrapper around the <math-field> custom element.
// Keeps the latex value in sync via a ref (we don't pass it as a child
// because React would fight math-field's internal text node on updates).

import { useEffect, useRef } from 'react';
import type { MathfieldElement } from 'mathlive';
import type { MathBlock as MathBlockData } from '../state/types';

interface Props {
  block: MathBlockData;
  fontSizePx: number;
  onChange: (latex: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onEvaluateRequest: () => void;
}

export function MathBlock({
  block, fontSizePx, onChange, onFocus, onBlur, onEvaluateRequest,
}: Props) {
  const ref = useRef<MathfieldElement>(null);

  // Push external latex changes in without clobbering the cursor.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.value !== block.latex) el.value = block.latex;
  }, [block.latex]);

  return (
    <math-field
      ref={ref}
      style={{ display: 'block', fontSize: `${fontSizePx}px` }}
      onInput={(e) => onChange((e.currentTarget as MathfieldElement).value)}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          onEvaluateRequest();
        }
      }}
    />
  );
}
