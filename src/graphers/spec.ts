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

export type PlotSpec =
  | FunctionSpec
  | ParametricSpec
  | ImplicitSpec
  | PointsSpec
  | InequalitySpec;

/** Distinct color rotation for stacked plots. Mirrors the design tokens. */
export const PLOT_COLORS: readonly string[] = [
  '#6366f1', // accent
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#ec4899', // pink
];
