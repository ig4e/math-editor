// Polynomial regression: paste CSV-ish (x, y) pairs, pick a degree,
// see the fitted curve over the points. R² in the result card.

import { useMemo, useState } from 'react';
import { regress, coefficientsToLatex } from '../../../ml/regression';
import { Card, Slider, Button } from '../../../components/common';
import { ReadOnlyMathField } from '../../solver/ReadOnlyMathField';
import { useStore } from '../../../state/store';
import { Icon } from '../../../components/Icons';

const SAMPLE = `0,1
1,2.7
2,4.5
3,5.9
4,7.1
5,8.5`;

export function RegressionMode() {
  const [csv, setCsv] = useState<string>(SAMPLE);
  const [degree, setDegree] = useState<number>(1);
  const addMathBlock = useStore((s) => s.addMathBlock);
  const toast = useStore((s) => s.toast);

  const { xs, ys } = useMemo(() => {
    const xs: number[] = []; const ys: number[] = [];
    for (const row of csv.trim().split(/\n+/)) {
      const [a, b] = row.split(/[,\s]+/).map(Number);
      if (Number.isFinite(a) && Number.isFinite(b)) {
        xs.push(a!); ys.push(b!);
      }
    }
    return { xs, ys };
  }, [csv]);

  const fit = useMemo(() => xs.length >= degree + 1 ? regress(xs, ys, degree) : null, [xs, ys, degree]);

  const pin = () => {
    if (!fit) return;
    const latex = `y = ${coefficientsToLatex(fit.coefficients)}`;
    addMathBlock({ x: 220, y: 220, latex });
    toast('Fit pinned to canvas', 'success');
  };

  // Build the SVG.
  const view = useMemo(() => {
    if (xs.length === 0) return null;
    const xMin = Math.min(...xs), xMax = Math.max(...xs) || 1;
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const ySpan = (yMax - yMin) || 1;
    const W = 600, H = 300;
    const sx = (x: number) => 10 + ((x - xMin) / Math.max(1, xMax - xMin)) * (W - 20);
    const sy = (y: number) => H - 10 - ((y - yMin) / ySpan) * (H - 20);
    const curve: string[] = [];
    if (fit) {
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        const yPred = fit.predict(x);
        if (Number.isFinite(yPred)) curve.push(`${i === 0 ? 'M' : 'L'} ${sx(x)} ${sy(yPred)}`);
      }
    }
    return { sx, sy, curve: curve.join(' '), W, H };
  }, [fit, xs, ys]);

  return (
    <div className="flex flex-col gap-3">
      <Card title="Points (x, y per line)">
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.currentTarget.value)}
          rows={5}
          className="w-full font-mono text-xs p-2 rounded bg-surface-2 text-fg outline-none border border-border"
        />
      </Card>
      <Card title={`Polynomial degree: ${degree}`}>
        <Slider value={degree} min={0} max={6} step={1} onValueChange={setDegree} ariaLabel="Degree" />
      </Card>
      {fit && view && (
        <Card
          title={`Fit (R² = ${fit.rSquared.toFixed(4)})`}
          tone="accent"
          titleActions={
            <Button size="sm" variant="ghost" onClick={pin}>
              <Icon name="plus" /> Pin to canvas
            </Button>
          }
        >
          <ReadOnlyMathField latex={`y = ${coefficientsToLatex(fit.coefficients)}`} />
          <svg viewBox={`0 0 ${view.W} ${view.H}`} className="w-full h-72 mt-3" preserveAspectRatio="none">
            {/* points */}
            {xs.map((x, i) => (
              <circle key={i} cx={view.sx(x)} cy={view.sy(ys[i]!)} r="3" fill="var(--color-accent)" />
            ))}
            <path d={view.curve} fill="none" stroke="var(--color-fg-2)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </Card>
      )}
    </div>
  );
}
