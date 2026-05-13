// detectSpec — translates a math block's LaTeX into one of our PlotSpecs.
// Uses compute-engine for parsing so we share its MathJSON-walking
// primitives with the solver / variables modules.

import { ComputeEngine, type BoxedExpression } from '@cortex-js/compute-engine';
import type { PlotSpec } from './spec';

const ce = new ComputeEngine();

/** Returns a spec for the given math block, or null if it can't be plotted. */
export function detectSpec(latex: string): PlotSpec | null {
  const src = latex.trim();
  if (!src) return null;

  let expr: BoxedExpression;
  try {
    expr = ce.parse(src);
  } catch { return null; }

  // ----- equations: y = f(x), f(x) = ..., implicit -----
  if (expr.operator === 'Equal') {
    const [lhs, rhs] = expr.ops ?? [];
    if (!lhs || !rhs) return null;

    // y = <expr>?
    if (lhs.symbol === 'y' && rhs.unknowns?.every((u) => u === 'x')) {
      return { kind: 'function', expression: rhs.latex, variable: 'x', label: src };
    }
    // <expr> = y?
    if (rhs.symbol === 'y' && lhs.unknowns?.every((u) => u === 'x')) {
      return { kind: 'function', expression: lhs.latex, variable: 'x', label: src };
    }
    // f(x) = <expr>?
    if (lhs.operator === 'Function' || (lhs.ops && lhs.symbol === undefined)) {
      // Best-effort: take RHS as the function body (loses the param name).
      const unknowns = rhs.unknowns ?? [];
      if (unknowns.length === 1 && unknowns[0]) {
        return { kind: 'function', expression: rhs.latex, variable: unknowns[0], label: src };
      }
    }
    // Implicit fallback: F(x, y) = 0
    try {
      const diff = ce.box(['Subtract', lhs, rhs]);
      const unknowns = diff.unknowns ?? [];
      if (unknowns.includes('x') && unknowns.includes('y')) {
        return { kind: 'implicit', expression: diff.latex, label: src };
      }
    } catch { /* fall through */ }
  }

  // ----- bare expression in x → y = expr -----
  const unknowns = expr.unknowns ?? [];
  if (unknowns.length === 1 && unknowns[0] === 'x') {
    return { kind: 'function', expression: expr.latex, variable: 'x', label: `y = ${src}` };
  }

  return null;
}

/** Build a fast JS evaluator from a LaTeX expression + free variable name.
 *  Used by the JSXGraph adapter to plot each x. Returns a function that
 *  evaluates the expression at the given variable value; NaN on error. */
export function compileFunction(
  latexExpr: string,
  variable: string,
  substitutions?: Record<string, number>,
): (v: number) => number {
  let expr: BoxedExpression;
  try {
    expr = ce.parse(latexExpr);
  } catch {
    return () => NaN;
  }

  // Pre-assign substituted variables so we don't reassign per call.
  if (substitutions) {
    for (const [name, val] of Object.entries(substitutions)) {
      try { ce.assign(name, val); } catch { /* skip */ }
    }
  }

  return (v: number) => {
    try {
      ce.assign(variable, v);
      const n = expr.N();
      const re = n.re;
      if (typeof re !== 'number' || !Number.isFinite(re)) return NaN;
      if ((n.im ?? 0) !== 0) return NaN;
      return re;
    } catch {
      return NaN;
    }
  };
}
