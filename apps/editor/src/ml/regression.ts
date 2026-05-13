// Linear + polynomial regression via the normal equations using
// ml-matrix. Returns coefficients in increasing-degree order and a
// closure that evaluates the fitted curve at any x.

import { Matrix, solve } from 'ml-matrix';

export interface RegressionResult {
  coefficients: number[]; // a0, a1, a2, ... (increasing degree)
  predict(x: number): number;
  residuals: number[];    // y_i - f(x_i)
  rSquared: number;
}

export function regress(
  xs: readonly number[],
  ys: readonly number[],
  degree: number,
): RegressionResult {
  const n = xs.length;
  if (n === 0) return zero();
  const X = new Matrix(n, degree + 1);
  for (let i = 0; i < n; i++) {
    let v = 1;
    for (let d = 0; d <= degree; d++) {
      X.set(i, d, v);
      v *= xs[i]!;
    }
  }
  const y = Matrix.columnVector(ys.slice());
  const coeffs = solve(X, y);
  const coefficients = coeffs.to1DArray();
  const predict = (x: number) => {
    let v = 1, sum = 0;
    for (let d = 0; d <= degree; d++) {
      sum += (coefficients[d] ?? 0) * v;
      v *= x;
    }
    return sum;
  };
  const residuals = xs.map((x, i) => (ys[i] ?? 0) - predict(x));
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  const ssTot = ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const ssRes = residuals.reduce((s, r) => s + r * r, 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { coefficients, predict, residuals, rSquared };
}

function zero(): RegressionResult {
  return { coefficients: [], predict: () => NaN, residuals: [], rSquared: 0 };
}

/** Pretty-print as a LaTeX polynomial. */
export function coefficientsToLatex(coeffs: readonly number[]): string {
  if (coeffs.length === 0) return '0';
  const parts: string[] = [];
  for (let d = coeffs.length - 1; d >= 0; d--) {
    const c = coeffs[d];
    if (c === undefined || Math.abs(c) < 1e-10) continue;
    const sign = c < 0 ? '-' : parts.length === 0 ? '' : '+';
    const mag = Math.abs(c);
    const cs = Number(mag.toPrecision(5));
    const piece = d === 0 ? `${cs}` : d === 1 ? `${cs === 1 ? '' : cs} x` : `${cs === 1 ? '' : cs} x^{${d}}`;
    parts.push(`${sign} ${piece}`);
  }
  return parts.length === 0 ? '0' : parts.join(' ');
}
