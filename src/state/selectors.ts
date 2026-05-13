// Derived selectors. Anything returning an array/object derived inside the
// selector uses `useShallow` so consumers don't re-render on unrelated
// store mutations.

import { useShallow } from 'zustand/react/shallow';
import { useStore } from './store';
import type { Block, MathBlock } from './types';

// Primitives — no shallow needed, React's Object.is is fine
export const useActiveSheetId = () => useStore((s) => s.activeSheetId);
export const useTheme         = () => useStore((s) => s.theme);

/** Whole-sheet shorthand — primitive reference, fine without shallow. */
export const useActiveSheet = () =>
  useStore((s) => s.sheets[s.activeSheetId]);

/** Selection as Block objects (math + text mixed). */
export const useSelectedBlocks = () =>
  useStore(useShallow((s) => {
    const sh = s.sheets[s.activeSheetId];
    if (!sh) return [];
    return s.selectedIds
      .map((id) => sh.blocks.find((b) => b.id === id))
      .filter((b): b is Block => !!b);
  }));

/** Just the math blocks among the selection — used to decide "single vs system" solve. */
export const useSelectedMathBlocks = () =>
  useStore(useShallow((s) => {
    const sh = s.sheets[s.activeSheetId];
    if (!sh) return [];
    return s.selectedIds
      .map((id) => sh.blocks.find((b) => b.id === id))
      .filter((b): b is MathBlock => !!b && b.type === 'math');
  }));

/** Map of math-block id → human reference number (1, 2, 3…) in document order. */
export const useRefNumbers = () =>
  useStore(useShallow((s) => {
    const m: Record<string, number> = {};
    let n = 0;
    const sh = s.sheets[s.activeSheetId];
    if (!sh) return m;
    for (const b of sh.blocks) {
      if (b.type === 'math') m[b.id] = ++n;
    }
    return m;
  }));
