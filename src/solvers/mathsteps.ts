// mathsteps backend — provides human-readable step lists for simplify
// and solve. Lazy-loaded (~80 KB gzipped via mathjs dep) since it's
// only needed when `showSteps` is on.
//
// mathsteps 0.2.0 is CommonJS-only with no published TypeScript types,
// so we wrap its narrow surface with an ambient module declaration.

import { registerSolver, type Solver, type SolverInput, type SolverResult, type SolverStep } from './index';

interface MathStepsChange {
  changeType: string;
  newNode: { toString(): string };
  oldNode?: { toString(): string };
  substeps?: MathStepsChange[];
}

interface MathStepsModule {
  simplifyExpression(s: string): MathStepsChange[];
  solveEquation(s: string): MathStepsChange[];
}

let cached: MathStepsModule | null = null;

async function loadMathSteps(): Promise<MathStepsModule> {
  if (cached) return cached;
  // mathsteps ships as CJS; Vite SSR-style interop gives us .default.
  const m = (await import('mathsteps')) as unknown as { default?: MathStepsModule } & MathStepsModule;
  cached = m.default ?? m;
  return cached;
}

/** Flatten mathsteps' nested substeps into a single linear list. */
function flattenSteps(changes: readonly MathStepsChange[]): SolverStep[] {
  const out: SolverStep[] = [];
  const walk = (cs: readonly MathStepsChange[]) => {
    for (const c of cs) {
      out.push({
        latex: c.newNode.toString(),
        rule: c.changeType,
        description: prettifyRule(c.changeType),
      });
      if (c.substeps) walk(c.substeps);
    }
  };
  walk(changes);
  return out;
}

function prettifyRule(rule: string): string {
  return rule
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const mathstepsSolver: Solver = {
  id: 'mathsteps',
  capabilities: ['simplify', 'solve', 'steps'],
  priority: 3, // < compute-engine for non-steps work; specialised for steps
  async invoke(input: SolverInput): Promise<SolverResult> {
    const src = Array.isArray(input.source) ? input.source[0] : input.source;
    if (!src) return { ok: false, error: 'No source' };

    let mod: MathStepsModule;
    try {
      mod = await loadMathSteps();
    } catch (e) {
      return { ok: false, error: `mathsteps load failed: ${(e as Error).message}` };
    }

    try {
      // mathsteps takes ascii-math-ish input (a*b, x^2, etc.), NOT LaTeX
      // directly. For the v2 baseline we feed the LaTeX as-is; mathjs's
      // parser tolerates most simple expressions. The LaTeX → mathjs
      // translation layer is a P3 follow-up if real-world LaTeX trips it.
      const stripped = src.replace(/\\/g, '').trim();
      const changes = input.capability === 'solve'
        ? mod.solveEquation(stripped)
        : mod.simplifyExpression(stripped);

      if (!changes || changes.length === 0) {
        return { ok: false, error: 'mathsteps produced no steps' };
      }
      const steps = flattenSteps(changes);
      const finalStep = steps[steps.length - 1];
      return {
        ok: true,
        latex: finalStep?.latex ?? '',
        steps,
      };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
};

registerSolver(mathstepsSolver);
