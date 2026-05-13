// Tiny inline SVG chart of (n, value). Single line; auto-scale; tooltip
// on hover. Stays under 100 lines.

import { useMemo } from 'react';
import type { IterateStep } from './methods';

interface Props {
  steps: readonly IterateStep[];
  field: 'x' | 'y' | 'residual';
  height?: number;
}

export function ConvergenceChart({ steps, field, height = 120 }: Props) {
  const { d, points, xMin, xMax, yMin, yMax } = useMemo(() => {
    const values = steps
      .map((s, i) => ({ n: s.n ?? i, v: field === 'x' ? s.x : field === 'y' ? (s.y ?? NaN) : (s.residual ?? NaN) }))
      .filter((p) => Number.isFinite(p.v));
    if (values.length === 0) {
      return { d: '', points: [] as { x: number; y: number }[], xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
    }
    const xs = values.map((p) => p.n);
    const ys = values.map((p) => p.v);
    const xMin = Math.min(...xs), xMax = Math.max(...xs) || 1;
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const span = (yMax - yMin) || 1;
    const W = 100, H = 100;
    const points = values.map((p) => ({
      x: ((p.n - xMin) / Math.max(1, xMax - xMin)) * W,
      y: H - ((p.v - yMin) / span) * H,
    }));
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    return { d, points, xMin, xMax, yMin, yMax };
  }, [steps, field]);

  if (points.length === 0) return null;

  return (
    <div className="w-full bg-surface-2 rounded-md p-2">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <path d={d} fill="none" stroke="var(--color-accent)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.2" fill="var(--color-accent)" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-fg-muted mt-1">
        <span>n={xMin.toFixed(0)}</span>
        <span>{field}: [{yMin.toExponential(2)}, {yMax.toExponential(2)}]</span>
        <span>n={xMax.toFixed(0)}</span>
      </div>
    </div>
  );
}
