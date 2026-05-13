// Drops the quadratic formula on the first sheet of a fresh session so
// the app doesn't open empty.

import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { screenToWorld } from '../utils/geom';

export function useFirstRunStarter(viewportRef: React.RefObject<HTMLDivElement | null>) {
  const didStart = useRef(false);

  useEffect(() => {
    if (didStart.current) return;
    didStart.current = true;
    const s = useStore.getState();
    const sheet = s.sheets[s.activeSheetId];
    if (sheet.blocks.length > 0 || sheet.strokes.length > 0) return;

    const r = viewportRef.current?.getBoundingClientRect();
    if (!r) return;
    const [cx, cy] = screenToWorld(sheet.view, r, r.left + r.width / 2, r.top + r.height / 2);
    s.addMathBlock({
      latex: 'x = \\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}',
      x: cx - 180,
      y: cy - 40,
    });
  }, [viewportRef]);
}
