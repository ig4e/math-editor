// Numeric matrix ops backed by ml-matrix. Each op returns a result
// (matrix or scalar) + a LaTeX render + an optional step list for the
// algorithms with a natural step-by-step (RREF, LU, QR).
//
// Symbolic ops (eigenvalues with irrational entries, characteristic
// polynomial, exact inverse) are delegated to Pyodide-SymPy via the
// solver registry — the panel routes the request there when the user
// asks for "exact" mode (P9 dependency).

import {
  Matrix, EigenvalueDecomposition, LuDecomposition, QrDecomposition,
  SingularValueDecomposition, determinant, inverse, solve,
} from 'ml-matrix';

export type Cell = number;
export type MatrixData = readonly (readonly Cell[])[];

export interface OpResult {
  ok: boolean;
  latex?: string;
  matrix?: MatrixData;
  scalar?: number;
  steps?: { latex: string; description?: string }[];
  error?: string;
}

function toMatrix(data: MatrixData): Matrix {
  return new Matrix(data.map((row) => row.slice()));
}

function toLatex(m: Matrix): string {
  const rows: string[] = [];
  for (let i = 0; i < m.rows; i++) {
    const row: string[] = [];
    for (let j = 0; j < m.columns; j++) {
      const v = m.get(i, j);
      row.push(formatCell(v));
    }
    rows.push(row.join(' & '));
  }
  return `\\begin{pmatrix} ${rows.join(' \\\\ ')} \\end{pmatrix}`;
}

function matrixToData(m: Matrix): MatrixData {
  const out: number[][] = [];
  for (let i = 0; i < m.rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < m.columns; j++) row.push(m.get(i, j));
    out.push(row);
  }
  return out;
}

function formatCell(v: number): string {
  if (Number.isInteger(v)) return String(v);
  if (Math.abs(v) < 1e-10) return '0';
  return Number(v.toFixed(6)).toString();
}

// ----- ops ------------------------------------------------------------

export function opDet(data: MatrixData): OpResult {
  try {
    const m = toMatrix(data);
    if (m.rows !== m.columns) return { ok: false, error: 'Determinant requires a square matrix' };
    const d = determinant(m);
    return { ok: true, scalar: d, latex: `\\det = ${formatCell(d)}` };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export function opInverse(data: MatrixData): OpResult {
  try {
    const m = toMatrix(data);
    if (m.rows !== m.columns) return { ok: false, error: 'Inverse requires a square matrix' };
    const inv = inverse(m);
    return { ok: true, matrix: matrixToData(inv), latex: toLatex(inv) };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export function opTranspose(data: MatrixData): OpResult {
  const m = toMatrix(data).transpose();
  return { ok: true, matrix: matrixToData(m), latex: toLatex(m) };
}

export function opRank(data: MatrixData): OpResult {
  try {
    const m = toMatrix(data);
    // ml-matrix exposes rank via SVD: it counts singular values > tol.
    const svd = new SingularValueDecomposition(m);
    const rank = svd.rank;
    return { ok: true, scalar: rank, latex: `\\operatorname{rank} = ${rank}` };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export function opRREF(data: MatrixData): OpResult {
  // ml-matrix's `solve(I, A)` gives RREF only when A is square + invertible.
  // For the general case we implement Gauss-Jordan manually with step
  // capture so the user sees the row operations.
  const m = toMatrix(data).clone();
  const steps: { latex: string; description?: string }[] = [];
  steps.push({ latex: toLatex(m), description: 'Start' });
  let lead = 0;
  const rowCount = m.rows;
  const columnCount = m.columns;
  for (let r = 0; r < rowCount; r++) {
    if (lead >= columnCount) break;
    let i = r;
    while (Math.abs(m.get(i, lead)) < 1e-12) {
      i++;
      if (i === rowCount) {
        i = r;
        lead++;
        if (lead === columnCount) {
          steps.push({ latex: toLatex(m), description: 'Done' });
          return { ok: true, matrix: matrixToData(m), latex: toLatex(m), steps };
        }
      }
    }
    if (i !== r) {
      m.swapRows(i, r);
      steps.push({ latex: toLatex(m), description: `Swap R${i + 1} ↔ R${r + 1}` });
    }
    const lv = m.get(r, lead);
    if (Math.abs(lv - 1) > 1e-12) {
      m.mulRow(r, 1 / lv);
      steps.push({ latex: toLatex(m), description: `R${r + 1} → R${r + 1} / ${formatCell(lv)}` });
    }
    for (let k = 0; k < rowCount; k++) {
      if (k === r) continue;
      const factor = m.get(k, lead);
      if (Math.abs(factor) > 1e-12) {
        // R_k = R_k - factor * R_r
        for (let j = 0; j < columnCount; j++) {
          m.set(k, j, m.get(k, j) - factor * m.get(r, j));
        }
        steps.push({ latex: toLatex(m), description: `R${k + 1} → R${k + 1} − (${formatCell(factor)}) R${r + 1}` });
      }
    }
    lead++;
  }
  return { ok: true, matrix: matrixToData(m), latex: toLatex(m), steps };
}

export function opEigenvalues(data: MatrixData): OpResult {
  try {
    const m = toMatrix(data);
    if (m.rows !== m.columns) return { ok: false, error: 'Eigenvalues require a square matrix' };
    const ev = new EigenvalueDecomposition(m);
    const real = ev.realEigenvalues;
    const imag = ev.imaginaryEigenvalues;
    const latex = real.map((r, i) => {
      const im = imag[i] ?? 0;
      if (Math.abs(im) < 1e-10) return formatCell(r);
      return `${formatCell(r)} ${im >= 0 ? '+' : '-'} ${formatCell(Math.abs(im))} i`;
    }).join(',\\ ');
    return { ok: true, latex: `\\lambda \\in \\{ ${latex} \\}` };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export function opLU(data: MatrixData): OpResult {
  try {
    const m = toMatrix(data);
    const lu = new LuDecomposition(m);
    const L = lu.lowerTriangularMatrix;
    const U = lu.upperTriangularMatrix;
    return {
      ok: true,
      latex: `L = ${toLatex(L)} \\quad U = ${toLatex(U)}`,
      steps: [
        { latex: toLatex(L), description: 'Lower triangular' },
        { latex: toLatex(U), description: 'Upper triangular' },
      ],
    };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export function opQR(data: MatrixData): OpResult {
  try {
    const m = toMatrix(data);
    const qr = new QrDecomposition(m);
    const Q = qr.orthogonalMatrix;
    const R = qr.upperTriangularMatrix;
    return {
      ok: true,
      latex: `Q = ${toLatex(Q)} \\quad R = ${toLatex(R)}`,
      steps: [
        { latex: toLatex(Q), description: 'Orthogonal Q' },
        { latex: toLatex(R), description: 'Upper triangular R' },
      ],
    };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export function opSolveSystem(data: MatrixData, rhs: readonly number[]): OpResult {
  try {
    const m = toMatrix(data);
    const b = Matrix.columnVector(rhs.slice());
    const x = solve(m, b);
    const out = matrixToData(x);
    const latex = `\\vec{x} = ${toLatex(x)}`;
    return { ok: true, matrix: out, latex };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export { toLatex as matrixToLatex };
