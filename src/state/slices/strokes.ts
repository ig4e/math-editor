// Strokes slice — pen tool draws strokes; eraseAt does drag-erase hit testing.

import type { AppSlice } from '../store';
import type { Stroke } from '../types';
import { strokeHitsPoint } from '../helpers';

export interface StrokesSlice {
  addStroke: (s: Stroke) => void;
  appendStrokePoint: (id: string, pt: [number, number]) => void;
  /** Returns true if any stroke was removed. */
  eraseAt: (pt: [number, number], tolerance: number) => boolean;
}

export const createStrokesSlice: AppSlice<StrokesSlice> = (set) => ({
  addStroke: (stroke) => set((s) => {
    s.sheets[s.activeSheetId].strokes.push(stroke);
  }),

  appendStrokePoint: (id, pt) => set((s) => {
    const st = s.sheets[s.activeSheetId].strokes.find((x) => x.id === id);
    if (!st) return;
    const last = st.points[st.points.length - 1];
    // Throttle: skip points closer than ~1.5 world units (avoids huge paths)
    if (last && Math.hypot(pt[0] - last[0], pt[1] - last[1]) < 1.5) return;
    st.points.push(pt);
  }),

  eraseAt: (pt, tolerance) => {
    let removed = false;
    set((s) => {
      const sh = s.sheets[s.activeSheetId];
      const before = sh.strokes.length;
      sh.strokes = sh.strokes.filter((st) => !strokeHitsPoint(st, pt, tolerance));
      removed = sh.strokes.length !== before;
    });
    return removed;
  },
});
