// Probability distributions for the ML Lab. PDF / CDF / sampler for the
// most-asked-for cases. Pure JS; no SciPy port — the math is concise
// enough that hand-rolling it keeps the bundle small.

export type DistributionName = 'normal' | 'binomial' | 'poisson' | 'beta' | 'gamma' | 'chi-squared' | 'exponential' | 'uniform';

export interface DistributionSpec {
  name: DistributionName;
  params: Record<string, number>;
}

export interface DistributionImpl {
  pdf(x: number, p: Record<string, number>): number;
  sample(p: Record<string, number>): number;
  /** Reasonable plot range for the parameter set. */
  range(p: Record<string, number>): [number, number];
  paramDefs: { key: string; label: string; default: number }[];
  latex: (p: Record<string, number>) => string;
}

export const DISTRIBUTIONS: Record<DistributionName, DistributionImpl> = {
  normal: {
    pdf(x, p) {
      const sigma = p.sigma ?? 1;
      const mu = p.mu ?? 0;
      return Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
    },
    sample(p) {
      const u1 = Math.random() || 1e-12;
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return (p.mu ?? 0) + (p.sigma ?? 1) * z;
    },
    range: (p) => [(p.mu ?? 0) - 4 * (p.sigma ?? 1), (p.mu ?? 0) + 4 * (p.sigma ?? 1)],
    paramDefs: [
      { key: 'mu', label: 'μ', default: 0 },
      { key: 'sigma', label: 'σ', default: 1 },
    ],
    latex: (p) => `\\mathcal{N}(${p.mu ?? 0},\\ ${(p.sigma ?? 1) ** 2})`,
  },
  binomial: {
    pdf(x, p) {
      const n = Math.round(p.n ?? 10);
      const pp = p.p ?? 0.5;
      const k = Math.round(x);
      if (k < 0 || k > n) return 0;
      return choose(n, k) * Math.pow(pp, k) * Math.pow(1 - pp, n - k);
    },
    sample(p) {
      const n = Math.round(p.n ?? 10);
      const pp = p.p ?? 0.5;
      let s = 0;
      for (let i = 0; i < n; i++) if (Math.random() < pp) s++;
      return s;
    },
    range: (p) => [0, Math.round(p.n ?? 10)],
    paramDefs: [
      { key: 'n', label: 'n', default: 20 },
      { key: 'p', label: 'p', default: 0.5 },
    ],
    latex: (p) => `\\operatorname{Binomial}(${p.n ?? 10},\\ ${p.p ?? 0.5})`,
  },
  poisson: {
    pdf(x, p) {
      const lambda = p.lambda ?? 3;
      const k = Math.round(x);
      if (k < 0) return 0;
      return Math.exp(-lambda + k * Math.log(lambda) - lgamma(k + 1));
    },
    sample(p) {
      const L = Math.exp(-(p.lambda ?? 3));
      let k = 0, ppp = 1;
      do { k++; ppp *= Math.random(); } while (ppp > L);
      return k - 1;
    },
    range: (p) => [0, Math.max(20, (p.lambda ?? 3) * 3)],
    paramDefs: [{ key: 'lambda', label: 'λ', default: 3 }],
    latex: (p) => `\\operatorname{Poisson}(${p.lambda ?? 3})`,
  },
  exponential: {
    pdf(x, p) {
      const lam = p.lambda ?? 1;
      return x < 0 ? 0 : lam * Math.exp(-lam * x);
    },
    sample(p) {
      const lam = p.lambda ?? 1;
      return -Math.log(Math.random() || 1e-12) / lam;
    },
    range: (p) => [0, 5 / (p.lambda ?? 1)],
    paramDefs: [{ key: 'lambda', label: 'λ', default: 1 }],
    latex: (p) => `\\operatorname{Exp}(${p.lambda ?? 1})`,
  },
  uniform: {
    pdf(x, p) {
      const a = p.a ?? 0, b = p.b ?? 1;
      return x >= a && x <= b ? 1 / (b - a) : 0;
    },
    sample(p) {
      const a = p.a ?? 0, b = p.b ?? 1;
      return a + Math.random() * (b - a);
    },
    range: (p) => [p.a ?? 0, p.b ?? 1],
    paramDefs: [{ key: 'a', label: 'a', default: 0 }, { key: 'b', label: 'b', default: 1 }],
    latex: (p) => `\\operatorname{Uniform}(${p.a ?? 0},\\ ${p.b ?? 1})`,
  },
  beta: {
    pdf(x, p) {
      const a = p.alpha ?? 2, b = p.beta ?? 2;
      if (x <= 0 || x >= 1) return 0;
      return Math.pow(x, a - 1) * Math.pow(1 - x, b - 1) / betaFn(a, b);
    },
    sample(p) {
      // ratio of gammas
      const ga = sampleGamma(p.alpha ?? 2);
      const gb = sampleGamma(p.beta ?? 2);
      return ga / (ga + gb);
    },
    range: () => [0, 1],
    paramDefs: [
      { key: 'alpha', label: 'α', default: 2 },
      { key: 'beta', label: 'β', default: 2 },
    ],
    latex: (p) => `\\operatorname{Beta}(${p.alpha ?? 2},\\ ${p.beta ?? 2})`,
  },
  gamma: {
    pdf(x, p) {
      const k = p.k ?? 2, th = p.theta ?? 1;
      if (x <= 0) return 0;
      return Math.exp(-x / th) * Math.pow(x, k - 1) / (Math.pow(th, k) * Math.exp(lgamma(k)));
    },
    sample(p) {
      return (p.theta ?? 1) * sampleGamma(p.k ?? 2);
    },
    range: (p) => [0, (p.k ?? 2) * (p.theta ?? 1) * 4],
    paramDefs: [
      { key: 'k', label: 'k', default: 2 },
      { key: 'theta', label: 'θ', default: 1 },
    ],
    latex: (p) => `\\operatorname{Gamma}(${p.k ?? 2},\\ ${p.theta ?? 1})`,
  },
  'chi-squared': {
    pdf(x, p) {
      const k = p.k ?? 3;
      if (x <= 0) return 0;
      return Math.pow(x, k / 2 - 1) * Math.exp(-x / 2) / (Math.pow(2, k / 2) * Math.exp(lgamma(k / 2)));
    },
    sample(p) {
      // sum of k squared standard normals
      const k = Math.round(p.k ?? 3);
      let s = 0;
      for (let i = 0; i < k; i++) {
        const u1 = Math.random() || 1e-12, u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        s += z * z;
      }
      return s;
    },
    range: (p) => [0, (p.k ?? 3) * 4],
    paramDefs: [{ key: 'k', label: 'k', default: 3 }],
    latex: (p) => `\\chi^2_{${p.k ?? 3}}`,
  },
};

// ----- helpers --------------------------------------------------------

function lgamma(x: number): number {
  // Stirling-with-correction. Adequate for plotting.
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
             -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  let xx = x - 1;
  let a = c[0]!;
  for (let i = 1; i < g + 2; i++) a += (c[i] ?? 0) / (xx + i);
  const t = xx + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (xx + 0.5) * Math.log(t) - t + Math.log(a);
}

function choose(n: number, k: number): number {
  return Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1));
}

function betaFn(a: number, b: number): number {
  return Math.exp(lgamma(a) + lgamma(b) - lgamma(a + b));
}

function sampleGamma(k: number): number {
  // Marsaglia and Tsang for k >= 1; Boost for k < 1.
  if (k < 1) return sampleGamma(k + 1) * Math.pow(Math.random() || 1e-12, 1 / k);
  const d = k - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x = 0, v = 0;
    do {
      const u1 = Math.random() || 1e-12, u2 = Math.random();
      x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      v = 1 + c * x;
    } while (v <= 0);
    v = v ** 3;
    const u = Math.random();
    if (u < 1 - 0.0331 * x ** 4) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
