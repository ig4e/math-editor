// World <-> screen conversions for the whiteboard.
// World coords are pan/zoom-independent (what we persist).
// Screen coords are pixel-positions inside the viewport, which is what
// pointer events give us via getBoundingClientRect().

import type { View } from '../state/types';

export function screenToWorld(
  view: View,
  rect: DOMRect,
  clientX: number,
  clientY: number,
): [number, number] {
  return [
    (clientX - rect.left - view.panX) / view.zoom,
    (clientY - rect.top - view.panY) / view.zoom,
  ];
}

/** Build a smooth SVG path from a polyline (raw lineTo segments). */
export function pointsToPath(pts: [number, number][], zoom: number): string {
  if (!pts.length) return '';
  if (pts.length === 1) {
    const [x, y] = pts[0];
    return `M ${x * zoom} ${y * zoom} l 0.01 0`;
  }
  let d = `M ${pts[0][0] * zoom} ${pts[0][1] * zoom}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0] * zoom} ${pts[i][1] * zoom}`;
  }
  return d;
}

export const clamp = (n: number, a: number, b: number) =>
  Math.max(a, Math.min(b, n));
