// Detect a 3D plot spec from a math block's LaTeX. Recognises:
//   - z = f(x, y)             → surface3d
//   - (x(t), y(t), z(t))      → curve3d   (three-element tuple = parametric)
//   - (x(u,v), y(u,v), z(u,v)) → parametric-surface3d (two free params)
//   - <expr> with x,y,z → surface3d (interpreted as z = expr)
//
// Vector fields and point clouds are spawned by the ML Lab / Numerics
// panels rather than auto-detected from a math block.

import { ComputeEngine, type BoxedExpression } from '@cortex-js/compute-engine';
import type { PlotSpec } from '../../graphers/spec';

const ce = new ComputeEngine();

export function detect3DSpec(latex: string): PlotSpec | null {
  const src = latex.trim();
  if (!src) return null;
  let expr: BoxedExpression;
  try { expr = ce.parse(src); } catch { return null; }

  // ----- explicit z = f(x, y) -----
  if (expr.operator === 'Equal') {
    const [lhs, rhs] = expr.ops ?? [];
    if (!lhs || !rhs) return null;
    if (lhs.symbol === 'z') {
      const u = rhs.unknowns ?? [];
      if (u.includes('x') && u.includes('y') && !u.includes('z')) {
        return { kind: 'surface3d', expression: rhs.latex, xVar: 'x', yVar: 'y', label: src };
      }
    }
  }

  // ----- 3-tuple → curve or parametric surface -----
  if (expr.operator === 'Tuple' || expr.operator === 'List' || expr.operator === 'Delimiter') {
    const ops = unwrapDelimiter(expr);
    if (ops.length === 3) {
      const [x, y, z] = ops;
      if (!x || !y || !z) return null;
      const free = new Set([...(x.unknowns ?? []), ...(y.unknowns ?? []), ...(z.unknowns ?? [])]);
      if (free.has('t') && free.size === 1) {
        return {
          kind: 'curve3d',
          xExpression: x.latex,
          yExpression: y.latex,
          zExpression: z.latex,
          parameter: 't',
          label: src,
        };
      }
      if (free.has('u') && free.has('v') && free.size === 2) {
        return {
          kind: 'parametric-surface3d',
          xExpression: x.latex,
          yExpression: y.latex,
          zExpression: z.latex,
          uVar: 'u',
          vVar: 'v',
          label: src,
        };
      }
    }
  }

  // ----- bare 2-var expression → surface -----
  const u = expr.unknowns ?? [];
  if (u.includes('x') && u.includes('y') && !u.includes('z')) {
    return { kind: 'surface3d', expression: src, xVar: 'x', yVar: 'y', label: `z = ${src}` };
  }

  return null;
}

function unwrapDelimiter(expr: BoxedExpression): readonly BoxedExpression[] {
  if (expr.operator === 'Delimiter' && expr.ops?.[0]) {
    return unwrapDelimiter(expr.ops[0]);
  }
  return expr.ops ?? [];
}
