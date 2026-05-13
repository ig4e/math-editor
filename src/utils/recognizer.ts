// Shape recognizer: takes a freehand stroke and tries to classify it as one
// of five primitives (circle, rect, triangle, line, arrow). Geometric and
// deterministic — small enough that pulling in a heavy gesture-recognition
// library wouldn't pay off.
//
// Returns the synthesized Shape or null when no candidate is confident enough.

import type { Shape, Stroke } from '../state/types';
import {
  bbox, centroid, isClosed, pathLength,
} from './shapeGeom';
import { uid } from '../state/helpers';

interface RecognizeOptions {
  /** Strokes shorter than this are ignored (likely a stray tap). */
  minLength?: number;
}

export function recognize(stroke: Stroke, opts: RecognizeOptions = {}): Shape | null {
  const pts = stroke.points;
  const minLength = opts.minLength ?? 30;
  const len = pathLength(pts);
  if (len < minLength || pts.length < 4) return null;

  const box = bbox(pts);
  const size = Math.max(box.w, box.h) || 1;
  const closed = isClosed(pts);
  const meta: ShapeMeta = { stroke, pts, box, size, len, closed };

  // Try line and arrow first (they're open). For closed strokes, try
  // circle / rect / triangle.
  if (!closed) {
    return recognizeLine(meta) ?? recognizeArrow(meta);
  }
  return recognizeCircle(meta) ?? recognizeRect(meta) ?? recognizeTriangle(meta);
}

interface ShapeMeta {
  stroke: Stroke;
  pts: [number, number][];
  box: ReturnType<typeof bbox>;
  size: number;
  len: number;
  closed: boolean;
}

// ---------- Circle ---------------------------------------------------
// A stroke is a circle if the variance of point-to-centroid distances is
// small relative to the mean — i.e. all points sit roughly on the
// circumference of a circle.
function recognizeCircle(m: ShapeMeta): Shape | null {
  const [cx, cy] = centroid(m.pts);
  const dists = m.pts.map(([x, y]) => Math.hypot(x - cx, y - cy));
  const mean  = dists.reduce((a, b) => a + b, 0) / dists.length;
  const variance =
    dists.reduce((a, b) => a + (b - mean) ** 2, 0) / dists.length;
  const cov = Math.sqrt(variance) / (mean || 1);
  if (cov > 0.22) return null; // not circular enough
  return {
    id: uid(),
    kind: 'circle',
    color: m.stroke.color,
    width: m.stroke.width,
    cx, cy, r: mean,
  };
}

// ---------- Rectangle ------------------------------------------------
// Detect rectangles via "fill ratio": a true rectangle's perimeter
// closely matches 2·(w+h), and its area roughly fills its bbox.
function recognizeRect(m: ShapeMeta): Shape | null {
  const { box } = m;
  const idealPerim = 2 * (box.w + box.h);
  if (idealPerim < 1) return null;
  const ratio = m.len / idealPerim;
  // True rectangle: 0.9..1.25. Allow some slop because hand-drawn corners
  // add a bit of length and people don't lift the pen at corners.
  if (ratio < 0.85 || ratio > 1.4) return null;
  // Aspect-ratio sanity — accept anything that has both sides non-trivial.
  if (box.w < 8 || box.h < 8) return null;
  return {
    id: uid(),
    kind: 'rect',
    color: m.stroke.color,
    width: m.stroke.width,
    x: box.minX, y: box.minY, w: box.w, h: box.h,
  };
}

// ---------- Triangle -------------------------------------------------
// Find three "corner" points (local curvature maxima) and snap them.
function recognizeTriangle(m: ShapeMeta): Shape | null {
  const corners = findCorners(m.pts, 3);
  if (corners.length !== 3) return null;
  return {
    id: uid(),
    kind: 'triangle',
    color: m.stroke.color,
    width: m.stroke.width,
    points: corners,
  };
}

