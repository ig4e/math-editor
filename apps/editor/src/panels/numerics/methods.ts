// Numerical methods registered as plain functions that yield iterates.
// Each method receives compiled f / f' / etc. closures + a parameter
// record and returns a Step list. The panel renders the table, the
// convergence chart, and a "send to graph" handle that plots the
// trajectory.

import { compileFunction } from '../../graphers/detectSpec';

export interface IterateStep {
  /** Iteration index (0-based). */
  n: number;
  /** Primary value (x_n for root-finders, y_n for ODE methods). */
  x: number;
  /** Secondary value (f(x_n) for root finders, t for ODE). */
  y?: number;
  /** Optional residual / error estimate. */
  residual?: number;
}

export interface MethodResult {
  ok: boolean;
  steps: IterateStep[];
  converged: boolean;
  finalValue?: number;
  error?: string;
  /** Latex of the answer for "pin to canvas". */
  latex?: string;
}

export interface NumericMethod {
  id: string;
  label: string;
  category: 'Root finding' | 'ODE' | 'Integration' | 'Optimization' | 'Signal';
  /** Field schema for the parameter form. */
  params: ReadonlyArray<{ key: string; label: string; type: 'expr' | 'number' | 'int'; default?: string | number }>;
  run(values: Record<string, string | number>): MethodResult;
}

// ----- helpers --------------------------------------------------------

const EPS = 1e-10;
const MAX_ITERS = 200;

function fn(expr: string, variable: string): (x: number) => number {
  return compileFunction(expr, variable);
}

function numericDeriv(f: (x: number) => number): (x: number) => number {
  return (x) => (f(x + 1e-6) - f(x - 1e-6)) / 2e-6;
}

// ----- methods --------------------------------------------------------

const newton: NumericMethod = {
  id: 'newton', label: 'Newton', category: 'Root finding',
  params: [
    { key: 'f', label: 'f(x)', type: 'expr', default: 'x^2 - 2' },
    { key: 'x0', label: 'x₀', type: 'number', default: 1 },
    { key: 'tol', label: 'tolerance', type: 'number', default: 1e-9 },
  ],
  run(v) {
    const f = fn(String(v.f), 'x');
    const df = numericDeriv(f);
    const x0 = Number(v.x0);
    const tol = Number(v.tol);
    let x = x0;
    const steps: IterateStep[] = [];
    for (let n = 0; n < MAX_ITERS; n++) {
      const fx = f(x);
      steps.push({ n, x, y: fx });
      if (Math.abs(fx) < tol) {
        return { ok: true, steps, converged: true, finalValue: x, latex: `x \\approx ${x.toFixed(10)}` };
      }
      const dfx = df(x);
      if (Math.abs(dfx) < EPS) {
        return { ok: false, steps, converged: false, error: 'derivative ≈ 0' };
      }
      x = x - fx / dfx;
    }
    return { ok: false, steps, converged: false, error: 'max iterations' };
  },
};

const bisection: NumericMethod = {
  id: 'bisection', label: 'Bisection', category: 'Root finding',
  params: [
    { key: 'f', label: 'f(x)', type: 'expr', default: 'x^2 - 2' },
    { key: 'a', label: 'a', type: 'number', default: 0 },
    { key: 'b', label: 'b', type: 'number', default: 2 },
    { key: 'tol', label: 'tolerance', type: 'number', default: 1e-9 },
  ],
  run(v) {
    const f = fn(String(v.f), 'x');
    let a = Number(v.a), b = Number(v.b);
    const tol = Number(v.tol);
    if (f(a) * f(b) > 0) return { ok: false, steps: [], converged: false, error: 'f(a) and f(b) must have opposite signs' };
    const steps: IterateStep[] = [];
    for (let n = 0; n < MAX_ITERS; n++) {
      const m = (a + b) / 2;
      const fm = f(m);
      steps.push({ n, x: m, y: fm });
      if (Math.abs(fm) < tol || (b - a) / 2 < tol) {
        return { ok: true, steps, converged: true, finalValue: m, latex: `x \\approx ${m.toFixed(10)}` };
      }
      if (f(a) * fm < 0) b = m; else a = m;
    }
    return { ok: false, steps, converged: false, error: 'max iterations' };
  },
};

const secant: NumericMethod = {
  id: 'secant', label: 'Secant', category: 'Root finding',
  params: [
    { key: 'f', label: 'f(x)', type: 'expr', default: 'x^2 - 2' },
    { key: 'x0', label: 'x₀', type: 'number', default: 1 },
    { key: 'x1', label: 'x₁', type: 'number', default: 2 },
    { key: 'tol', label: 'tolerance', type: 'number', default: 1e-9 },
  ],
  run(v) {
    const f = fn(String(v.f), 'x');
    let a = Number(v.x0), b = Number(v.x1);
    const tol = Number(v.tol);
    const steps: IterateStep[] = [{ n: 0, x: a, y: f(a) }, { n: 1, x: b, y: f(b) }];
    for (let n = 2; n < MAX_ITERS; n++) {
      const fa = f(a), fb = f(b);
      if (Math.abs(fb - fa) < EPS) return { ok: false, steps, converged: false, error: 'denominator ≈ 0' };
      const c = b - fb * (b - a) / (fb - fa);
      const fc = f(c);
      steps.push({ n, x: c, y: fc });
      if (Math.abs(fc) < tol) return { ok: true, steps, converged: true, finalValue: c, latex: `x \\approx ${c.toFixed(10)}` };
      a = b; b = c;
    }
    return { ok: false, steps, converged: false, error: 'max iterations' };
  },
};

