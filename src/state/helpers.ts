// Pure helpers used by multiple slices.

import { nanoid } from 'nanoid';
import type { Sheet, Stroke } from './types';
import { segDistSq } from '../utils/shapeGeom';

/** Short, unguessable, URL-safe ID. */
export const uid = (): string => nanoid(10);

export function newSheet(name = 'Sheet 1'): Sheet {
  return {
    id: uid(),
    name,
    blocks: [],
    strokes: [],
    shapes: [],
    links: [],
    view: { panX: 0, panY: 0, zoom: 1 },
  };
}

/** Backfill defaults onto a Sheet that may have been persisted before
 *  shapes/links existed. Used by the persist migration. */
export function backfillSheet(s: Partial<Sheet> & { id: string; name: string }): Sheet {
  return {
    id: s.id,
    name: s.name,
    blocks: s.blocks ?? [],
    strokes: s.strokes ?? [],
    shapes: s.shapes ?? [],
    links: s.links ?? [],
    view: s.view ?? { panX: 0, panY: 0, zoom: 1 },
  };
}

// ----- stroke hit-test (drag-erase) ---------------------------------
export function strokeHitsPoint(
  s: Stroke,
  pt: [number, number],
  tolerance: number,
): boolean {
  const t2 = tolerance * tolerance;
  const pts = s.points;
  if (pts.length === 1) {
    const [ax, ay] = pts[0];
    return (ax - pt[0]) ** 2 + (ay - pt[1]) ** 2 < t2;
  }
  for (let i = 1; i < pts.length; i++) {
    if (segDistSq(pts[i - 1], pts[i], pt) < t2) return true;
  }
  return false;
}
