// Static formula sheet. Each entry is a LaTeX string + a one-liner.
// Curriculum filtering (P16) reads from the `curricula` tag list.

export type CurriculumTag = 'ap-calc' | 'ib' | 'a-level' | 'cc-hs' | 'gre' | 'all';

export interface Formula {
  id: string;
  category: string;
  label: string;
  latex: string;
  description?: string;
  curricula: readonly CurriculumTag[];
}

export const FORMULAS: readonly Formula[] = [
  // ---------- Algebra ----------
  { id: 'quadratic-formula', category: 'Algebra', label: 'Quadratic formula',
    latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    description: 'Roots of ax² + bx + c = 0.',
    curricula: ['all'] },
  { id: 'binomial', category: 'Algebra', label: 'Binomial theorem',
    latex: '(a+b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k',
    curricula: ['all'] },
  { id: 'difference-of-squares', category: 'Algebra', label: 'Difference of squares',
    latex: 'a^2 - b^2 = (a+b)(a-b)',
    curricula: ['cc-hs', 'gre', 'all'] },
  { id: 'sum-cubes', category: 'Algebra', label: 'Sum of cubes',
    latex: 'a^3 + b^3 = (a+b)(a^2 - ab + b^2)',
    curricula: ['all'] },

  // ---------- Trigonometry ----------
  { id: 'pythag-identity', category: 'Trigonometry', label: 'Pythagorean identity',
    latex: '\\sin^2\\theta + \\cos^2\\theta = 1',
    curricula: ['all'] },
  { id: 'double-angle-sin', category: 'Trigonometry', label: 'Double angle (sin)',
    latex: '\\sin(2\\theta) = 2\\sin\\theta\\cos\\theta',
    curricula: ['all'] },
  { id: 'double-angle-cos', category: 'Trigonometry', label: 'Double angle (cos)',
    latex: '\\cos(2\\theta) = \\cos^2\\theta - \\sin^2\\theta',
    curricula: ['all'] },
  { id: 'sum-sin', category: 'Trigonometry', label: 'Sum (sin)',
    latex: '\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta',
    curricula: ['all'] },
  { id: 'sum-cos', category: 'Trigonometry', label: 'Sum (cos)',
    latex: '\\cos(\\alpha + \\beta) = \\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta',
    curricula: ['all'] },
  { id: 'law-of-cosines', category: 'Trigonometry', label: 'Law of cosines',
    latex: 'c^2 = a^2 + b^2 - 2ab\\cos C',
    curricula: ['all'] },

  // ---------- Calculus ----------
  { id: 'derivative-power', category: 'Calculus', label: 'Power rule',
    latex: '\\frac{d}{dx} x^n = n x^{n-1}',
    curricula: ['ap-calc', 'ib', 'a-level', 'all'] },
  { id: 'derivative-product', category: 'Calculus', label: 'Product rule',
    latex: '(fg)\'\\, = f\'g + fg\'',
    curricula: ['ap-calc', 'ib', 'a-level', 'all'] },
  { id: 'derivative-quotient', category: 'Calculus', label: 'Quotient rule',
    latex: '\\left(\\frac{f}{g}\\right)\' = \\frac{f\'g - fg\'}{g^2}',
    curricula: ['ap-calc', 'ib', 'a-level', 'all'] },
  { id: 'derivative-chain', category: 'Calculus', label: 'Chain rule',
    latex: '\\frac{d}{dx} f(g(x)) = f\'(g(x)) \\cdot g\'(x)',
    curricula: ['ap-calc', 'ib', 'a-level', 'all'] },
  { id: 'integral-power', category: 'Calculus', label: 'Power rule (integral)',
    latex: '\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)',
    curricula: ['ap-calc', 'ib', 'a-level', 'all'] },
  { id: 'fundamental-thm', category: 'Calculus', label: 'Fundamental theorem',
    latex: '\\int_a^b f\'(x)\\, dx = f(b) - f(a)',
    curricula: ['ap-calc', 'ib', 'a-level', 'all'] },
  { id: 'integration-by-parts', category: 'Calculus', label: 'Integration by parts',
    latex: '\\int u\\, dv = uv - \\int v\\, du',
    curricula: ['ap-calc', 'ib', 'a-level', 'all'] },
  { id: 'taylor', category: 'Calculus', label: 'Taylor series',
    latex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n',
    curricula: ['ap-calc', 'ib', 'a-level'] },

  // ---------- Linear algebra ----------
  { id: 'determinant-2', category: 'Linear algebra', label: 'Determinant 2×2',
    latex: '\\det \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc',
    curricula: ['all'] },
  { id: 'inverse-2', category: 'Linear algebra', label: 'Inverse 2×2',
    latex: 'A^{-1} = \\frac{1}{\\det A} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}',
    curricula: ['all'] },
  { id: 'eigenvalue', category: 'Linear algebra', label: 'Characteristic polynomial',
    latex: '\\det(A - \\lambda I) = 0',
    curricula: ['all'] },

  // ---------- Probability & Stats ----------
  { id: 'expected-value', category: 'Probability', label: 'Expected value',
    latex: 'E[X] = \\sum_i x_i \\, p_i',
    curricula: ['all'] },
  { id: 'variance', category: 'Probability', label: 'Variance',
    latex: '\\operatorname{Var}(X) = E[X^2] - (E[X])^2',
    curricula: ['all'] },
  { id: 'bayes', category: 'Probability', label: "Bayes' theorem",
    latex: 'P(A \\mid B) = \\frac{P(B \\mid A)\\, P(A)}{P(B)}',
    curricula: ['all'] },
  { id: 'normal-pdf', category: 'Probability', label: 'Normal PDF',
    latex: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}',
    curricula: ['all'] },

  // ---------- Constants ----------
  { id: 'pi', category: 'Constants', label: 'π',
    latex: '\\pi \\approx 3.14159\\,26535',
    curricula: ['all'] },
  { id: 'e', category: 'Constants', label: 'e',
    latex: 'e \\approx 2.71828\\,18284',
    curricula: ['all'] },
  { id: 'golden', category: 'Constants', label: 'Golden ratio',
    latex: '\\varphi = \\frac{1 + \\sqrt{5}}{2} \\approx 1.61803',
    curricula: ['all'] },
  { id: 'planck', category: 'Constants', label: 'Planck constant',
    latex: 'h \\approx 6.62607 \\times 10^{-34} \\text{ J·s}',
    curricula: ['all'] },
  { id: 'gravity-const', category: 'Constants', label: 'Gravitational acceleration',
    latex: 'g \\approx 9.80665 \\text{ m/s}^2',
    curricula: ['all'] },
];

export function uniqueCategories(): string[] {
  return [...new Set(FORMULAS.map((f) => f.category))];
}
