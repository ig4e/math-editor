// Thin async wrappers around solvers/pyodide/matrix.symMatrixOp that
// match the existing numeric `OpResult` shape. The Matrix panel calls
// these when the user is in "Symbolic" mode; eig / LU / QR fall through
// to numeric ops on Pyodide failure so the user always gets something.

import type { MatrixData, OpResult } from './ops';
import { opEigenvalues, opLU, opQR } from './ops';

async function callSym(
  op: 'eig' | 'lu' | 'qr' | 'charpoly',
  data: MatrixData,
): Promise<OpResult> {
  const { symMatrixOp } = await import('../../solvers/pyodide/matrix');
  const r = await symMatrixOp(op, data);
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, latex: r.latex, steps: r.steps };
}

export async function opEigenvaluesSymbolic(data: MatrixData): Promise<OpResult> {
  const r = await callSym('eig', data);
  if (r.ok) return r;
  // Pyodide failure → numeric fallback so the button still produces
  // something useful when the user is offline / Pyodide download fails.
  const num = opEigenvalues(data);
  return num.ok ? { ...num, error: `(numeric fallback — symbolic failed: ${r.error})` } : num;
}

export async function opLUSymbolic(data: MatrixData): Promise<OpResult> {
  const r = await callSym('lu', data);
  return r.ok ? r : opLU(data);
}

export async function opQRSymbolic(data: MatrixData): Promise<OpResult> {
  const r = await callSym('qr', data);
  return r.ok ? r : opQR(data);
}

export async function opCharacteristicPolynomial(data: MatrixData): Promise<OpResult> {
  return callSym('charpoly', data);
}