const euler: NumericMethod = {
  id: 'euler', label: "Euler's method", category: 'ODE',
  params: [
    { key: 'f', label: "f(t, y)", type: 'expr', default: 'y' },
    { key: 't0', label: 't₀', type: 'number', default: 0 },
    { key: 'y0', label: 'y₀', type: 'number', default: 1 },
    { key: 'h',  label: 'step h', type: 'number', default: 0.1 },
    { key: 'tf', label: 't_f', type: 'number', default: 1 },
  ],
  run(v) {
    const compile = (expr: string) => (t: number, y: number) =>
      compileFunction(expr, 'y', { t })(y);
    const f = compile(String(v.f));
    let t = Number(v.t0), y = Number(v.y0);
    const h = Number(v.h), tf = Number(v.tf);
    const steps: IterateStep[] = [{ n: 0, x: t, y }];
    let n = 1;
    while (t < tf - 1e-9 && n < MAX_ITERS * 5) {
      y = y + h * f(t, y);
      t = t + h;
      steps.push({ n: n++, x: t, y });
    }
    return { ok: true, steps, converged: true, finalValue: y, latex: `y(${tf.toFixed(3)}) \\approx ${y.toFixed(6)}` };
  },
};

const rk4: NumericMethod = {
  id: 'rk4', label: 'Runge-Kutta 4', category: 'ODE',
  params: [
    { key: 'f', label: 'f(t, y)', type: 'expr', default: 'y' },
    { key: 't0', label: 't₀', type: 'number', default: 0 },
    { key: 'y0', label: 'y₀', type: 'number', default: 1 },
    { key: 'h', label: 'step h', type: 'number', default: 0.1 },
    { key: 'tf', label: 't_f', type: 'number', default: 1 },
  ],
  run(v) {
    const compile = (expr: string) => (t: number, y: number) =>
      compileFunction(expr, 'y', { t })(y);
    const f = compile(String(v.f));
    let t = Number(v.t0), y = Number(v.y0);
    const h = Number(v.h), tf = Number(v.tf);
    const steps: IterateStep[] = [{ n: 0, x: t, y }];
    let n = 1;
    while (t < tf - 1e-9 && n < MAX_ITERS * 5) {
      const k1 = f(t, y);
      const k2 = f(t + h / 2, y + (h / 2) * k1);
      const k3 = f(t + h / 2, y + (h / 2) * k2);
      const k4 = f(t + h,     y + h * k3);
      y = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      t = t + h;
      steps.push({ n: n++, x: t, y });
    }
    return { ok: true, steps, converged: true, finalValue: y, latex: `y(${tf.toFixed(3)}) \\approx ${y.toFixed(6)}` };
  },
};

const trapezoid: NumericMethod = {
  id: 'trapezoid', label: 'Trapezoid rule', category: 'Integration',
  params: [
    { key: 'f', label: 'f(x)', type: 'expr', default: 'sin(x)' },
    { key: 'a', label: 'a', type: 'number', default: 0 },
    { key: 'b', label: 'b', type: 'number', default: Math.PI },
    { key: 'n', label: 'subdivisions', type: 'int', default: 100 },
  ],
  run(v) {
    const f = fn(String(v.f), 'x');
    const a = Number(v.a), b = Number(v.b), n = Math.max(1, Math.floor(Number(v.n)));
    const h = (b - a) / n;
    let sum = 0;
    const steps: IterateStep[] = [];
    for (let i = 0; i <= n; i++) {
      const x = a + i * h;
      const w = i === 0 || i === n ? 0.5 : 1;
      const fx = f(x);
      sum += w * fx;
      if (i % Math.max(1, Math.floor(n / 50)) === 0) {
        steps.push({ n: i, x, y: fx, residual: sum * h });
      }
    }
    const result = sum * h;
    return { ok: true, steps, converged: true, finalValue: result, latex: `\\int_a^b f \\approx ${result.toFixed(8)}` };
  },
};

