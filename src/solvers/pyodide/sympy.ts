// Pyodide-SymPy solver backend. Lazy-loaded; the first invoke triggers
// the ~10 MB Python kernel download. After that, calls run as fast as
// SymPy itself can.
//
// SymPy gives us step-by-step for paths compute-engine + mathsteps don't
// cover well: harder integrals, advanced ODEs, large simplifications,
// and exact symbolic linear algebra.

import { registerSolver, type Solver, type SolverInput, type SolverResult, type SolverStep } from '../index';
import { ensurePyodide } from './loader';

const pyodideSympy: Solver = {
  id: 'pyodide-sympy',
  capabilities: ['simplify', 'solve', 'differentiate', 'integrate', 'steps'],
  priority: 4, // < compute-engine for trivial cases; ≥ mathsteps for steps
  async invoke(input: SolverInput): Promise<SolverResult> {
    const src = Array.isArray(input.source) ? input.source[0] : input.source;
    if (!src) return { ok: false, error: 'No source' };

    let py;
    try {
      py = await ensurePyodide();
    } catch (e) {
      return { ok: false, error: `Pyodide load failed: ${(e as Error).message}` };
    }

    const program = buildProgram(input.capability, src, input.variables);
    try {
      const raw = await py.runPythonAsync(program);
      const json = raw == null ? null : JSON.parse(String(raw));
      if (!json || !json.ok) {
        return { ok: false, error: json?.error ?? 'SymPy returned no result' };
      }
      return {
        ok: true,
        latex: json.latex,
        steps: (json.steps ?? []) as SolverStep[],
        note: 'via SymPy',
      };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
};

registerSolver(pyodideSympy);

// ----- python source --------------------------------------------------

function buildProgram(capability: SolverInput['capability'], latex: string, vars?: Record<string, number | string>): string {
  // Pyodide's `runPythonAsync` returns whatever the last expression
  // evaluates to. We always emit a JSON string so the JS side has a
  // stable shape.
  const escaped = latex.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const subs = vars
    ? Object.entries(vars).map(([k, v]) => `${jsToPy(k)}: ${jsToPy(v)}`).join(', ')
    : '';

  return `
import json
try:
    from sympy import symbols, sympify, simplify, solve, integrate, diff, Symbol, latex
    from sympy.parsing.latex import parse_latex
    expr = parse_latex(r"""${escaped}""")
    subs = {${subs}}
    if subs:
        expr = expr.subs({Symbol(k): v for k, v in subs.items()})

    result = None
    steps = []
    cap = ${JSON.stringify(capability)}

    if cap == "simplify":
        result = simplify(expr)
    elif cap == "solve":
        free = list(getattr(expr, "free_symbols", []))
        if not free:
            result = expr
        else:
            sols = solve(expr, free[0]) if len(free) >= 1 else []
            if sols:
                result = sols
            else:
                result = expr
    elif cap == "differentiate":
        free = list(getattr(expr, "free_symbols", []))
        wrt = free[0] if free else Symbol("x")
        result = diff(expr, wrt)
    elif cap == "integrate":
        free = list(getattr(expr, "free_symbols", []))
        wrt = free[0] if free else Symbol("x")
        result = integrate(expr, wrt)
    else:
        raise ValueError(f"unsupported capability: {cap}")

    def to_latex(o):
        try:
            return latex(o)
        except Exception:
            return str(o)

    if isinstance(result, list):
        out_latex = ", ".join(to_latex(s) for s in result)
    else:
        out_latex = to_latex(result)

    json.dumps({"ok": True, "latex": out_latex, "steps": steps})
except Exception as e:
    json.dumps({"ok": False, "error": str(e)})
`.trim();
}

function jsToPy(v: unknown): string {
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return `r"""${v.replace(/"""/g, '\\"\\"\\"')}"""`;
  return 'None';
}
