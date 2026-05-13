// Shape recognizer.
//
// Strategy:
//   1) classify by whether the stroke is closed.
//   2) for closed strokes, count "corner" points (curvature peaks):
//        4 corners → rectangle (axis-aligned from bbox)
//        3 corners → triangle from those points
//        otherwise → check circularity, else give up
//   3) for open strokes, prefer arrow (head detected at either end) over
//      a plain line.
// Geometric and deterministic; small enough that a heavy gesture-recognition
// library wouldn't justify its cost.

import type { Shape, Stroke } from '../state/types';
import { bbox, centroid, isClosed, pathLength } from './shapeGeom';
import { uid } from '../state/helpers';

export function recognize(stroke: Stroke): Shape | null {
  const pts = stroke.points;
  if (pts.length < 4 || pathLength(pts) < 30) return null;
  const box = bbox(pts);
  if (Math.max(box.w, box.h) < 20) return null;

  if (!isClosed(pts)) {
    return tryArrow(stroke, pts) ?? tryLine(stroke, pts);
  }

  const corners = findCorners(pts);
  if (corners.length === 4) return makeRect(stroke, box);
  if (corners.length === 3) return makeTriangle(stroke, corners);
  // No polygonal corners → maybe a circle
  return tryCircle(stroke, pts);
}

// ---------- closed: rect / triangle / circle ------------------------

function makeRect(stroke: Stroke, box: ReturnType<typeof bbox>): Shape {
  return {
    id: uid(),
    kind: 'rect',
    color: stroke.color,
    width: stroke.width,
    x: box.minX, y: box.minY, w: box.w, h: box.h,
  };
}

function makeTriangle(stroke: Stroke, corners: [number, number][]): Shape {
  return {
    id: uid(),
    kind: 'triangle',
    color: stroke.color,
    width: stroke.width,
    points: corners,
  };
}

function tryCircle(stroke: Stroke, pts: [number, number][]): Shape | null {
  const [cx, cy] = centroid(pts);
  const dists = pts.map(([x, y]) => Math.hypot(x - cx, y - cy));
  const mean = dists.reduce((a, b) => a + b, 0) / dists.length;
  if (mean < 8) return null;
  const variance =
    dists.reduce((a, b) => a + (b - mean) ** 2, 0) / dists.length;
  const cov = Math.sqrt(variance) / mean;
  // Tight threshold so squiggly-but-not-circular shapes are rejected.
  // For reference: a perfect square's CoV is ~0.17, so we need < 0.15.
  if (cov > 0.14) return null;
  // Aspect-ratio sanity (bounding box should be nearly square)
  const box = bbox(pts);
  const ar = Math.max(box.w, box.h) / Math.max(1, Math.min(box.w, box.h));
  if (ar > 1.35) return null;
  return {
    id: uid(),
    kind: 'circle',
    color: stroke.color,
    width: stroke.width,
    cx, cy, r: mean,
  };
}

// ---------- open: arrow / line --------------------------------------

function tryLine(stroke: Stroke, pts: [number, number][]): Shape | null {
  const a = pts[0];
  const b = pts[pts.length - 1];
  const chord = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (chord < 20) return null;
  // Sum of segment lengths should be close to the chord — i.e. straight.
  if (pathLength(pts) / chord > 1.2) return null;
  return {
    id: uid(),
    kind: 'line',
    color: stroke.color,
    width: stroke.width,
    x1: a[0], y1: a[1], x2: b[0], y2: b[1],
  };
}

function tryArrow(stroke: Stroke, pts: [number, number][]): Shape | null {
  const N = pts.length;
  if (N < 10) return null;
  const tail = Math.max(4, Math.floor(N * 0.18));
  const endTurn   = totalTurning(pts.slice(-tail));
  const startTurn = totalTurning(pts.slice(0, tail));

  // Either end should have significantly more turning than a straight line.
  const HEAD_TURN = 1.3; // radians, ~75°
  const isHeadAtEnd   = endTurn   >= HEAD_TURN && endTurn   >  startTurn;
  const isHeadAtStart = startTurn >= HEAD_TURN && startTurn > endTurn;
  if (!isHeadAtEnd && !isHeadAtStart) return null;

  // The middle of the stroke should be roughly straight.
  const bodyStart = Math.floor(N * 0.18);
  const bodyEnd   = Math.floor(N * 0.82);
  const body = pts.slice(bodyStart, bodyEnd);
  if (body.length < 3) return null;
  const a = body[0];
  const b = body[body.length - 1];
  const chord = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (chord < 25) return null;
  if (pathLength(body) / chord > 1.4) return null;

  // Tail (no head) at one end, head at the other.
  const start = isHeadAtEnd ? pts[0]       : pts[N - 1];
  const end   = isHeadAtEnd ? pts[N - 1]   : pts[0];
  return {
    id: uid(),
    kind: 'arrow',
    color: stroke.color,
    width: stroke.width,
    x1: start[0], y1: start[1],
    x2: end[0],   y2: end[1],
  };
}

// ---------- corner finder ------------------------------------------
/**
 * Returns all "corner" points (curvature peaks above ~40°) with
 * non-maximum suppression. Hand-drawn polygons reliably yield 3/4 corners.
 */
function findCorners(pts: [number, number][]): [number, number][] {
  const N = pts.length;
  if (N < 8) return [];

  const w = Math.max(3, Math.floor(N / 14));
  const scores: number[] = new Array(N).fill(0);
  for (let i = w; i < N - w; i++) {
    scores[i] = Math.abs(turnAngle(pts[i - w], pts[i], pts[i + w]));
  }

  // Local maxima above 40° (0.7 rad)
  const THRESH = 0.7;
  const minSep = Math.max(w, Math.floor(N / 10));

  // Find peaks
  const peaks: number[] = [];
  for (let i = 0; i < N; i++) {
    if (scores[i] < THRESH) continue;
    let isMax = true;
    for (let j = Math.max(0, i - minSep); j <= Math.min(N - 1, i + minSep); j++) {
      if (j !== i && scores[j] > scores[i]) { isMax = false; break; }
    }
    if (isMax) peaks.push(i);
  }

  // Sort by score (strongest first) and cap at 6 (anything above is noise)
  peaks.sort((a, b) => scores[b] - scores[a]);
  const top = peaks.slice(0, 6).sort((a, b) => a - b);
  return top.map((i) => pts[i]);
}

// ---------- small geometry helpers ----------------------------------
function turnAngle(
  [ax, ay]: [number, number],
  [bx, by]: [number, number],
  [cx, cy]: [number, number],
): number {
  const v1x = bx - ax, v1y = by - ay;
  const v2x = cx - bx, v2y = cy - by;
  const a1 = Math.atan2(v1y, v1x);
  const a2 = Math.atan2(v2y, v2x);
  let d = a2 - a1;
  while (d >  Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function totalTurning(pts: [number, number][]): number {
  let sum = 0;
  for (let i = 2; i < pts.length; i++) {
    sum += Math.abs(turnAngle(pts[i - 2], pts[i - 1], pts[i]));
  }
  return sum;
}
