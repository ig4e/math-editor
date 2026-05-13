// Solver registry + runner. Backends register via side-effect imports
// rooted in `src/solvers/all.ts`. The runner picks the best fit per
// call based on capability, user preference, and online/offline mode.
//
// Contract documented in /docs/adding-a-solver-backend.md.

export type SolverCapability =
  | 'simplify' | 'solve' | 'system'
  | 'differentiate' | 'integrate'
  | 'steps';

export interface SolverInput {
  /** LaTeX of the expression / equation; array for system solves. */
  source: string | string[];
  capability: SolverCapability;
  /** Optional known-value substitutions for variables. */
  variables?: Record<string, number | string>;
  /** Caller-supplied options (precision, ring, etc.). */
  options?: Record<string, unknown>;
  /** Aborts a long-running solve. */
  signal?: AbortSignal;
}

export interface SolverStep {
  latex: string;
  rule?: string;
  description?: string;
}

export interface SolverResult {
  ok: boolean;
  /** Final LaTeX (e.g. `"x = 2, x = 3"`). */
  latex?: string;
  steps?: SolverStep[];
  /** Free-form note shown under the result. */
  note?: string;
  error?: string;
  /** Which backend produced this. */
  backend?: string;
}

export interface Solver {
  id: string;
  capabilities: SolverCapability[];
  /** Tie-break priority; higher wins. Default 0. */
  priority?: number;
  /** Whether this backend needs an internet connection. */
  online?: boolean;
  invoke(input: SolverInput): Promise<SolverResult>;
}

const registry = new Map<string, Solver>();

export function registerSolver(solver: Solver): void {
  registry.set(solver.id, solver);
}

export function getSolver(id: string): Solver | undefined {
  return registry.get(id);
}

export function getAllSolvers(): readonly Solver[] {
  return [...registry.values()];
}

// ----- runner ----------------------------------------------------------

export interface SolveOptions {
  /** Force a specific backend ID. */
  preferred?: string;
  /** Drop backends that don't include 'steps'. */
  requireSteps?: boolean;
  /** Allow online backends (Wolfram, AI). Default: false. */
  allowOnline?: boolean;
}

export async function solve(
  input: SolverInput,
  opts: SolveOptions = {},
): Promise<SolverResult> {
  const candidates = getAllSolvers().filter((s) => {
    if (!s.capabilities.includes(input.capability)) return false;
    if (opts.requireSteps && !s.capabilities.includes('steps')) return false;
    if (!opts.allowOnline && s.online) return false;
    return true;
  });

  if (candidates.length === 0) {
    return {
      ok: false,
      error: `No backend can handle "${input.capability}"`,
    };
  }

  candidates.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  if (opts.preferred) {
    const idx = candidates.findIndex((s) => s.id === opts.preferred);
    if (idx > 0) {
      const [picked] = candidates.splice(idx, 1);
      if (picked) candidates.unshift(picked);
    }
  }

  // Try each in order; first ok-result wins.
  let lastError: string | undefined;
  for (const s of candidates) {
    try {
      const r = await s.invoke(input);
      if (r.ok) return { ...r, backend: s.id };
      lastError = r.error;
    } catch (e) {
      lastError = (e as Error).message;
    }
  }
  return { ok: false, error: lastError ?? 'all backends failed' };
}
