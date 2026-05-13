// Wrapper around @cortex-js/compute-engine.
//
// Public surface:
//   ce                              singleton compute engine
//   ingestDefinitions(blocks)       scan blocks for `var = number` and bind
//                                   the values into ce so other blocks see them
//   simplify(latex)                 simplify only (no numeric eval)
//   solveExpr(latex, { showSteps }) full smart solve: simplify, numeric, solve
//   solveSystem(latexes, opts)      solve a list of equations together
//   formatSteps(steps)              render an array of latex steps as
//                                   aligned multi-line LaTeX
//
// We lean on compute-engine for all the heavy lifting — parsing, simplification,
// solve, numeric evaluation. No re-implementation of CAS.

import { ComputeEngine, type BoxedExpression } from '@cortex-js/compute-engine';
import type { Block, MathBlock } from '../state/types';

export const ce = new ComputeEngine();

export interface Step {
  /** Short label shown to the left of the step ("simplify", "evaluate", …). */
  label: string;
  latex: string;
}

export interface SolveResult {
  /** Final LaTeX to drop into a new block. */
  latex: string;
  /** Optional explanatory note for the result block. */
  note?: string;
  /** Step-by-step derivation; populated when `showSteps` is true. */
  steps?: Step[];
  /** True if we produced anything that looks like a real result. */
  ok: boolean;
}

const FAIL = (msg: string): SolveResult => ({ latex: '', note: msg, ok: false });

// ---------- parsing helpers -----------------------------------------
// Note: we deliberately do NOT gate on `expr.isValid` here. Compute-engine
// marks many usable expressions as "invalid" (e.g. anything containing \pm)
// even though .simplify() / .solve() still work fine. Let the downstream
// operations decide whether the expression is salvageable.
function parse(latex: string): BoxedExpression | null {
  if (!latex || !latex.trim()) return null;
  try {
    const expr = ce.parse(latex);
    return expr ?? null;
  } catch (e) {
    console.warn('[solver] parse failed', { latex, error: e });
    return null;
  }
}

function isEqual(expr: BoxedExpression): boolean {
  const op = (expr as any).operator ?? (expr as any).head;
  return op === 'Equal' || op === 'Equality';
}

function getUnknowns(expr: BoxedExpression): string[] {
  const u = (expr as any).unknowns;
  return Array.isArray(u) ? u as string[] : [];
}

/** Stringify a BoxedExpression for display — prefers numeric form when
 *  the engine yields a clean number. */
function exprLatex(x: BoxedExpression | null | undefined): string {
  if (!x) return '';
  try {
    const n = x.N();
    if (n && n.isValid !== false && n.isNumber) return n.latex;
  } catch { /* ignore */ }
  return x.latex;
}

// ---------- variable definitions ------------------------------------
// Walk the active sheet and assign any `name = numericValue` math-blocks
// as known values in compute-engine. This is what makes `F = ma` "just work"
// when `m = 5; a = 9.8` are written elsewhere on the same sheet.

export interface Definition {
  name: string;
  latex: string;          // the right-hand side's latex
  numeric: number | null; // null if the RHS isn't a plain number
}

// Tracks the names we (this module) have assigned in the engine, so we can
// forget exactly those between solves rather than nuking all user definitions.
const ownAssignments = new Set<string>();

export function ingestDefinitions(blocks: Block[]): Definition[] {
  // Drop our previous assignments — deleted definition blocks should stop
  // affecting the engine.
  for (const name of ownAssignments) {
    try { (ce as any).forget?.(name); } catch { /* ignore */ }
  }
  ownAssignments.clear();

  const defs: Definition[] = [];
  for (const b of blocks) {
    if (b.type !== 'math') continue;
    const d = detectDefinition(b);
    if (!d) continue;
    try {
      const rhs = parse(d.latex);
      if (!rhs) continue;
      (ce as any).assign?.(d.name, rhs);
      ownAssignments.add(d.name);
      defs.push(d);
    } catch (e) {
      console.warn('[solver] could not bind variable', d.name, e);
    }
  }
  return defs;
}

/** Detect `name = …` patterns: top-level `Equal` where the LHS is a single
 *  symbol. Returns the binding info or null. */
export function detectDefinition(b: MathBlock): Definition | null {
  const expr = parse(b.latex);
  if (!expr || !isEqual(expr)) return null;
  const ops = (expr as any).ops as BoxedExpression[] | undefined;
  if (!ops || ops.length < 2) return null;
  const lhs = ops[0], rhs = ops[1];
  const sym = (lhs as any).symbol as string | undefined;
  if (!sym) return null;
  let numeric: number | null = null;
  try {
    const n = rhs.N();
    if (n && n.isNumber) numeric = Number((n as any).numericValue ?? n.latex) || null;
  } catch { /* not numeric */ }
  return { name: sym, latex: rhs.latex, numeric };
}

// ---------- simplify -------------------------------------------------
export function simplify(latex: string): SolveResult {
  const expr = parse(latex);
  if (!expr) return FAIL('Could not parse');
  try {
    const r = expr.simplify();
    return { latex: r.latex, ok: true };
  } catch {
    return FAIL('Could not simplify');
  }
}

// ---------- single expression / equation -----------------------------
export interface SolveOptions { showSteps?: boolean }

