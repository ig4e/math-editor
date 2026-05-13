// Run an optimizer over a user-defined f(x) or f(x,y). Returns the
// path the parameters traced — used to plot trajectories on top of a
// loss surface in the ML Lab.

import { compileFunction } from '../graphers/detectSpec';
import { compileMulti } from '../graphers/compileMulti';
import { makeOptimizer, type OptimizerName } from './optimizers';

export interface DescentPath1D {
  xs: number[];
  ys: number[];   // f at each step
}

export interface DescentPath2D {
  xs: number[];
  ys: number[];
  zs: number[];   // f at each step
}

export function descend1D(opts: {
  expr: string;
  x0: number;
  optimizer: OptimizerName;
  lr?: number;
  iters?: number;
}): DescentPath1D {
  const f = compileFunction(opts.expr, 'x');
  const h = 1e-5;
  const df = (x: number) => (f(x + h) - f(x - h)) / (2 * h);
  const opt = makeOptimizer(opts.optimizer, { lr: opts.lr });
  let p = [opts.x0];
  const xs: number[] = [p[0]!];
  const ys: number[] = [f(p[0]!)];
  for (let i = 0; i < (opts.iters ?? 60); i++) {
    p = opt.step(p, [df(p[0]!)]);
    xs.push(p[0]!);
    ys.push(f(p[0]!));
  }
  return { xs, ys };
}

export function descend2D(opts: {
  expr: string; // f(x, y)
  x0: number;
  y0: number;
  optimizer: OptimizerName;
  lr?: number;
  iters?: number;
}): DescentPath2D {
  const f = compileMulti(opts.expr);
  const h = 1e-5;
  const grad = (x: number, y: number) => [
    (f({ x: x + h, y }) - f({ x: x - h, y })) / (2 * h),
    (f({ x, y: y + h }) - f({ x, y: y - h })) / (2 * h),
  ];
  const opt = makeOptimizer(opts.optimizer, { lr: opts.lr });
  let p = [opts.x0, opts.y0];
  const xs: number[] = [p[0]!];
  const ys: number[] = [p[1]!];
  const zs: number[] = [f({ x: p[0]!, y: p[1]! })];
  for (let i = 0; i < (opts.iters ?? 60); i++) {
    p = opt.step(p, grad(p[0]!, p[1]!));
    xs.push(p[0]!);
    ys.push(p[1]!);
    zs.push(f({ x: p[0]!, y: p[1]! }));
  }
  return { xs, ys, zs };
}
