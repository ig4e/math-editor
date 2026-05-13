// Symbolic matrix ops via SymPy in Pyodide. Sister file to sympy.ts —
// kept separate because sympy.ts is tightly scoped to single-expression
// capabilities (simplify / solve / integrate) routed through the solver
// registry, while these ops take structured MatrixData input.
//
// Cold paths: the first call triggers Pyodide's 10 MB download via the
// shared `ensurePyodide()` toast in loader.ts.

import { ensurePyodide } from './loader';

export type SymMatrixOp = 'eig' | 'lu' | 'qr' | 'charpoly';

export interface SymMatrixResult {
  ok: boolean;
  latex?: string;
  steps?: { latex: string; description?: string }[];
  error?: string;
}

const MAX_DIM = 8;

export async function symMatrixOp(op: SymMatrixOp, data: readonly (readonly number[])[]): Promise<SymMatrixResult> {
  const rows = data.length;
  const cols = data[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return { ok: false, error: 'Matrix is empty' };
  if (rows > MAX_DIM || cols > MAX_DIM) {
    return { ok: false, error: `Symbolic ops are capped at ${MAX_DIM}×${MAX_DIM} (got ${rows}×${cols}).` };
  }
  if ((op === 'eig' || op === 'lu' || op === 'qr' || op === 'charpoly') && rows !== cols) {
    return { ok: false, error: `${op} requires a square matrix (got ${rows}×${cols})` };
  }

  try {
    const py = await ensurePyodide();
    const payload = JSON.stringify({ op, data });
    // Use a here-doc-style triple-quoted string so the JSON payload
    // can contain any characters without escaping.
    const program = `
import json
from sympy import Matrix, Rational, latex, Symbol, simplify

payload = json.loads(r"""${payload.replace(/"""/g, '\\"\\"\\"')}""")
op = payload["op"]
data = payload["data"]
M = Matrix([[Rational(str(c)) for c in row] for row in data])
out = {"ok": True, "steps": []}

if op == "eig":
    eigs = M.eigenvals()
    parts = []
    for k, v in eigs.items():
        if v > 1:
            parts.append(f"{latex(k)}^{{{v}}}")
        else:
            parts.append(latex(k))
    out["latex"] = ",\\\\ ".join(parts)
    lam = Symbol('lambda')
    char = (M - lam * Matrix.eye(M.rows))
    out["steps"] = [
        {"latex": "M - \\\\lambda I = " + latex(char), "description": "Characteristic matrix"},
        {"latex": "\\\\det(M - \\\\lambda I) = " + latex(char.det()), "description": "Characteristic polynomial"},
    ]
elif op == "charpoly":
    lam = Symbol('lambda')
    p = M.charpoly(lam).as_expr()
    out["latex"] = "p(\\\\lambda) = " + latex(simplify(p))
elif op == "lu":
    L, U, _ = M.LUdecomposition()
    out["latex"] = "L = " + latex(L) + " \\\\quad U = " + latex(U)
    out["steps"] = [
        {"latex": latex(L), "description": "Lower triangular L"},
        {"latex": latex(U), "description": "Upper triangular U"},
    ]
elif op == "qr":
    Q, R = M.QRdecomposition()
    out["latex"] = "Q = " + latex(Q) + " \\\\quad R = " + latex(R)
    out["steps"] = [
        {"latex": latex(Q), "description": "Orthogonal Q"},
        {"latex": latex(R), "description": "Upper triangular R"},
    ]
else:
    out = {"ok": False, "error": f"unknown op: {op}"}

json.dumps(out)
`;
    const raw = String(await py.runPythonAsync(program));
    return JSON.parse(raw) as SymMatrixResult;
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
