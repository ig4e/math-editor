// Gradient descent / optimizer playground for 1D and 2D loss surfaces.
// Plots the optimizer path over the loss function.

import { useMemo, useState } from 'react';
import { descend1D, descend2D, type DescentPath1D, type DescentPath2D } from '../../../ml/descent';
import { compileFunction } from '../../../graphers/detectSpec';
import { compileMulti } from '../../../graphers/compileMulti';
import type { OptimizerName } from '../../../ml/optimizers';
import { Card, Field, Input, Select, Button } from '../../../components/common';
import { Icon } from '../../../components/Icons';
import { useStore } from '../../../state/store';

const OPTS: { value: OptimizerName; label: string }[] = [
  { value: 'sgd', label: 'SGD' },
  { value: 'momentum', label: 'Momentum' },
  { value: 'rmsprop', label: 'RMSprop' },
  { value: 'adam', label: 'Adam' },
];

export function DescentMode() {
  const [mode, setMode] = useState<'1d' | '2d'>('1d');
  const [expr, setExpr] = useState<string>('(x - 3)^2');
  const [expr2, setExpr2] = useState<string>('x^2 + y^2');
  const [x0, setX0] = useState<number>(0);
  const [y0, setY0] = useState<number>(0);
  const [lr, setLr] = useState<number>(0.1);
  const [optimizer, setOptimizer] = useState<OptimizerName>('sgd');
  const addMathBlock = useStore((s) => s.addMathBlock);
  const toast = useStore((s) => s.toast);

  const result = useMemo<DescentPath1D | DescentPath2D | null>(() => {
    try {
      if (mode === '1d') return descend1D({ expr, x0, optimizer, lr });
      return descend2D({ expr: expr2, x0, y0, optimizer, lr });
    } catch { return null; }
  }, [mode, expr, expr2, x0, y0, optimizer, lr]);

  return (
    <div className="flex flex-col gap-3">
      <Card title="Setup">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Dim" inline>
            {() => (
              <Select
                value={mode}
                onValueChange={(v) => setMode(v as '1d' | '2d')}
                items={[{ value: '1d', label: '1D' }, { value: '2d', label: '2D' }]}
                ariaLabel="Dimension"
              />
            )}
          </Field>
          <Field label="Optimizer" inline>
            {() => (
              <Select
                value={optimizer}
                onValueChange={(v) => setOptimizer(v as OptimizerName)}
                items={OPTS}
                ariaLabel="Optimizer"
              />
            )}
          </Field>
          <Field label={mode === '1d' ? 'f(x)' : 'f(x, y)'} inline>
            {() => (
              <Input
                value={mode === '1d' ? expr : expr2}
                onChange={(e) => (mode === '1d' ? setExpr : setExpr2)(e.currentTarget.value)}
                className="font-mono flex-1 min-w-0"
              />
            )}
          </Field>
          <Field label="Learning rate" inline>
            {() => <Input type="number" value={lr} onChange={(e) => setLr(Number(e.currentTarget.value))} />}
          </Field>
          <Field label="x₀" inline>
            {() => <Input type="number" value={x0} onChange={(e) => setX0(Number(e.currentTarget.value))} />}
          </Field>
          {mode === '2d' && (
            <Field label="y₀" inline>
              {() => <Input type="number" value={y0} onChange={(e) => setY0(Number(e.currentTarget.value))} />}
            </Field>
          )}
        </div>
      </Card>
      {result && (
        <Card
          title="Trajectory"
          tone="accent"
          titleActions={
            <Button size="sm" variant="ghost" onClick={() => {
              if (mode === '1d') {
                const r = result as DescentPath1D;
                const final = r.xs[r.xs.length - 1] ?? NaN;
                addMathBlock({ x: 220, y: 220, latex: `x^* \\approx ${final.toFixed(6)}` });
              } else {
                const r = result as DescentPath2D;
                const fx = r.xs[r.xs.length - 1] ?? NaN;
                const fy = r.ys[r.ys.length - 1] ?? NaN;
                addMathBlock({ x: 220, y: 220, latex: `(x^*, y^*) \\approx (${fx.toFixed(4)},\\ ${fy.toFixed(4)})` });
              }
              toast('Pinned to canvas', 'success');
            }}>
              <Icon name="plus" /> Pin
            </Button>
          }
        >
          {mode === '1d'
            ? <Plot1D result={result as DescentPath1D} expr={expr} />
            : <Plot2D result={result as DescentPath2D} expr={expr2} />}
          <div className="text-xs text-fg-muted mt-2">
            optimizer={optimizer} · lr={lr} · {result.xs.length} steps
          </div>
        </Card>
      )}
    </div>
  );
}

