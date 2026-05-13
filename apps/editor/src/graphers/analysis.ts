// Numerical analysis on plotted functions — roots / extrema /
// intersections. Used by the GraphPanel's right-click context menu.
//
// All algorithms are pure JS over the compiled `(x: number) => number`
// the grapher uses, so they work with any function the user can plot.

/** Bisection-with-Newton hybrid root finder over a uniform sample. */
export function findRoots(
  f: (x: number) => number,
  xMin: number,
  xMax: number,
  samples = 400,
): number[] {
  const step = (xMax - xMin) / samples;
  const roots: number[] = [];
  let prev = f(xMin);
  for (let i = 1; i <= samples; i++) {
    const x = xMin + step * i;
    const cur = f(x);
    if (!Number.isFinite(prev) || !Number.isFinite(cur)) { prev = cur; continue; }
    if (prev === 0) roots.push(x - step);
    if (prev * cur < 0) {
      // Refine with bisection
      let lo = x - step, hi = x, fLo = prev;
      for (let k = 0; k < 50; k++) {
        const mid = (lo + hi) / 2;
        const fMid = f(mid);
        if (!Number.isFinite(fMid)) break;
        if (Math.abs(fMid) < 1e-10 || (hi - lo) < 1e-10) {
          roots.push(mid);
          break;
        }
        if (fLo * fMid < 0) { hi = mid; }
        else                { lo = mid; fLo = fMid; }
      }
    }
    prev = cur;
  }
  // Deduplicate values within 1e-6.
  return dedupe(roots, 1e-6);
}

/** Local extrema via the same uniform sample (sign change in numerical derivative). */
export function findExtrema(
  f: (x: number) => number,
  xMin: number,
  xMax: number,
  samples = 400,
): { x: number; y: number; kind: 'max' | 'min' }[] {
  const h = (xMax - xMin) / samples;
  const ds: number[] = [];
  const xs: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = xMin + i * h;
    xs.push(x);
    ds.push((f(x + h) - f(x - h)) / (2 * h));
  }
  const result: { x: number; y: number; kind: 'max' | 'min' }[] = [];
  for (let i = 1; i < ds.length; i++) {
    const a = ds[i - 1];
    const b = ds[i];
    if (a === undefined || b === undefined) continue;
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (a * b < 0) {
      // Sign change in derivative → extremum near (xs[i-1] + xs[i]) / 2.
      const x = ((xs[i - 1] ?? 0) + (xs[i] ?? 0)) / 2;
      const y = f(x);
      result.push({ x, y, kind: a > 0 ? 'max' : 'min' });
    }
  }
  return dedupeBy(result, (r) => r.x, 1e-4);
}

/** Intersection x-values where f(x) ≈ g(x), via root-finding on (f-g). */
export function findIntersections(
  f: (x: number) => number,
  g: (x: number) => number,
  xMin: number,
  xMax: number,
  samples = 400,
): { x: number; y: number }[] {
  const xs = findRoots((x) => f(x) - g(x), xMin, xMax, samples);
  return xs.map((x) => ({ x, y: f(x) }));
}

// ----- helpers --------------------------------------------------------

function dedupe(xs: number[], eps: number): number[] {
  const sorted = [...xs].sort((a, b) => a - b);
  const out: number[] = [];
  for (const x of sorted) {
    const last = out[out.length - 1];
    if (last === undefined || Math.abs(x - last) > eps) out.push(x);
  }
  return out;
}

function dedupeBy<T>(xs: T[], key: (x: T) => number, eps: number): T[] {
  const sorted = [...xs].sort((a, b) => key(a) - key(b));
  const out: T[] = [];
  for (const x of sorted) {
    const last = out[out.length - 1];
    if (last === undefined || Math.abs(key(x) - key(last)) > eps) out.push(x);
  }
  return out;
}