export function solveExpr(latex: string, opts: SolveOptions = {}): SolveResult {
  const expr = parse(latex);
  if (!expr) return FAIL('Could not parse');
  if (isEqual(expr)) return solveEquation(latex, opts);

  const steps: Step[] = [{ label: 'given', latex: expr.latex }];

  let simplified: BoxedExpression;
  try { simplified = expr.simplify(); }
  catch { return FAIL('Could not evaluate'); }

  if (simplified.latex !== expr.latex) {
    steps.push({ label: 'simplify', latex: simplified.latex });
  }

  let final = simplified;
  try {
    const n = simplified.N();
    if (n && n.isValid !== false && n.latex !== simplified.latex) {
      steps.push({ label: 'evaluate', latex: n.latex });
      final = n;
    }
  } catch { /* ignore numeric eval failure */ }

  return {
    latex: opts.showSteps && steps.length > 1
      ? formatSteps(steps)
      : exprLatex(final),
    steps: opts.showSteps ? steps : undefined,
    ok: true,
  };
}

export function solveEquation(latex: string, opts: SolveOptions = {}): SolveResult {
  const expr = parse(latex);
  if (!expr || !isEqual(expr)) return solveExpr(latex, opts);

  const unknowns = getUnknowns(expr);
  if (unknowns.length === 0) {
    try { return { latex: expr.simplify().latex, ok: true }; }
    catch { return FAIL('Could not simplify'); }
  }

  const steps: Step[] = [{ label: 'given', latex: expr.latex }];

  try {
    const sols = (expr as any).solve(unknowns) as BoxedExpression[] | undefined;
    if (!sols || sols.length === 0) {
      return { latex: '\\text{no solution}', ok: true };
    }
    const v = unknowns[0];
    const finalLatex = sols
      .map((s) => `${v} = ${exprLatex(s)}`)
      .join(',\\quad ');
    steps.push({ label: 'solve for ' + v, latex: finalLatex });

    return {
      latex: opts.showSteps ? formatSteps(steps) : finalLatex,
      steps: opts.showSteps ? steps : undefined,
      ok: true,
    };
  } catch {
    return FAIL('Could not solve');
  }
}

// ---------- system of equations --------------------------------------
export function solveSystem(latexes: string[], opts: SolveOptions = {}): SolveResult {
  const exprs: BoxedExpression[] = [];
  for (const l of latexes) {
    const e = parse(l);
    if (!e) return FAIL(`Could not parse "${l}"`);
    if (!isEqual(e)) return FAIL('Each block must be an equation (use =)');
    exprs.push(e);
  }
  if (exprs.length === 0) return FAIL('No equations to solve');

  const unknownsSet = new Set<string>();
  for (const e of exprs) for (const u of getUnknowns(e)) unknownsSet.add(u);
  const unknowns = [...unknownsSet];
  if (unknowns.length === 0) return FAIL('No unknowns to solve for');

  const steps: Step[] = exprs.map((e, i) => ({
    label: `eq ${i + 1}`,
    latex: e.latex,
  }));

  try {
    const system = (ce as any).function?.('List', exprs)
      ?? (ce as any).box?.(['List', ...exprs.map((e) => e.json)])
      ?? null;
    if (!system) return FAIL('Compute engine API mismatch');

    const sols = (system as BoxedExpression).solve(unknowns) as unknown;
    const finalLatex = formatSystemResult(sols, unknowns);
    if (!finalLatex) return FAIL('No solution');
    steps.push({ label: 'solve', latex: finalLatex });

    return {
      latex: opts.showSteps ? formatSteps(steps) : finalLatex,
      steps: opts.showSteps ? steps : undefined,
      ok: true,
    };
  } catch (err) {
    console.error(err);
    return FAIL('Could not solve the system');
  }
}

function formatSystemResult(sols: unknown, unknowns: string[]): string | null {
  if (!sols) return null;

  // array of objects (multiple non-linear solutions)
  if (Array.isArray(sols) && sols.length && typeof sols[0] === 'object'
      && !(sols[0] instanceof Object && (sols[0] as any).latex)) {
    const lines = (sols as Record<string, BoxedExpression>[]).map((sol, i) => {
      const parts = unknowns.map((v) => `${v} = ${exprLatex(sol[v])}`).join(',\\ ');
      return sols.length > 1 ? `\\text{solution ${i + 1}: }\\ ${parts}` : parts;
    });
    const body = lines.join('\\\\');
    return sols.length > 1 ? `\\begin{aligned}${body}\\end{aligned}` : body;
  }

  // single object
  if (sols && typeof sols === 'object' && !Array.isArray(sols)) {
    const m = sols as Record<string, BoxedExpression>;
    const parts = unknowns
      .filter((v) => v in m)
      .map((v) => `${v} = ${exprLatex(m[v])}`)
      .join(',\\quad ');
    return parts || null;
  }

  // univariate root array
  if (Array.isArray(sols) && unknowns.length === 1) {
    const v = unknowns[0];
    return (sols as BoxedExpression[])
      .map((s) => `${v} = ${exprLatex(s)}`)
      .join(',\\quad ');
  }

  return null;
}

// ---------- step formatting ------------------------------------------
/**
 * Render a list of steps as a clean multi-line LaTeX block. We use
 * \begin{aligned}…\end{aligned} for legibility, plus a "\text{…}" label
 * on each row indicating the operation.
 */
export function formatSteps(steps: Step[]): string {
  if (steps.length === 0) return '';
  if (steps.length === 1) return steps[0].latex;
  const rows = steps.map(
    (s) => `&\\quad ${s.latex} && \\text{${escapeText(s.label)}}`,
  );
  return `\\begin{aligned}${rows.join('\\\\')}\\end{aligned}`;
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\textbackslash{}').replace(/[{}_^]/g, '\\$&');
}
