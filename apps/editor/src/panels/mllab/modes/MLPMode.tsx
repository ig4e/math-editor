// Tiny MLP forward-pass visualiser. The user picks an architecture
// (input → hidden → output dims) and an activation; we initialise
// random weights and trace activations through each layer.

import { useMemo, useState } from 'react';
import { Card, Field, Input, Select } from '../../../components/common';
import { ACTIVATIONS, type ActivationName } from '../../../ml/activations';
import { cx } from '../../../utils/cx';

const ACTS: { value: ActivationName; label: string }[] = [
  { value: 'sigmoid', label: 'sigmoid' },
  { value: 'tanh',    label: 'tanh' },
  { value: 'relu',    label: 'ReLU' },
  { value: 'gelu',    label: 'GELU' },
];

export function MLPMode() {
  const [dims, setDims] = useState<number[]>([3, 4, 2]);
  const [act, setAct] = useState<ActivationName>('relu');
  const [seed, setSeed] = useState<number>(1);
  const [input, setInput] = useState<string>('1,0.5,-0.3');

  const { weights, biases } = useMemo(() => initParams(dims, seed), [dims, seed]);

  const x0 = useMemo(() => input.split(/[,\s]+/).map(Number).filter(Number.isFinite), [input]);

  const layers = useMemo(() => {
    const out: { z: number[]; a: number[] }[] = [];
    let h = x0.length === dims[0] ? x0 : new Array(dims[0]).fill(0);
    for (let l = 0; l < weights.length; l++) {
      const W = weights[l]!;
      const b = biases[l]!;
      const z = mulvec(W, h, b);
      const a = z.map((v) => ACTIVATIONS[act](v));
      out.push({ z, a });
      h = a;
    }
    return out;
  }, [weights, biases, x0, dims, act]);

  return (
    <div className="flex flex-col gap-3">
      <Card title="Architecture">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Layer dims" inline>
            {() => (
              <Input
                value={dims.join(', ')}
                onChange={(e) => {
                  const next = e.currentTarget.value.split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0);
                  if (next.length >= 2) setDims(next);
                }}
                className="font-mono"
                placeholder="e.g. 3, 4, 2"
              />
            )}
          </Field>
          <Field label="Activation" inline>
            {() => <Select value={act} onValueChange={(v) => setAct(v as ActivationName)} items={ACTS} ariaLabel="Activation" />}
          </Field>
          <Field label="Seed" inline>
            {() => <Input type="number" value={seed} onChange={(e) => setSeed(Number(e.currentTarget.value))} />}
          </Field>
          <Field label="Input" inline>
            {() => <Input value={input} onChange={(e) => setInput(e.currentTarget.value)} className="font-mono" />}
          </Field>
        </div>
      </Card>
      <Card title="Forward pass" tone="accent">
        <div className="flex flex-row gap-6 items-start overflow-auto">
          <LayerCol label="x" values={x0} />
          {layers.map((l, i) => (
            <LayerCol key={i} label={`a^${i + 1}`} values={l.a} />
          ))}
        </div>
        <div className="text-xs text-fg-muted mt-3">
          Random weights with seeded init · matrices are {dims.slice(1).map((d, i) => `${d}×${dims[i]}`).join(', ')}
        </div>
      </Card>
    </div>
  );
}

function LayerCol({ label, values }: { label: string; values: readonly number[] }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] uppercase tracking-wide text-fg-muted">{label}</div>
      {values.map((v, i) => (
        <div
          key={i}
          className={cx(
            'w-12 h-9 rounded-md inline-flex items-center justify-center font-mono text-xs',
            v >= 0 ? 'bg-accent-bg text-accent' : 'bg-danger/10 text-danger',
          )}
        >
          {v.toFixed(2)}
        </div>
      ))}
    </div>
  );
}

// ----- helpers --------------------------------------------------------

function mulberry32(seed: number): () => number {
  let t = seed | 0;
  return () => {
    t = (t + 0x6D2B79F5) | 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function initParams(dims: number[], seed: number): { weights: number[][][]; biases: number[][] } {
  const rng = mulberry32(seed);
  const weights: number[][][] = [];
  const biases: number[][] = [];
  for (let l = 0; l < dims.length - 1; l++) {
    const inDim = dims[l]!;
    const outDim = dims[l + 1]!;
    const scale = Math.sqrt(2 / inDim);
    const W: number[][] = [];
    for (let i = 0; i < outDim; i++) {
      const row: number[] = [];
      for (let j = 0; j < inDim; j++) row.push((rng() * 2 - 1) * scale);
      W.push(row);
    }
    weights.push(W);
    biases.push(new Array(outDim).fill(0));
  }
  return { weights, biases };
}

function mulvec(W: number[][], x: number[], b: number[]): number[] {
  return W.map((row, i) => row.reduce((s, w, j) => s + w * (x[j] ?? 0), 0) + (b[i] ?? 0));
}