function Plot1D({ result, expr }: { result: DescentPath1D; expr: string }) {
  const f = compileFunction(expr, 'x');
  const xs = result.xs;
  const xMin = Math.min(...xs, -1) - 1;
  const xMax = Math.max(...xs, 1) + 1;
  const samples: { x: number; y: number }[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = xMin + (i / 200) * (xMax - xMin);
    samples.push({ x, y: f(x) });
  }
  const ys = samples.map((s) => s.y).concat(result.ys);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const ySpan = (yMax - yMin) || 1;
  const W = 600, H = 280;
  const sx = (x: number) => 10 + ((x - xMin) / (xMax - xMin)) * (W - 20);
  const sy = (y: number) => H - 10 - ((y - yMin) / ySpan) * (H - 20);
  const curve = samples.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`).join(' ');
  const path = result.xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${sx(x)} ${sy(result.ys[i]!)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-72" preserveAspectRatio="none">
      <path d={curve} fill="none" stroke="var(--color-fg-2)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      {result.xs.map((x, i) => (
        <circle key={i} cx={sx(x)} cy={sy(result.ys[i]!)} r="2" fill="var(--color-accent)" />
      ))}
    </svg>
  );
}

function Plot2D({ result, expr }: { result: DescentPath2D; expr: string }) {
  const f = compileMulti(expr);
  const xs = result.xs;
  const ys = result.ys;
  const xMin = Math.min(...xs) - 1;
  const xMax = Math.max(...xs) + 1;
  const yMin = Math.min(...ys) - 1;
  const yMax = Math.max(...ys) + 1;

  // Compute contour-ish background by sampling f on a grid + coloring
  // each cell by intensity.
  const grid = 40;
  const cells: { x: number; y: number; v: number }[] = [];
  let vMin = Infinity, vMax = -Infinity;
  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      const gx = xMin + (i / (grid - 1)) * (xMax - xMin);
      const gy = yMin + (j / (grid - 1)) * (yMax - yMin);
      const v = f({ x: gx, y: gy });
      if (Number.isFinite(v)) {
        if (v < vMin) vMin = v;
        if (v > vMax) vMax = v;
      }
      cells.push({ x: gx, y: gy, v });
    }
  }
  const vSpan = (vMax - vMin) || 1;

  const W = 600, H = 320;
  const sx = (x: number) => 10 + ((x - xMin) / (xMax - xMin)) * (W - 20);
  const sy = (y: number) => H - 10 - ((y - yMin) / (yMax - yMin)) * (H - 20);
  const cw = (W - 20) / grid;
  const ch = (H - 20) / grid;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-80" preserveAspectRatio="none">
      {cells.map((c, idx) => {
        const t = (c.v - vMin) / vSpan;
        const intensity = Math.round(255 * Math.max(0, Math.min(1, 1 - t)));
        const fill = `rgb(${intensity}, ${intensity}, ${255})`;
        return <rect key={idx} x={sx(c.x) - cw / 2} y={sy(c.y) - ch / 2} width={cw} height={ch} fill={fill} opacity="0.5" />;
      })}
      <polyline
        points={result.xs.map((x, i) => `${sx(x)},${sy(result.ys[i]!)}`).join(' ')}
        fill="none"
        stroke="var(--color-danger)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      {result.xs.map((x, i) => (
        <circle key={i} cx={sx(x)} cy={sy(result.ys[i]!)} r="2" fill="var(--color-danger)" />
      ))}
    </svg>
  );
}
