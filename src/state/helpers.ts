// Pure helpers used by multiple slices.

import type { Sheet, Stroke } from './types';

export const uid = (): string => Math.random().toString(36).slice(2, 10);

export function newSheet(name = 'Sheet 1'): Sheet {
  return {
    id: uid(),
    name,
    blocks: [],
    strokes: [],
    view: { panX: 0, panY: 0, zoom: 1 },
  };
}

// ----- stroke geometry (used by eraseAt) ----------------------------
export function strokeHitsPoint(
  s: Stroke,
  [px, py]: [number, number],
  tolerance: number,
): boolean {
  const t2 = tolerance * tolerance;
  const pts = s.points;
  if (pts.length === 1) {
    const [ax, ay] = pts[0];
    return (ax - px) ** 2 + (ay - py) ** 2 < t2;
  }
  for (let i = 1; i < pts.length; i++) {
    if (segDistSq(pts[i - 1], pts[i], [px, py]) < t2) return true;
  }
  return false;
}

function segDistSq(
  [ax, ay]: [number, number],
  [bx, by]: [number, number],
  [px, py]: [number, number],
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const x = ax + t * dx;
  const y = ay + t * dy;
  return (px - x) ** 2 + (py - y) ** 2;
}
