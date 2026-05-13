// compute-engine has one global symbol table per CE instance, so building
// multi-variable evaluators with assign/forget per call serialises poorly.
// For 3D plotting (surface = N×N samples, parametric surface = same) we
// need a faster path.
//
// Strategy: parse once, walk the MathJSON tree once, emit a closure that
// looks up free symbols from a `vars: Record<string, number>` argument.
// This handles +, -, *, /, ^, and the common transcendentals (sin, cos,
// tan, log, ln, exp, sqrt, abs). Anything else falls back to compute-
// engine's slow path.
//
// Tested via the graphers/__tests__/compileMulti.test.ts round-trips
// (added with P5).

import { ComputeEngine, type BoxedExpression } from '@cortex-js/compute-engine';

const ce = new ComputeEngine();

export type MultiFn = (vars: Record<string, number>) => number;

export function compileMulti(latex: string): MultiFn {
  let expr: BoxedExpression;
  try {
    expr = ce.parse(latex);
  } catch {
    return () => NaN;
  }
  try {
    return walk(expr);
  } catch {
    // Fallback: assign every var, eval, forget — slow but correct.
    return (vars) => {
      const names = Object.keys(vars);
      for (const n of names) {
        try { ce.assign(n, vars[n]!); } catch { /* skip */ }
      }
      try {
        const n = expr.N();
        const re = n.re;
        return typeof re === 'number' && Number.isFinite(re) && (n.im ?? 0) === 0 ? re : NaN;
      } finally {
        for (const n of names) {
          try { ce.forget(n); } catch { /* skip */ }
        }
      }
    };
  }
}

// ----- walker -----

const UNARY: Record<string, (x: number) => number> = {
  Sin: Math.sin, Cos: Math.cos, Tan: Math.tan,
  ArcSin: Math.asin, ArcCos: Math.acos, ArcTan: Math.atan,
  Sinh: Math.sinh, Cosh: Math.cosh, Tanh: Math.tanh,
  Ln: Math.log, Log: Math.log10, Exp: Math.exp,
  Sqrt: Math.sqrt, Abs: Math.abs,
  Negate: (x) => -x, Floor: Math.floor, Ceiling: Math.ceil,
};

function walk(expr: BoxedExpression): MultiFn {
  // Numeric literal
  if (expr.isNumberLiteral) {
    const v = expr.re ?? NaN;
    return () => v;
  }
  // Bare symbol
  if (expr.symbol) {
    const name = expr.symbol;
    if (name === 'Pi') return () => Math.PI;
    if (name === 'ExponentialE') return () => Math.E;
    return (vars) => vars[name] ?? NaN;
  }

  const head = expr.operator;
  const args = (expr.ops ?? []).map(walk);

  switch (head) {
    case 'Add':      return (v) => args.reduce((s, f) => s + f(v), 0);
    case 'Subtract': return (v) => (args[0]?.(v) ?? 0) - (args[1]?.(v) ?? 0);
    case 'Multiply': return (v) => args.reduce((s, f) => s * f(v), 1);
    case 'Divide':   return (v) => (args[0]?.(v) ?? NaN) / (args[1]?.(v) ?? NaN);
    case 'Power':    return (v) => Math.pow(args[0]?.(v) ?? NaN, args[1]?.(v) ?? NaN);
    case 'Square':   return (v) => { const x = args[0]?.(v) ?? NaN; return x * x; };
    case 'Root':     return (v) => Math.pow(args[0]?.(v) ?? NaN, 1 / (args[1]?.(v) ?? NaN));
  }

  if (head && head in UNARY) {
    const f = UNARY[head]!;
    return (v) => f(args[0]?.(v) ?? NaN);
  }

  throw new Error(`compileMulti: unsupported operator ${head}`);
}
