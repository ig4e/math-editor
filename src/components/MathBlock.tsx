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
  /** Receives the live element so the parent can call .getValue / .insert. */
  registerRef: (el: MathfieldElement | null) => void;
}

export function MathBlock({
  block,
  fontSizePx,
  onChange,
  onFocus,
  onBlur,
  onEvaluateRequest,
  registerRef,
}: Props) {
  const ref = useRef<MathfieldElement>(null);

  // Sync external latex changes into the element. We compare current
  // .value to avoid clobbering the user's cursor as they type.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.value !== block.latex) el.value = block.latex;
  }, [block.latex]);

  useEffect(() => {
    registerRef(ref.current);
    return () => registerRef(null);
  }, [registerRef]);

  // Initial latex is pushed in via the useEffect above — JSX child is empty
  // so React doesn't fight math-field's internal text node when value changes.
  return (
    <math-field
      ref={ref as any}
      style={{
        display: 'block',
        fontSize: `${fontSizePx}px`,
        border: 'none',
        outline: 'none',
        background: 'transparent',
      }}
      onInput={(e: React.SyntheticEvent<MathfieldElement>) => {
        onChange(e.currentTarget.value);
      }}
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
