// Geometry utilities shared by the recognizer, the eraser hit-tests, and
// the link layer. All operate in world coordinates.

import type { Shape } from '../state/types';

// ---------- segment distance ----------------------------------------
export function segDistSq(
  [ax, ay]: [number, number],
  [bx, by]: [number, number],
  [px, py]: [number, number],
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  if (t < 0) t = 0; else if (t > 1) t = 1;
  const x = ax + t * dx;
  const y = ay + t * dy;
  return (px - x) ** 2 + (py - y) ** 2;
}

// ---------- shape hit-testing for the eraser ------------------------
export function shapeHitsPoint(
  s: Shape,
  [px, py]: [number, number],
  tolerance: number,
): boolean {
  const t2 = tolerance * tolerance;
  switch (s.kind) {
    case 'circle': {
      const d = Math.hypot(px - s.cx, py - s.cy) - s.r;
      return d * d < t2;
    }
    case 'rect': {
      // Distance to the closest edge of the rect outline
      const x2 = s.x + s.w, y2 = s.y + s.h;
      const edges: [[number, number], [number, number]][] = [
        [[s.x, s.y], [x2,  s.y]],
        [[x2,  s.y], [x2,  y2 ]],
        [[x2,  y2 ], [s.x, y2 ]],
        [[s.x, y2 ], [s.x, s.y]],
      ];
      return edges.some(([a, b]) => segDistSq(a, b, [px, py]) < t2);
    }
    case 'line':
    case 'arrow':
      return segDistSq([s.x1, s.y1], [s.x2, s.y2], [px, py]) < t2;
    case 'triangle': {
      const p = s.points;
      if (p.length !== 3) return false;
      return [
        segDistSq(p[0], p[1], [px, py]),
        segDistSq(p[1], p[2], [px, py]),
        segDistSq(p[2], p[0], [px, py]),
      ].some((d) => d < t2);
    }
  }
}

// ---------- general polyline helpers used by recognizer -------------
export function bbox(pts: [number, number][]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

export function pathLength(pts: [number, number][]) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return len;
}

export function centroid(pts: [number, number][]): [number, number] {
  let sx = 0, sy = 0;
  for (const [x, y] of pts) { sx += x; sy += y; }
  return [sx / pts.length, sy / pts.length];
}

/** True if the stroke is roughly closed (endpoint close to startpoint relative
 *  to the perimeter). */
export function isClosed(pts: [number, number][], tolerance = 0.2): boolean {
  if (pts.length < 4) return false;
  const start = pts[0];
  const end = pts[pts.length - 1];
  const gap = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const perim = pathLength(pts) || 1;
  return gap / perim < tolerance;
}
