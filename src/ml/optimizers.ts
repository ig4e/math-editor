// First-order optimizers. Each returns an "update" closure that maps
// (parameters, gradients) → new parameters with internal state mutated.
// Plain arrays so they're easy to inspect in the ML Lab's panel.

export type OptimizerName = 'sgd' | 'momentum' | 'rmsprop' | 'adam';

export interface Optimizer {
  step(params: number[], grads: number[]): number[];
  reset(): void;
  name: OptimizerName;
}

export function makeOptimizer(name: OptimizerName, opts: { lr?: number; beta1?: number; beta2?: number; eps?: number } = {}): Optimizer {
  const lr = opts.lr ?? 0.05;
  const beta1 = opts.beta1 ?? 0.9;
  const beta2 = opts.beta2 ?? 0.999;
  const eps = opts.eps ?? 1e-8;

  if (name === 'sgd') {
    return {
      name,
      step(p, g) { return p.map((x, i) => x - lr * (g[i] ?? 0)); },
      reset() { /* stateless */ },
    };
  }

  if (name === 'momentum') {
    let v: number[] = [];
    return {
      name,
      step(p, g) {
        if (v.length !== p.length) v = new Array(p.length).fill(0);
        v = v.map((vi, i) => beta1 * vi + (g[i] ?? 0));
        return p.map((x, i) => x - lr * (v[i] ?? 0));
      },
      reset() { v = []; },
    };
  }

  if (name === 'rmsprop') {
    let s: number[] = [];
    return {
      name,
      step(p, g) {
        if (s.length !== p.length) s = new Array(p.length).fill(0);
        s = s.map((si, i) => beta2 * si + (1 - beta2) * ((g[i] ?? 0) ** 2));
        return p.map((x, i) => x - lr * (g[i] ?? 0) / (Math.sqrt(s[i] ?? 0) + eps));
      },
      reset() { s = []; },
    };
  }

  // adam
  let m: number[] = [], v2: number[] = [];
  let t = 0;
  return {
    name: 'adam',
    step(p, g) {
      if (m.length !== p.length) { m = new Array(p.length).fill(0); v2 = new Array(p.length).fill(0); }
      t++;
      m = m.map((mi, i) => beta1 * mi + (1 - beta1) * (g[i] ?? 0));
      v2 = v2.map((vi, i) => beta2 * vi + (1 - beta2) * ((g[i] ?? 0) ** 2));
      const mh = m.map((mi) => mi / (1 - Math.pow(beta1, t)));
      const vh = v2.map((vi) => vi / (1 - Math.pow(beta2, t)));
      return p.map((x, i) => x - lr * (mh[i] ?? 0) / (Math.sqrt(vh[i] ?? 0) + eps));
    },
    reset() { m = []; v2 = []; t = 0; },
  };
}
