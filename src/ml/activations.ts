// Standard activation functions. Pure JS; the MLLab Activations mode
// plots them side-by-side over a fixed x range.

export type ActivationName =
  | 'sigmoid' | 'tanh' | 'relu' | 'leaky-relu' | 'gelu' | 'swish' | 'softplus';

export const ACTIVATIONS: Record<ActivationName, (x: number) => number> = {
  'sigmoid':     (x) => 1 / (1 + Math.exp(-x)),
  'tanh':        (x) => Math.tanh(x),
  'relu':        (x) => Math.max(0, x),
  'leaky-relu':  (x) => x >= 0 ? x : 0.01 * x,
  // GELU (Gaussian Error Linear Unit) approximation
  'gelu':        (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))),
  'swish':       (x) => x / (1 + Math.exp(-x)),
  'softplus':    (x) => Math.log1p(Math.exp(x)),
};

export const ACTIVATION_LABELS: Record<ActivationName, string> = {
  'sigmoid':    'Sigmoid',
  'tanh':       'tanh',
  'relu':       'ReLU',
  'leaky-relu': 'Leaky ReLU',
  'gelu':       'GELU',
  'swish':      'Swish',
  'softplus':   'Softplus',
};

export function activationLatex(name: ActivationName): string {
  switch (name) {
    case 'sigmoid':    return '\\sigma(x) = \\frac{1}{1 + e^{-x}}';
    case 'tanh':       return '\\tanh(x)';
    case 'relu':       return '\\operatorname{ReLU}(x) = \\max(0, x)';
    case 'leaky-relu': return '\\operatorname{LReLU}(x) = \\begin{cases} x & x \\geq 0 \\\\ 0.01 x & x < 0 \\end{cases}';
    case 'gelu':       return '\\operatorname{GELU}(x) \\approx 0.5 x \\left(1 + \\tanh\\!\\left(\\sqrt{2/\\pi}(x + 0.0447 x^3)\\right)\\right)';
    case 'swish':      return '\\operatorname{Swish}(x) = \\frac{x}{1 + e^{-x}}';
    case 'softplus':   return '\\operatorname{Softplus}(x) = \\ln(1 + e^x)';
  }
}
