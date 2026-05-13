// Live training mode in the ML Lab. Now full-featured — regression,
// binary, and multi-class classification with configurable depth,
// activation, optimizer, batch size, L2 regularisation, validation
// split, and one-click model download.
//
// Datasets can be pasted as CSV. The number of columns determines the
// feature shape; the last column is the target.

import { useMemo, useRef, useState } from 'react';
import {
  Card, Slider, Button, Banner, Spinner, Select, Switch,
} from '../../../components/common';
import { Icon } from '../../../components/Icons';
import { useStore } from '../../../state/store';
import type { DataRow, TaskKind, Activation, OptimizerName, TrainResult } from '../ml/tfjsTrain';
import { downloadBlob } from '../../../share/pdf';

const SAMPLE_REGRESSION = `x,y
0,1
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

const SAMPLE_BINARY = `feat1,feat2,label
1,1,0
2,1,0
1,2,0
4,4,1
5,4,1
4,5,1
6,7,1`;

const TASKS: { value: TaskKind; label: string }[] = [
  { value: 'regression', label: 'Regression' },
  { value: 'binary',     label: 'Binary classification' },
  { value: 'multiclass', label: 'Multi-class classification' },
];

const ACTIVATIONS: { value: Activation; label: string }[] = [
  { value: 'tanh',    label: 'tanh' },
  { value: 'relu',    label: 'ReLU' },
  { value: 'sigmoid', label: 'Sigmoid' },
  { value: 'gelu',    label: 'GELU' },
  { value: 'elu',     label: 'ELU' },
  { value: 'selu',    label: 'SELU' },
  { value: 'swish',   label: 'Swish' },
];

const OPTIMIZERS: { value: OptimizerName; label: string }[] = [
  { value: 'adam',     label: 'Adam' },
  { value: 'rmsprop',  label: 'RMSprop' },
  { value: 'momentum', label: 'Momentum' },
  { value: 'sgd',      label: 'SGD' },
];

export function TrainMode() {
  const [task, setTask] = useState<TaskKind>('regression');
  const [csv, setCsv] = useState(SAMPLE_REGRESSION);
  const [hiddenSizes, setHiddenSizes] = useState('16,8');
  const [activation, setActivation] = useState<Activation>('tanh');
  const [optimizer, setOptimizer] = useState<OptimizerName>('adam');
  const [epochs, setEpochs] = useState(80);
  const [lr, setLr] = useState(0.05);
  const [batchSize, setBatchSize] = useState(8);
  const [l2, setL2] = useState(0);
  const [validation, setValidation] = useState(true);
  const [history, setHistory] = useState<{ loss: number[]; valLoss?: number[]; metric?: number[]; valMetric?: number[] }>({ loss: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrainResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const toast = useStore((s) => s.toast);
  const addMathBlock = useStore((s) => s.addMathBlock);

  const rows: DataRow[] = useMemo(() => parseCSV(csv), [csv]);

  const train = async () => {
    if (rows.length < 2) { toast('Need at least 2 rows of data', 'warn'); return; }
    setBusy(true);
    setError(null);
    setHistory({ loss: [] });
    setResult(null);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const hidden = hiddenSizes
        .split(/[,\s]+/)
        .map((s) => parseInt(s, 10))
        .filter((n) => Number.isFinite(n) && n > 0);
      const { train: runTrain } = await import('../ml/tfjsTrain');
      const r = await runTrain(rows, {
        task,
        hidden,
        activation,
        optimizer,
        epochs,
        learningRate: lr,
        batchSize,
        l2,
        validationSplit: validation ? 0.2 : 0,
        signal: abortRef.current.signal,
        onEpoch: (_e, logs) => {
          setHistory((prev) => ({
            loss: [...prev.loss, logs.loss],
            valLoss: logs.valLoss != null ? [...(prev.valLoss ?? []), logs.valLoss] : prev.valLoss,
            metric: logs.metric != null ? [...(prev.metric ?? []), logs.metric] : prev.metric,
            valMetric: logs.valMetric != null ? [...(prev.valMetric ?? []), logs.valMetric] : prev.valMetric,
          }));
        },
      });
      setResult(r);
      const accuracy = task !== 'regression' && Number.isFinite(r.finalMetric) ? ` · acc ${(r.finalMetric * 100).toFixed(1)}%` : '';
      toast(`Trained ${epochs} epochs · loss ${r.finalLoss.toFixed(4)}${accuracy}`, 'success');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => { abortRef.current?.abort(); };

  const pinWeights = () => {
    if (!result) return;
    const lines = result.weights.map((w, i) =>
      `W_{${i}} = [${w.slice(0, 8).map((v) => v.toFixed(3)).join(',\\,')}${w.length > 8 ? ',\\ldots' : ''}]`,
    );
    addMathBlock({ x: 220, y: 220, latex: lines.join(' \\\\ ') });
    toast('Weights pinned to canvas', 'success');
  };

  const downloadModel = () => {
    if (!result) return;
    const artifact = result.exportArtifact();
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `model-${task}.json`);
    toast('Model JSON downloaded', 'success');
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <Banner kind="info" title="TensorFlow.js — full training pipeline">
        Regression, binary, and multi-class with configurable depth,
        activation, optimizer, batch size, L2, and validation split.
      </Banner>

      <Card title="Task">
        <Select
          value={task}
          onValueChange={(v) => {
            const t = v as TaskKind;
            setTask(t);
            // Helpful preset swap when the user changes task.
            if (t === 'binary' || t === 'multiclass') setCsv(SAMPLE_BINARY);
            else setCsv(SAMPLE_REGRESSION);
          }}
          items={TASKS}
          ariaLabel="Task"
          className="w-64"
        />
      </Card>

      <Card title={`Dataset (${rows.length} rows · ${rows[0]?.features.length ?? 0} features)`}>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.currentTarget.value)}
          rows={7}
          className="w-full font-mono text-xs p-2 rounded bg-surface-2 text-fg outline-none border border-border"
        />
        <div className="mt-1 text-[11px] text-fg-muted">
          First row may be a header (skipped). Last column is the target.
          For multi-class, the target is the integer class index.
        </div>
      </Card>

      <Card title="Architecture">
        <Row label="Hidden layers (comma-separated)">
          <input
            type="text"
            value={hiddenSizes}
            onChange={(e) => setHiddenSizes(e.currentTarget.value)}
            placeholder="16,8"
            className="w-full font-mono text-xs px-2 py-1 rounded bg-surface-2 text-fg outline-none border border-border"
          />
        </Row>
        <Row label="Activation">
          <Select value={activation} onValueChange={(v) => setActivation(v as Activation)} items={ACTIVATIONS} ariaLabel="Activation" />
        </Row>
        <Row label="Optimizer">
          <Select value={optimizer} onValueChange={(v) => setOptimizer(v as OptimizerName)} items={OPTIMIZERS} ariaLabel="Optimizer" />
        </Row>
      </Card>

      <Card title="Hyperparameters">
        <NumberRow label="Epochs" value={epochs} min={5} max={2000} step={5} onChange={setEpochs} />
        <NumberRow label="Learning rate" value={lr} min={0.0001} max={1} step={0.001} format={(v) => v.toFixed(4)} onChange={setLr} />
        <NumberRow label="Batch size" value={batchSize} min={1} max={Math.max(1, rows.length)} step={1} onChange={setBatchSize} />
        <NumberRow label="L2 regularisation" value={l2} min={0} max={0.1} step={0.001} format={(v) => v.toFixed(4)} onChange={setL2} />
        <Row label="20% validation split">
          <Switch checked={validation} onCheckedChange={setValidation} ariaLabel="Validation split" />
        </Row>
      </Card>

      <div className="flex items-center gap-2">
        <Button size="md" variant="primary" onClick={() => void train()} disabled={busy}>
          {busy ? <Spinner size="sm" /> : <Icon name="play" />}
          {busy ? 'Training…' : 'Train'}
        </Button>
        {busy && <Button size="md" variant="ghost" onClick={cancel}>Cancel</Button>}
      </div>

      {error && <Banner kind="error" title="Training failed">{error}</Banner>}

      {history.loss.length > 1 && (
        <Card title={`Loss curve — epoch ${history.loss.length}`}>
          <Sparkline
            primary={history.loss}
            secondary={history.valLoss}
            primaryLabel="train"
            secondaryLabel="val"
          />
          {history.metric && history.metric.length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] text-fg-muted uppercase tracking-wide mb-1">Accuracy</div>
              <Sparkline
                primary={history.metric}
                secondary={history.valMetric}
                primaryLabel="train"
                secondaryLabel="val"
                color="var(--color-success)"
              />
            </div>
          )}
        </Card>
      )}

      {result && (
        <Card
          title={`Trained · loss ${result.finalLoss.toFixed(4)}${task !== 'regression' && Number.isFinite(result.finalMetric) ? ` · acc ${(result.finalMetric * 100).toFixed(1)}%` : ''}`}
          tone="accent"
          titleActions={
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={pinWeights}>
                <Icon name="plus" /> Pin weights
              </Button>
              <Button size="sm" variant="ghost" onClick={downloadModel}>
                <Icon name="download" /> Download
              </Button>
            </div>
          }
        >
          <div className="text-xs text-fg-muted">
            {result.weights.length} weight tensor{result.weights.length === 1 ? '' : 's'} · {result.weights.flat().length} scalars total.
          </div>
        </Card>
      )}
    </div>
  );
}

// ----- subcomponents ----------------------------------------------

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-2">
      <span className="text-xs text-fg-2">{label}</span>
      <div className="flex-1 max-w-[200px]">{children}</div>
    </div>
  );
}

function NumberRow({
  label, value, min, max, step, format, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange(v: number): void;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-fg-2">{label}</span>
        <span className="text-fg font-mono">{format ? format(value) : value}</span>
      </div>
      <Slider value={value} min={min} max={max} step={step} onValueChange={onChange} ariaLabel={label} />
    </div>
  );
}

function Sparkline({
  primary, secondary, primaryLabel, secondaryLabel, color = 'var(--color-accent)',
}: {
  primary: readonly number[];
  secondary?: readonly number[];
  primaryLabel: string;
  secondaryLabel?: string;
  color?: string;
}) {
  const W = 600, H = 160, pad = 16;
  const all = secondary && secondary.length ? [...primary, ...secondary] : primary;
  const yMin = Math.min(...all), yMax = Math.max(...all);
  const span = (yMax - yMin) || 1;
  const sx = (i: number) => pad + (i / Math.max(1, primary.length - 1)) * (W - 2 * pad);
  const sy = (v: number) => H - pad - ((v - yMin) / span) * (H - 2 * pad);
  const trace = (data: readonly number[]) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(v)}`).join(' ');
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40">
        <path d={trace(primary)} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {secondary && secondary.length > 0 && (
          <path d={trace(secondary)} fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      <div className="flex items-center gap-3 text-[11px] text-fg-muted">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5" style={{ background: color }} /> {primaryLabel} {primary.at(-1)?.toFixed(4) ?? ''}</span>
        {secondary && secondary.length > 0 && (
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 border-t border-dashed" style={{ borderColor: color }} /> {secondaryLabel} {secondary.at(-1)?.toFixed(4) ?? ''}</span>
        )}
      </div>
    </div>
  );
}

// ----- CSV parser -------------------------------------------------

function parseCSV(text: string): DataRow[] {
  const out: DataRow[] = [];
  const lines = text.trim().split(/\n+/);
  let first = true;
  for (const raw of lines) {
    const parts = raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length < 2) continue;
    const numbers = parts.map(Number);
    if (first) {
      first = false;
      if (numbers.some((n) => Number.isNaN(n))) continue; // header row
    }
    if (numbers.some((n) => Number.isNaN(n))) continue;
    const target = numbers.pop()!;
    out.push({ features: numbers, target });
  }
  return out;
}
