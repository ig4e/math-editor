// Live training with TensorFlow.js autograd. Lazy-loads tfjs on first
// click of "Train" — the package is in optionalDependencies, so self-
// hosters who `npm i --omit=optional` get a friendly error toast.
//
// The mode demos the underlying gradient descent on a scalar regression
// problem (one input, one output). The loss curve renders in an inline
// SVG; final weights can be pinned to the canvas as math blocks.

import { useMemo, useRef, useState } from 'react';
import { Card, Slider, Button, Banner, Spinner } from '../../../components/common';
import { Icon } from '../../../components/Icons';
import { useStore } from '../../../state/store';
import type { TrainPoint, TrainResult } from '../ml/tfjsTrain';

const SAMPLE = `0,1
0.5,1.8
1,2.7
1.5,3.2
2,4.5
2.5,5.4
3,5.9
3.5,7
4,7.1
4.5,8
5,8.5`;

export function TrainMode() {
  const [csv, setCsv] = useState<string>(SAMPLE);
  const [hidden, setHidden] = useState<number>(0);      // 0 = linear
  const [epochs, setEpochs] = useState<number>(50);
  const [lr, setLr] = useState<number>(0.05);
  const [losses, setLosses] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrainResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const addMathBlock = useStore((s) => s.addMathBlock);
  const toast = useStore((s) => s.toast);

  const points: TrainPoint[] = useMemo(() => {
    const out: TrainPoint[] = [];
    for (const row of csv.trim().split(/\n+/)) {
      const [a, b] = row.split(/[,\s]+/).map(Number);
      if (Number.isFinite(a) && Number.isFinite(b)) out.push({ x: a!, y: b! });
    }
    return out;
  }, [csv]);

  const train = async () => {
    if (points.length < 2) { toast('Need at least 2 points', 'warn'); return; }
    setBusy(true);
    setError(null);
    setLosses([]);
    setResult(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const { trainScalar } = await import('../ml/tfjsTrain');
      const r = await trainScalar(points, {
        hidden: hidden === 0 ? [] : new Array(1).fill(hidden),
        epochs,
        learningRate: lr,
        signal: abortRef.current.signal,
        onEpoch: (_epoch, loss) => {
          setLosses((prev) => [...prev, loss]);
        },
      });
      setResult(r);
      toast(`Trained ${epochs} epochs, final loss ${r.finalLoss.toFixed(4)}`, 'success');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => { abortRef.current?.abort(); };

  const pinWeights = () => {
    if (!result) return;
    const lines = result.weights.map((w, i) => `\\text{layer ${i}: } [${w.map((v) => v.toFixed(3)).join(', ')}]`);
    addMathBlock({ x: 220, y: 220, latex: lines.join(' \\\\ ') });
    toast('Weights pinned to canvas', 'success');
  };

  // Loss-curve SVG.
  const lossView = useMemo(() => {
    if (losses.length < 2) return null;
    const W = 600, H = 200, pad = 20;
    const yMin = Math.min(...losses), yMax = Math.max(...losses);
    const span = (yMax - yMin) || 1;
    const sx = (i: number) => pad + (i / (losses.length - 1)) * (W - 2 * pad);
    const sy = (v: number) => H - pad - ((v - yMin) / span) * (H - 2 * pad);
    const d = losses.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(v)}`).join(' ');
    return { W, H, d, yMin, yMax };
  }, [losses]);

  return (
    <div className="flex flex-col gap-3">
      <Banner kind="info" title="TensorFlow.js — autograd in your browser">
        Live training with Adam + MSE on a scalar regression. The
        ~400 KB tfjs chunk loads on first click of <strong>Train</strong>.
      </Banner>

      <Card title="Points (x, y per line)">
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.currentTarget.value)}
          rows={6}
          className="w-full font-mono text-xs p-2 rounded bg-surface-2 text-fg outline-none border border-border"
        />
      </Card>

      <Card title="Architecture">
        <label className="flex items-center justify-between text-xs">
          <span>Hidden units (0 = linear)</span><span>{hidden}</span>
        </label>
        <Slider value={hidden} min={0} max={16} step={1} onValueChange={setHidden} ariaLabel="Hidden units" />
        <label className="flex items-center justify-between text-xs mt-2">
          <span>Epochs</span><span>{epochs}</span>
        </label>
        <Slider value={epochs} min={10} max={500} step={10} onValueChange={setEpochs} ariaLabel="Epochs" />
        <label className="flex items-center justify-between text-xs mt-2">
          <span>Learning rate</span><span>{lr.toFixed(3)}</span>
        </label>
        <Slider value={lr} min={0.001} max={0.5} step={0.001} onValueChange={setLr} ariaLabel="Learning rate" />
      </Card>

      <div className="flex items-center gap-2">
        <Button size="md" variant="primary" onClick={() => void train()} disabled={busy}>
          {busy ? <Spinner size="sm" /> : <Icon name="play" />}
          {busy ? 'Training…' : 'Train'}
        </Button>
        {busy && <Button size="md" variant="ghost" onClick={cancel}>Cancel</Button>}
      </div>

      {error && <Banner kind="error" title="Training failed">{error}</Banner>}

      {lossView && (
        <Card title={`Loss curve — last ${losses.length} epochs`}>
          <svg viewBox={`0 0 ${lossView.W} ${lossView.H}`} className="w-full h-48">
            <path d={lossView.d} fill="none" stroke="var(--color-accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="text-xs text-fg-muted">
            min {lossView.yMin.toFixed(4)} · max {lossView.yMax.toFixed(4)}
          </div>
        </Card>
      )}

      {result && (
        <Card
          title={`Trained — final loss ${result.finalLoss.toFixed(4)}`}
          tone="accent"
          titleActions={
            <Button size="sm" variant="ghost" onClick={pinWeights}>
              <Icon name="plus" /> Pin weights
            </Button>
          }
        >
          <div className="text-xs text-fg-muted">
            {result.weights.length} weight tensor(s) — total {result.weights.flat().length} scalars.
          </div>
        </Card>
      )}
    </div>
  );
}
