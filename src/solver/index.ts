// Wrapper around @cortex-js/compute-engine.
//
// Three operations:
//   solveExpr(latex)             — evaluate / simplify a single expression
//   solveEquation(latex)         — solve a single equation for its unknown(s)
//   solveSystem(latexes)         — solve a system of equations together
//
// The engine is instantiated once at module load (synchronous import means
// it's ready by the time any user clicks "Solve" — no more loading races).

import { ComputeEngine, type BoxedExpression } from '@cortex-js/compute-engine';

export const ce = new ComputeEngine();

export interface SolveResult {
  /** LaTeX of the result to render in a fresh block. */
  latex: string;
  /** Optional description shown as the block's note. */
  note?: string;
  /** True if the engine produced something we'd actually call a solution. */
  ok: boolean;
}

const FAIL = (msg: string): SolveResult => ({ latex: '', note: msg, ok: false });

/** Parse latex safely. Returns null on invalid input. */
function parse(latex: string): BoxedExpression | null {
  if (!latex || !latex.trim()) return null;
  try {
    const expr = ce.parse(latex);
    if (!expr || expr.isValid === false) return null;
    return expr;
  } catch {
    return null;
  }
}

function isEqual(expr: BoxedExpression): boolean {
  const op = (expr as any).operator ?? (expr as any).head;
  return op === 'Equal' || op === 'Equality';
}

function getUnknowns(expr: BoxedExpression): string[] {
  const u = (expr as any).unknowns;
  if (Array.isArray(u)) return u as string[];
  return [];
}

function exprLatex(x: BoxedExpression): string {
  // Prefer numerical form when it gives a clean number
  try {
    const n = x.N();
    if (n && n.isValid !== false && n.isNumber) return n.latex;
  } catch { /* ignore */ }
  return x.latex;
}

// ---------- single expression: simplify + numerically evaluate ----------
export function solveExpr(latex: string): SolveResult {
  const expr = parse(latex);
  if (!expr) return FAIL('Could not parse');

  if (isEqual(expr)) return solveEquation(latex);

  try {
    const simplified = expr.simplify();
    return { latex: exprLatex(simplified), ok: true };
  } catch {
    return FAIL('Could not evaluate');
  }
}

// ---------- single equation ----------
export function solveEquation(latex: string): SolveResult {
  const expr = parse(latex);
  if (!expr) return FAIL('Could not parse');
  if (!isEqual(expr)) return solveExpr(latex);

  const unknowns = getUnknowns(expr);
  if (unknowns.length === 0) {
    // Constant equation like `1 + 1 = 2` — simplify each side and compare
    try {
      const r = expr.simplify();
      return { latex: r.latex, ok: true };
    } catch {
      return FAIL('Could not simplify');
    }
  }

  try {
    const sols = (expr as any).solve(unknowns) as BoxedExpression[] | undefined;
    if (!sols || sols.length === 0) {
      return { latex: '\\text{no solution}', ok: true };
    }
    const v = unknowns[0];
    const text = sols
      .map((s) => `${v} = ${exprLatex(s)}`)
      .join(',\\quad ');
    return { latex: text, ok: true };
  } catch {
    return FAIL('Could not solve');
  }
}

// ---------- system of equations ----------
export function solveSystem(latexes: string[]): SolveResult {
  const exprs: BoxedExpression[] = [];
  for (const l of latexes) {
    const e = parse(l);
    if (!e) return FAIL(`Could not parse "${l}"`);
    if (!isEqual(e)) return FAIL('Each block must be an equation (use =)');
    exprs.push(e);
  }
  if (exprs.length === 0) return FAIL('No equations selected');

  // collect all unknowns across equations
  const unknownsSet = new Set<string>();
  for (const e of exprs) for (const u of getUnknowns(e)) unknownsSet.add(u);
  const unknowns = [...unknownsSet];
  if (unknowns.length === 0) return FAIL('No unknowns to solve for');

  try {
    // Wrap as List of equations and call solve()
    const system = (ce as any).function?.('List', exprs)
      ?? (ce as any).box?.(['List', ...exprs.map((e) => e.json)])
      ?? null;
    if (!system) return FAIL('Compute engine API mismatch');

    const sols = (system as BoxedExpression).solve(unknowns) as unknown;
    return formatSystemResult(sols, unknowns);
  } catch (err) {
    console.error(err);
    return FAIL('Could not solve the system');
  }
}

function formatSystemResult(sols: unknown, unknowns: string[]): SolveResult {
  if (!sols) return FAIL('No solution');

  // shape 1: array of objects (multiple solutions for nonlinear systems)
  if (Array.isArray(sols) && sols.length && typeof sols[0] === 'object'
      && !(sols[0] instanceof Object && (sols[0] as any).latex)) {
    const lines = (sols as Record<string, BoxedExpression>[]).map((sol, i) => {
      const parts = unknowns.map((v) => `${v} = ${exprLatex(sol[v])}`).join(',\\ ');
      return sols.length > 1 ? `\\text{solution ${i + 1}: }\\ ${parts}` : parts;
    });
    const body = lines.join('\\\\');
    return {
      latex: sols.length > 1 ? `\\begin{aligned}${body}\\end{aligned}` : body,
      ok: true,
    };
  }

  // shape 2: single object { x: BoxedExpression, y: BoxedExpression }
  if (sols && typeof sols === 'object' && !Array.isArray(sols)) {
    const m = sols as Record<string, BoxedExpression>;
    const parts = unknowns
      .filter((v) => v in m)
      .map((v) => `${v} = ${exprLatex(m[v])}`)
      .join(',\\quad ');
    return parts ? { latex: parts, ok: true } : FAIL('Empty solution');
  }

  // shape 3: array of BoxedExpressions (univariate roots)
  if (Array.isArray(sols) && unknowns.length === 1) {
    const v = unknowns[0];
    const text = (sols as BoxedExpression[])
      .map((s) => `${v} = ${exprLatex(s)}`)
      .join(',\\quad ');
    return { latex: text, ok: true };
  }

  return FAIL('Could not interpret solution');
}

// ---------- variable detection (for future "known values" intelligence) ----------
export function detectDefinition(latex: string): { name: string; value: BoxedExpression } | null {
  const expr = parse(latex);
  if (!expr || !isEqual(expr)) return null;
  const ops = (expr as any).ops as BoxedExpression[] | undefined;
  if (!ops || ops.length < 2) return null;
  const lhs = ops[0], rhs = ops[1];
  const sym = (lhs as any).symbol as string | undefined;
  if (!sym) return null;
  try {
    const n = rhs.N();
    if (n && n.isNumber) return { name: sym, value: n };
  } catch { /* not numeric */ }
  return null;
}