// ---------- Line -----------------------------------------------------
// A straight line: the deviation of points from the line through
// (start, end) is tiny relative to the line length.
function recognizeLine(m: ShapeMeta): Shape | null {
  const a = m.pts[0];
  const b = m.pts[m.pts.length - 1];
  const lineLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (lineLen < 20) return null;
  // Path should be ~as long as the chord (straight)
  if (m.len / lineLen > 1.25) return null;
  return {
    id: uid(),
    kind: 'line',
    color: m.stroke.color,
    width: m.stroke.width,
    x1: a[0], y1: a[1], x2: b[0], y2: b[1],
  };
}

// ---------- Arrow ----------------------------------------------------
// Arrow = a line with a small "head" at the end — detected as two
// extra direction reversals near the end of the stroke.
function recognizeArrow(m: ShapeMeta): Shape | null {
  const tailFrac = 0.2;
  const tailStart = Math.floor(m.pts.length * (1 - tailFrac));
  const head = m.pts.slice(tailStart);
  if (head.length < 4) return null;

  // For the bulk of the stroke (everything before the head), check it's
  // basically a line.
  const body = m.pts.slice(0, tailStart + 1);
  if (body.length < 2) return null;
  const a = body[0];
  const b = body[body.length - 1];
  const chord = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (chord < 25) return null;
  const bodyLen = pathLength(body);
  if (bodyLen / chord > 1.3) return null;

  // The head should turn back on itself — sum of |angle changes| is high
  const turn = totalTurning(head);
  if (turn < Math.PI * 0.7) return null;
  return {
    id: uid(),
    kind: 'arrow',
    color: m.stroke.color,
    width: m.stroke.width,
    x1: a[0], y1: a[1], x2: b[0], y2: b[1],
  };
}

// ---------- helpers --------------------------------------------------
function totalTurning(pts: [number, number][]) {
  let sum = 0;
  for (let i = 2; i < pts.length; i++) {
    const a = pts[i - 2], b = pts[i - 1], c = pts[i];
    const v1x = b[0] - a[0], v1y = b[1] - a[1];
    const v2x = c[0] - b[0], v2y = c[1] - b[1];
    const a1 = Math.atan2(v1y, v1x);
    const a2 = Math.atan2(v2y, v2x);
    let d = a2 - a1;
    while (d >  Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    sum += Math.abs(d);
  }
  return sum;
}

/**
 * Pick the N most prominent corner points from a closed polyline. We score
 * each interior point by the angle change between (i−window, i) and
 * (i, i+window). High score = sharper corner.
 */
function findCorners(pts: [number, number][], n: number): [number, number][] {
  const N = pts.length;
  if (N < 8) return [];
  const window = Math.max(3, Math.floor(N / 10));
  const scores: number[] = new Array(N).fill(0);
  for (let i = window; i < N - window; i++) {
    const a = pts[i - window], b = pts[i], c = pts[i + window];
    const v1x = b[0] - a[0], v1y = b[1] - a[1];
    const v2x = c[0] - b[0], v2y = c[1] - b[1];
    const a1 = Math.atan2(v1y, v1x);
    const a2 = Math.atan2(v2y, v2x);
    let d = a2 - a1;
    while (d >  Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    scores[i] = Math.abs(d);
  }
  // Non-max suppression: pick the top-N with min separation
  const ordered = scores
    .map((s, i) => ({ s, i }))
    .filter((x) => x.s > 0.6)            // must be a real corner
    .sort((a, b) => b.s - a.s);
  const minGap = Math.max(window, Math.floor(N / (n * 2)));
  const picked: number[] = [];
  for (const { i } of ordered) {
    if (picked.every((p) => Math.abs(p - i) > minGap)) {
      picked.push(i);
      if (picked.length === n) break;
    }
  }
  if (picked.length !== n) return [];
  return picked.sort((a, b) => a - b).map((i) => pts[i]);
}
