// Parametric shape entities — circles, rectangles, lines, arrows, triangles.
// Produced by the auto-shape recognizer when the user draws a recognizable
// shape with auto-shape mode enabled.

import type { AppSlice } from '../store';
import type { Shape } from '../types';
import { shapeHitsPoint } from '../../utils/shapeGeom';

export interface ShapesSlice {
  addShape: (shape: Shape) => void;
  /** Replace a stroke with a shape (recognizer output). */
  replaceStrokeWithShape: (strokeId: string, shape: Shape) => void;
  /** Drag-erase hit test against shapes. Returns true if any were removed. */
  eraseShapeAt: (pt: [number, number], tolerance: number) => boolean;
}

export const createShapesSlice: AppSlice<ShapesSlice> = (set) => ({
  addShape: (shape) => set((s) => {
    s.sheets[s.activeSheetId].shapes.push(shape);
  }),

  replaceStrokeWithShape: (strokeId, shape) => set((s) => {
    const sh = s.sheets[s.activeSheetId];
    sh.strokes = sh.strokes.filter((st) => st.id !== strokeId);
    sh.shapes.push(shape);
  }),

  eraseShapeAt: (pt, tolerance) => {
    let removed = false;
    set((s) => {
      const sh = s.sheets[s.activeSheetId];
      const before = sh.shapes.length;
      sh.shapes = sh.shapes.filter((sp) => !shapeHitsPoint(sp, pt, tolerance));
      removed = sh.shapes.length !== before;
    });
    return removed;
  },
});
