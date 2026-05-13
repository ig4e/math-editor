// Compare standard activation functions visually. Plots all selected
// activations on a single SVG over x ∈ [-6, 6] so the reader can see
// where they differ.

import { useMemo, useState } from 'react';
import { ACTIVATIONS, ACTIVATION_LABELS, activationLatex, type ActivationName } from '../../../ml/activations';
import { Card } from '../../../components/common';
import { ReadOnlyMathField } from '../../solver/ReadOnlyMathField';
import { cx } from '../../../utils/cx';

const ALL: ActivationName[] = ['sigmoid', 'tanh', 'relu', 'leaky-relu', 'gelu', 'swish', 'softplus'];
const COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#0ea5e9'];

export function ActivationsMode() {
  const [active, setActive] = useState<Set<ActivationName>>(new Set(['sigmoid', 'tanh', 'relu']));

  const lines = useMemo(() => {
    const xs: number[] = [];
    for (let x = -6; x <= 6; x += 0.05) xs.push(x);
    return ALL.map((name, i) => ({
      name,
      color: COLORS[i % COLORS.length]!,
      points: xs.map((x) => ({ x, y: ACTIVATIONS[name](x) })),
    }));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <Card title="Pick activations">
        <div className="flex flex-wrap gap-1">
          {ALL.map((name, i) => {
            void i;
            return (
            // eslint-disable-next-line no-restricted-syntax -- chip-style toggle picker; ButtonGroup primitive lands in a future refactor
            <button
              key={name}
              type="button"
              onClick={() => setActive((cur) => {
                const next = new Set(cur);
                if (next.has(name)) next.delete(name); else next.add(name);
                return next;
              })}
              className={cx(
                'inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs',
                'border transition-colors duration-100',
                active.has(name)
                  ? 'bg-accent-bg border-accent-border text-accent'
                  : 'bg-surface border-border text-fg-2 hover:bg-surface-2',
              )}
            >
              <span className="w-2 h-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
              {ACTIVATION_LABELS[name]}
            </button>
          );})}
        </div>
      </Card>
      <Card title="Comparison">
        <svg viewBox="0 0 600 320" preserveAspectRatio="none" className="w-full h-72">
          {/* Axes */}
          <line x1="0" y1="160" x2="600" y2="160" stroke="var(--color-border)" />
          <line x1="300" y1="0" x2="300" y2="320" stroke="var(--color-border)" />
          {lines.filter((l) => active.has(l.name)).map((l) => (
            <polyline
              key={l.name}
              points={l.points.map((p) => `${(p.x + 6) * 50},${160 - clamp(p.y, -3, 3) * 50}`).join(' ')}
              fill="none"
              stroke={l.color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </Card>
      <Card title="Definitions">
        <div className="flex flex-col gap-2">
          {[...active].map((name) => (
            <div key={name} className="flex items-center gap-2 text-xs">
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ background: COLORS[ALL.indexOf(name) % COLORS.length] }}
              />
              <span className="text-fg-muted w-20">{ACTIVATION_LABELS[name]}</span>
              <ReadOnlyMathField latex={activationLatex(name)} inline />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
