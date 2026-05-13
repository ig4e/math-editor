// Derives a live ref to whichever <math-field> currently has the caret.
// Keyed off store.activeMathBlockId (set by MathBlock's onFocus/onBlur),
// then resolves to the DOM element via querySelector. This avoids the
// per-render listener-leak that a callback-ref approach would have, and
// keeps the data flow uni-directional (store → ref, never ref → store).

import { useEffect, useRef } from 'react';
import type { MathfieldElement } from 'mathlive';
import { useStore } from '../state/store';

export function useActiveMathField() {
  const id  = useStore((s) => s.activeMathBlockId);
  const ref = useRef<MathfieldElement | null>(null);

  useEffect(() => {
    if (!id) { ref.current = null; return; }
    ref.current = document.querySelector(
      `.js-block[data-id="${id}"] math-field`,
    ) as MathfieldElement | null;
  }, [id]);

  return ref;
}