const simpson: NumericMethod = {
  id: 'simpson', label: "Simpson's rule", category: 'Integration',
  params: [
    { key: 'f', label: 'f(x)', type: 'expr', default: 'sin(x)' },
    { key: 'a', label: 'a', type: 'number', default: 0 },
    { key: 'b', label: 'b', type: 'number', default: Math.PI },
    { key: 'n', label: 'subdivisions (even)', type: 'int', default: 100 },
  ],
  run(v) {
    const f = fn(String(v.f), 'x');
    const a = Number(v.a), b = Number(v.b);
    let n = Math.max(2, Math.floor(Number(v.n)));
    if (n % 2 !== 0) n++;
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    for (let i = 1; i < n; i++) sum += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
    const result = (h / 3) * sum;
    const steps: IterateStep[] = [{ n: 0, x: a, y: f(a) }, { n, x: b, y: f(b), residual: result }];
    return { ok: true, steps, converged: true, finalValue: result, latex: `\\int_a^b f \\approx ${result.toFixed(8)}` };
  },
};

const gradient: NumericMethod = {
  id: 'gradient-descent', label: 'Gradient descent', category: 'Optimization',
  params: [
    { key: 'f', label: 'f(x)', type: 'expr', default: '(x - 3)^2' },
    { key: 'x0', label: 'x₀', type: 'number', default: 0 },
    { key: 'lr', label: 'learning rate', type: 'number', default: 0.1 },
    { key: 'iters', label: 'iterations', type: 'int', default: 50 },
  ],
  run(v) {
    const f = fn(String(v.f), 'x');
    const df = numericDeriv(f);
    let x = Number(v.x0);
    const lr = Number(v.lr);
    const N = Math.max(1, Math.floor(Number(v.iters)));
    const steps: IterateStep[] = [];
    for (let n = 0; n < N; n++) {
      const fx = f(x);
      steps.push({ n, x, y: fx });
      const g = df(x);
      x = x - lr * g;
    }
    return { ok: true, steps, converged: true, finalValue: x, latex: `x \\approx ${x.toFixed(8)}` };
  },
};

const fft: NumericMethod = {
  id: 'fft', label: 'FFT (magnitude spectrum)', category: 'Signal',
  params: [
    { key: 'f', label: 'signal x(t)', type: 'expr', default: 'sin(2*pi*5*t) + 0.5*sin(2*pi*12*t)' },
    { key: 'N', label: 'sample count (power of 2)', type: 'int', default: 256 },
    { key: 'fs', label: 'sample rate', type: 'number', default: 64 },
  ],
  run(v) {
    const xt = (t: number) => compileFunction(String(v.f), 't')(t);
    let N = Math.max(2, Math.floor(Number(v.N)));
    // Round up to nearest power of two.
    N = 1 << Math.ceil(Math.log2(N));
    const fs = Number(v.fs);
    const re = new Float64Array(N);
    const im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = xt(i / fs);
    naiveFFT(re, im);
    const steps: IterateStep[] = [];
    for (let k = 0; k < N / 2; k++) {
      const mag = Math.hypot(re[k]!, im[k]!) / N;
      steps.push({ n: k, x: (k * fs) / N, y: mag });
    }
    const peakIdx = steps.reduce((p, s) => s.y! > (p.y ?? 0) ? s : p, steps[0]!);
    return { ok: true, steps, converged: true, finalValue: peakIdx.x, latex: `f_{\\text{peak}} \\approx ${peakIdx.x.toFixed(3)} \\text{ Hz}` };
  },
};

/** Cooley-Tukey, radix-2, in-place, naive. N must be a power of two. */
function naiveFFT(re: Float64Array, im: Float64Array): void {
  const N = re.length;
  // Bit-reverse permutation
  let j = 0;
  for (let i = 1; i < N; i++) {
    let bit = N >> 1;
    while (j & bit) { j ^= bit; bit >>= 1; }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j]!, re[i]!];
      [im[i], im[j]] = [im[j]!, im[i]!];
    }
  }
  for (let len = 2; len <= N; len <<= 1) {
    const half = len >> 1;
    const wRe = Math.cos(-2 * Math.PI / len);
    const wIm = Math.sin(-2 * Math.PI / len);
    for (let i = 0; i < N; i += len) {
      let cRe = 1, cIm = 0;
      for (let k = 0; k < half; k++) {
        const aRe = re[i + k]!, aIm = im[i + k]!;
        const bRe = re[i + k + half]! * cRe - im[i + k + half]! * cIm;
        const bIm = re[i + k + half]! * cIm + im[i + k + half]! * cRe;
        re[i + k] = aRe + bRe;
        im[i + k] = aIm + bIm;
        re[i + k + half] = aRe - bRe;
        im[i + k + half] = aIm - bIm;
        const nextRe = cRe * wRe - cIm * wIm;
        const nextIm = cRe * wIm + cIm * wRe;
        cRe = nextRe; cIm = nextIm;
      }
    }
  }
}

export const METHODS: readonly NumericMethod[] = [
  newton, bisection, secant, euler, rk4, trapezoid, simpson, gradient, fft,
];

export function getMethod(id: string): NumericMethod | undefined {
  return METHODS.find((m) => m.id === id);
}
