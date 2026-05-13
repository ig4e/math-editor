// PlotSpec — the typed input to every grapher backend. The detection
// layer (detectSpec) turns a math block's LaTeX into one of these, then
// the grapher's plot() materialises it into a React/JSXGraph element.

export type PlotSpecKind =
  | 'function'      // y = f(x) or f(x) = ...
  | 'parametric'    // (x(t), y(t))
  | 'implicit'      // arbitrary F(x, y) = 0
  | 'points'        // scatter
  | 'inequality';   // y < f(x) etc. (P4 follow-up if time)

export interface FunctionSpec {
  kind: 'function';
  /** LaTeX expression — the right-hand side after solving for y. */
  expression: string;
  /** Independent variable (default 'x'). */
  variable?: string;
  /** Display tag (e.g. "y = x²"). */
  label?: string;
  /** Plot color (hex). */
  color?: string;
}

export interface ParametricSpec {
  kind: 'parametric';
  xExpression: string;
  yExpression: string;
  parameter?: string; // default 't'
  tMin?: number;
  tMax?: number;
  label?: string;
  color?: string;
}

export interface ImplicitSpec {
  kind: 'implicit';
  /** F(x, y) — caller has subtracted the RHS so F=0 is the curve. */
  expression: string;
  label?: string;
  color?: string;
}

export interface PointsSpec {
  kind: 'points';
  points: ReadonlyArray<[number, number]>;
  label?: string;
  color?: string;
}

export interface InequalitySpec {
  kind: 'inequality';
  expression: string; // F(x, y) — area where F ≥ 0 is shaded
  label?: string;
  color?: string;
}

// ---------- 3D specs ----------

export interface Surface3DSpec {
  kind: 'surface3d';
  /** z = f(x, y) — LaTeX of the RHS only. */
  expression: string;
  xVar?: string; // default 'x'
  yVar?: string; // default 'y'
  label?: string;
  color?: string;
}

export interface ParametricSurface3DSpec {
  kind: 'parametric-surface3d';
  xExpression: string;
  yExpression: string;
  zExpression: string;
  uVar?: string; // default 'u'
  vVar?: string; // default 'v'
  uMin?: number; uMax?: number;
  vMin?: number; vMax?: number;
  label?: string;
  color?: string;
}

export interface Curve3DSpec {
  kind: 'curve3d';
  xExpression: string;
  yExpression: string;
  zExpression: string;
  parameter?: string; // default 't'
  tMin?: number; tMax?: number;
  label?: string;
  color?: string;
}

export interface VectorField3DSpec {
  kind: 'vector-field3d';
  pExpression: string; // x-component
  qExpression: string; // y-component
  rExpression: string; // z-component
  label?: string;
  color?: string;
  /** Number of samples per axis. Default 8. */
  density?: number;
}

export interface Points3DSpec {
  kind: 'points3d';
  points: ReadonlyArray<[number, number, number]>;
  label?: string;
  color?: string;
}

export type PlotSpec =
  | FunctionSpec
  | ParametricSpec
  | ImplicitSpec
  | PointsSpec
  | InequalitySpec
  | Surface3DSpec
  | ParametricSurface3DSpec
  | Curve3DSpec
  | VectorField3DSpec
  | Points3DSpec;

/** Returns true for any 3D-only spec. */
export function is3DSpec(s: PlotSpec): boolean {
  return s.kind === 'surface3d'
    || s.kind === 'parametric-surface3d'
    || s.kind === 'curve3d'
    || s.kind === 'vector-field3d'
    || s.kind === 'points3d';
}

/** Distinct color rotation for stacked plots. Mirrors the design tokens. */
export const PLOT_COLORS: readonly string[] = [
  '#6366f1', // accent
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#ec4899', // pink
];
