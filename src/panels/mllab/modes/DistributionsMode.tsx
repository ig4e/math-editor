// Distribution playground. Pick a distribution, adjust parameters
// (sliders), plot the PDF, optionally sample N draws as a histogram.

import { useMemo, useState } from 'react';
import { DISTRIBUTIONS, type DistributionName } from '../../../ml/distributions';
import { Card, Field, Select, Slider, Button, Input } from '../../../components/common';
import { ReadOnlyMathField } from '../../solver/ReadOnlyMathField';
import { Icon } from '../../../components/Icons';

const NAMES: { value: DistributionName; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'binomial', label: 'Binomial' },
  { value: 'poisson', label: 'Poisson' },
  { value: 'exponential', label: 'Exponential' },
  { value: 'uniform', label: 'Uniform' },
  { value: 'beta', label: 'Beta' },
  { value: 'gamma', label: 'Gamma' },
  { value: 'chi-squared', label: 'Chi-squared' },
];

export function DistributionsMode() {
  const [name, setName] = useState<DistributionName>('normal');
  const dist = DISTRIBUTIONS[name];
  const [params, setParams] = useState<Record<string, number>>(() => fromDefs(dist.paramDefs));
  const [samples, setSamples] = useState<number[]>([]);
  const [sampleN, setSampleN] = useState<number>(500);

  const onName = (n: string) => {
    const next = n as DistributionName;
    setName(next);
    setParams(fromDefs(DISTRIBUTIONS[next].paramDefs));
    setSamples([]);
  };

  const [xMin, xMax] = dist.range(params);
  const curve = useMemo(() => {
    const steps = 200;
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      out.push({ x, y: dist.pdf(x, params) });
    }
    return out;
  }, [dist, params, xMin, xMax]);

  const sample = () => {
    const out: number[] = [];
    for (let i = 0; i < sampleN; i++) out.push(dist.sample(params));
    setSamples(out);
  };

  return (
    <div className="flex flex-col gap-3">
      <Card title="Pick distribution">
        <Field label="Distribution" inline>
          {() => <Select value={name} onValueChange={onName} items={NAMES} ariaLabel="Distribution" />}
        </Field>
        <div className="mt-2 flex flex-col gap-2">
          {dist.paramDefs.map((p) => (
            <Field key={p.key} label={p.label} inline>
              {() => (
                <div className="flex items-center gap-2 flex-1">
                  <Slider
                    value={params[p.key] ?? p.default}
                    min={p.default <= 0 ? -3 : 0.1}
                    max={p.default <= 0 ? 3 : Math.max(20, p.default * 4)}
                    step={p.default < 1 ? 0.01 : 0.1}
                    onValueChange={(v) => setParams((cur) => ({ ...cur, [p.key]: v }))}
                    ariaLabel={p.label}
                    className="flex-1"
                  />
                  <span className="font-mono text-xs text-fg w-12 text-right">{(params[p.key] ?? p.default).toFixed(3)}</span>
                </div>
              )}
            </Field>
          ))}
        </div>
      </Card>
      <Card title="PDF" tone="accent">
        <ReadOnlyMathField latex={dist.latex(params)} />
        <PDFPlot curve={curve} samples={samples} />
      </Card>
      <Card title="Samples">
        <div className="flex items-center gap-2">
          <Field label="N" inline>
            {() => <Input type="number" value={sampleN} onChange={(e) => setSampleN(Number(e.currentTarget.value))} />}
          </Field>
          <Button size="sm" variant="secondary" onClick={sample}>
            <Icon name="refresh" /> Sample
          </Button>
          {samples.length > 0 && <span className="text-xs text-fg-muted">{samples.length} draws</span>}
        </div>
      </Card>
    </div>
  );
}

function fromDefs(defs: readonly { key: string; default: number }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of defs) out[d.key] = d.default;
  return out;
}

function PDFPlot({ curve, samples }: { curve: { x: number; y: number }[]; samples: number[] }) {
  const xMin = curve[0]?.x ?? 0;
  const xMax = curve[curve.length - 1]?.x ?? 1;
  const yMax = Math.max(...curve.map((p) => p.y), 0.1);
  const W = 600, H = 240;
  const sx = (x: number) => 10 + ((x - xMin) / (xMax - xMin)) * (W - 20);
  const sy = (y: number) => H - 10 - (y / yMax) * (H - 20);
  const path = curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.x)} ${sy(p.y)}`).join(' ');

  // histogram
  const BINS = 40;
  const counts = new Array(BINS).fill(0) as number[];
  let total = 0;
  for (const s of samples) {
    if (s < xMin || s > xMax) continue;
    const b = Math.min(BINS - 1, Math.floor(((s - xMin) / (xMax - xMin)) * BINS));
    counts[b]!++;
    total++;
  }
  const binW = (xMax - xMin) / BINS;
  const hist = total > 0 ? counts.map((c) => c / (total * binW)) : null;
  const histMax = hist ? Math.max(...hist, yMax) : yMax;
  const hsy = (y: number) => H - 10 - (y / histMax) * (H - 20);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-60 mt-2" preserveAspectRatio="none">
      <line x1="10" y1={H - 10} x2={W - 10} y2={H - 10} stroke="var(--color-border)" />
      {hist && hist.map((h, i) => (
        <rect
          key={i}
          x={sx(xMin + i * binW)}
          y={hsy(h)}
          width={(W - 20) / BINS - 1}
          height={H - 10 - hsy(h)}
          fill="var(--color-accent)"
          opacity="0.2"
        />
      ))}
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
