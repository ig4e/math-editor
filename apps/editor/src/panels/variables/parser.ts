// Variable detection — walks every math block on the active sheet,
// parses with compute-engine, and emits a definition record for every
// `<name> = <numeric>` pattern. Used by:
//   - VariablesPanel UI (slider per detected definition)
//   - SolverPanel (applies them as substitutions before solve/simplify)

import { ComputeEngine, type BoxedExpression } from '@cortex-js/compute-engine';
import type { MathBlock } from '../../state/types';

const ce = new ComputeEngine();

export interface VariableDef {
  /** Symbol name (`g`, `m`, `x_0`). */
  name: string;
  /** Numeric value if the RHS evaluates to a number, otherwise the LaTeX. */
  value: number | string;
  /** Whether the value parses to a finite number. */
  isNumeric: boolean;
  /** Block ID + ref number of the source equation. */
  sourceBlockId: string;
  /** Position in the document — used for "most recent wins" conflict resolution. */
  index: number;
}

/** Look at a single math block; return its variable definition or null. */
export function detectInBlock(block: MathBlock, index: number): VariableDef | null {
  const latex = block.latex.trim();
  if (!latex) return null;

  let expr: BoxedExpression;
  try {
    expr = ce.parse(latex);
  } catch { return null; }

  // Only equations.
  if (expr.operator !== 'Equal') return null;
  const [lhs, rhs] = expr.ops ?? [];
  if (!lhs || !rhs) return null;

  // LHS must be a bare symbol.
  if (lhs.operator !== 'Symbol' && lhs.symbol === undefined) return null;
  const name = lhs.symbol;
  if (!name || typeof name !== 'string') return null;
  // Reject one-letter built-ins that shouldn't be overridden.
  if (['e', 'i', 'π', 'Pi'].includes(name)) return null;

  // Try to evaluate the RHS numerically. compute-engine returns the
  // expression unchanged if it can't reduce — we detect numeric success
  // by whether `.N()` produced a finite real.
  let value: number | string;
  let isNumeric = false;
  try {
    const n = rhs.N();
    const num = n.re;
    if (typeof num === 'number' && Number.isFinite(num) && (n.im ?? 0) === 0) {
      value = num;
      isNumeric = true;
    } else {
      value = rhs.latex;
    }
  } catch {
    value = rhs.latex;
  }

  return {
    name,
    value,
    isNumeric,
    sourceBlockId: block.id,
    index,
  };
}

/** Walk the active sheet's math blocks; return latest-definition-wins map. */
export function detectAll(blocks: readonly MathBlock[]): VariableDef[] {
  const byName = new Map<string, VariableDef>();
  blocks.forEach((b, i) => {
    const def = detectInBlock(b, i);
    if (def) byName.set(def.name, def);
  });
  return [...byName.values()].sort((a, b) => a.index - b.index);
}
