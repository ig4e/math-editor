# Adding a solver backend

Math Notebook routes solve / simplify / step-by-step requests through a **solver registry**. Multiple backends coexist; the runner picks the right one per call based on capabilities and user preference.

The shipping backends:

| Backend | Capabilities | Loaded |
|---|---|---|
| `compute-engine` | simplify, solve, differentiate | eager |
| `mathsteps` | steps for simplify / solve | lazy (only when `showSteps` is on) |
| `pyodide-sympy` | solve, integrate, system, steps for everything | lazy on first use |
| `wolfram` | any (delegates to Wolfram Alpha) | server-side only, needs `WOLFRAM_APPID` |
| `ai` | any (asks the user's LLM) | needs a configured AI provider |

## The contract

`src/solvers/index.ts`:

```ts
export type SolverCapability =
  | 'simplify' | 'solve' | 'system'
  | 'differentiate' | 'integrate'
  | 'steps';

export interface SolverInput {
  /** LaTeX of the expression / equation, or an array for system solves. */
  source: string | string[];
  capability: SolverCapability;
  /** Optional known-value substitutions. */
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
  /** Final LaTeX (e.g. "x = 2, x = 3"). */
  latex?: string;
  steps?: SolverStep[];
  /** Free-form note shown under the result. */
  note?: string;
  error?: string;
}

export interface Solver {
  id: 'compute-engine' | 'mathsteps' | 'pyodide-sympy' | 'wolfram' | 'ai' | string;
  /** Capabilities this backend can fulfill. */
  capabilities: SolverCapability[];
  /** Priority for tie-breaking; higher wins. Default 0. */
  priority?: number;
  /** Whether this backend needs an internet connection. */
  online?: boolean;
  /** The actual call. */
  invoke(input: SolverInput): Promise<SolverResult>;
}

export function registerSolver(solver: Solver): void;
export function solve(
  input: SolverInput,
  opts?: { preferred?: string; requireSteps?: boolean; allowOnline?: boolean }
): Promise<SolverResult>;
```

The runner's algorithm:

1. Filter solvers whose `capabilities` include `input.capability`.
2. If `requireSteps` is on, drop solvers that don't include `'steps'`.
3. If `allowOnline` is off (default), drop solvers with `online: true`.
4. If `preferred` is set and matches a remaining solver, use it.
5. Otherwise pick the highest-`priority` remaining solver.
6. Call `invoke`. If it returns `{ ok: false }`, try the next one.

## Three-step recipe

### 1. Create the backend file

```ts
// src/solvers/<name>.ts
import { registerSolver, type Solver } from './index';

const myBackend: Solver = {
  id: 'my-backend',
  capabilities: ['simplify', 'solve'],
  priority: 5,
  async invoke({ source, capability, signal }) {
    try {
      // …call your library / API…
      return { ok: true, latex: '…', steps: [/* … */] };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
};

registerSolver(myBackend);
```

### 2. (If lazy) Wrap registration in a one-time guard

For backends > 100 KB gzipped, register only when first asked for. Add a tiny entry in `src/solvers/lazy.ts`:

```ts
let loaded = false;
export async function ensureMyBackend() {
  if (loaded) return;
  loaded = true;
  await import('./<name>');
}
```

…then call `ensureMyBackend()` from `solve()` when its capability is requested.

### 3. Import it at boot (eager backends only)

Add one line to `src/solvers/index.ts`:

```ts
import './<name>';
```

That's it. The Solver panel, the AI `solve` tool, and any other consumer just call `solve(...)` and get your backend automatically when it's the right fit.

## What "steps" should look like

A `SolverStep[]` is a list of rewrites. Render-side, each step becomes a card with a read-only MathLive field. Conventions:

- **First step** is the input as the user typed it (no rewrite).
- **Last step** is the answer.
- Each intermediate step's `description` should fit on one line ("Subtract 5 from both sides", "Apply quadratic formula", "Combine like terms").
- `rule` is a stable identifier (`'quadratic-formula'`, `'distribute'`) so future versions can localize or restyle.

## Anti-patterns

- **Don't hardcode a backend** in panel code. Always go through `solve(input, opts)`.
- **Don't block the UI** during a solve. Pass through `input.signal` so the user's "Stop" button works.
- **Don't return partial results without `ok: false`** — the runner uses `ok` to decide whether to try the next backend.
