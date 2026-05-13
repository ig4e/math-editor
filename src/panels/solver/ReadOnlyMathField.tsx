// Read-only MathLive field — used to render solver results + steps.
// Wrapping <math-field readOnly> rather than convertLatexToMarkup keeps
// the rendered math interactive (copy-on-select, gestures) without
// allowing edits.

import { useEffect, useRef } from 'react';
import type { MathfieldElement } from 'mathlive';
import { cx } from '../../utils/cx';

interface Props {
  latex: string;
  inline?: boolean;
}

export function ReadOnlyMathField({ latex, inline }: Props) {
  const ref = useRef<MathfieldElement | null>(null);
  useEffect(() => {
    const mf = ref.current;
    if (mf && mf.value !== latex) mf.value = latex;
  }, [latex]);

  return (
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    <math-field
      ref={ref as any}
      read-only={true}
      className={cx('inline-block select-text', inline ? 'mx-1' : 'block w-full')}
    >
      {latex}
    </math-field>
  );
}
