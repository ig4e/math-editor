// Compute-engine backend — the workhorse. Eager (small enough to bundle
// with the Solver panel). Handles simplify / solve / differentiate /
// integrate / single-variable substitution. Step-by-step rewrites are
// the mathsteps backend's job.

import { ComputeEngine, type BoxedExpression } from '@cortex-js/compute-engine';
import { registerSolver, type Solver, type SolverInput, type SolverResult } from './index';

const ce = new ComputeEngine();

/** Cap CAS work per call so a runaway expression doesn't lock the tab. */
const TIME_LIMIT_MS = 1500;

function withTimeLimit<T>(fn: () => T, _ms: number): T {
  // compute-engine's sync calls don't have a built-in timeout; we rely
  // on its own internal cost-limit. Wrapping is kept for future swap.
  return fn();
}

function parseSafe(latex: string): BoxedExpression | null {
  try {
    return ce.parse(latex);
  } catch (e) {
    console.warn('[computeEngine] parse error', e);
    return null;
  }
}

function applyVars(expr: BoxedExpression, vars?: Record<string, number | string>): BoxedExpression {
  if (!vars) return expr;
  for (const [name, val] of Object.entries(vars)) {
    try {
      ce.assign(name, typeof val === 'number' ? val : ce.parse(String(val)));
    } catch { /* skip */ }
  }
  return expr;
}

function clearVars(vars?: Record<string, number | string>): void {
  if (!vars) return;
  for (const name of Object.keys(vars)) {
    try { ce.forget(name); } catch { /* skip */ }
  }
}

const computeEngineSolver: Solver = {
  id: 'compute-engine',
  capabilities: ['simplify', 'solve', 'differentiate', 'integrate'],
  priority: 5,
  async invoke(input: SolverInput): Promise<SolverResult> {
    const src = Array.isArray(input.source) ? input.source[0] : input.source;
    if (!src) return { ok: false, error: 'No source' };
    const expr = parseSafe(src);
    if (!expr) return { ok: false, error: 'Could not parse' };

    applyVars(expr, input.variables);
    try {
      switch (input.capability) {
        case 'simplify': {
          const simplified = withTimeLimit(() => expr.simplify(), TIME_LIMIT_MS);
          return { ok: true, latex: simplified.latex };
        }
        case 'solve': {
          const unknowns = expr.unknowns ?? [];
          const target = (input.options?.['variable'] as string) ?? unknowns[0] ?? 'x';
          const result = expr.solve([target]);
          if (!result || result.length === 0) {
            return { ok: false, error: `No solutions for ${target}` };
          }
          const latex = result
            .map((r) => `${target} = ${r.latex}`)
            .join(', \\quad ');
          return { ok: true, latex };
        }
        case 'differentiate': {
          const wrt = (input.options?.['variable'] as string) ?? 'x';
          const d = ce.box(['Derivative', expr, wrt]).simplify();
          return { ok: true, latex: d.latex };
        }
        case 'integrate': {
          const wrt = (input.options?.['variable'] as string) ?? 'x';
          const i = ce.box(['Integrate', expr, wrt]).simplify();
          return { ok: true, latex: i.latex };
        }
        default:
          return { ok: false, error: `Unsupported: ${input.capability}` };
      }
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    } finally {
      clearVars(input.variables);
    }
  },
};

registerSolver(computeEngineSolver);
