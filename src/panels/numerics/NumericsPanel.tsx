// Numerics panel — pick a method, fill the parameter form, click Run.
// Result card shows the final value (LaTeX), the iteration table, and
// a tiny convergence chart. "Pin to canvas" drops the result LaTeX.

import { useMemo, useState } from 'react';
import { useStore } from '../../state/store';
import {
  PanelHeader, PanelStatus, Button, Card, Select, Input, Field, Banner,
} from '../../components/common';
import { Icon } from '../../components/Icons';
import { ReadOnlyMathField } from '../solver/ReadOnlyMathField';
import { METHODS, getMethod, type MethodResult } from './methods';
import { ConvergenceChart } from './ConvergenceChart';

export default function NumericsPanel() {
  const [methodId, setMethodId] = useState<string>(METHODS[0]!.id);
  const method = getMethod(methodId)!;
  const toast = useStore((s) => s.toast);
  const addMathBlock = useStore((s) => s.addMathBlock);

  const [values, setValues] = useState<Record<string, string | number>>(() => fromDefaults(method));
  const [result, setResult] = useState<MethodResult | null>(null);

  const onMethod = (id: string) => {
    setMethodId(id);
    const m = getMethod(id);
    if (m) setValues(fromDefaults(m));
    setResult(null);
  };

  const run = () => {
    try {
      const r = method.run(values);
      setResult(r);
      if (!r.ok) toast(r.error ?? 'method failed', 'error');
    } catch (e) {
      setResult({ ok: false, steps: [], converged: false, error: (e as Error).message });
      toast(`Numerics: ${(e as Error).message}`, 'error');
    }
  };

  const pin = () => {
    if (!result?.ok || !result.latex) return;
    addMathBlock({ x: 220, y: 220, latex: result.latex });
    toast('Result dropped onto canvas', 'success');
  };

  const grouped = useMemo(() => {
    const out: Record<string, typeof METHODS[number][]> = {};
    for (const m of METHODS) (out[m.category] = out[m.category] ?? []).push(m);
    return out;
  }, []);

  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Numerics" icon="function" />
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-soft bg-surface-2">
        <Select
          value={methodId}
          onValueChange={onMethod}
          ariaLabel="Method"
          items={Object.entries(grouped).flatMap(([cat, ms]) =>
            ms.map((m) => ({ value: m.id, label: m.label, description: cat })),
          )}
          className="min-w-[200px]"
        />
        <span className="flex-1" />
        <Button size="sm" variant="primary" onClick={run}>
          <Icon name="play" /> Run
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-3 flex flex-col gap-3">
        <Card title={`Parameters — ${method.label}`}>
          <div className="flex flex-col gap-2">
            {method.params.map((p) => (
              <Field key={p.key} label={p.label} inline>
                {() => (
                  <Input
                    type={p.type === 'expr' ? 'text' : 'number'}
                    value={String(values[p.key] ?? '')}
                    onChange={(e) => setValues((cur) => ({ ...cur, [p.key]: e.currentTarget.value }))}
                    className="font-mono flex-1 min-w-0"
                  />
                )}
              </Field>
            ))}
          </div>
        </Card>

        {result && (result.ok ? (
          <Card
            title="Result"
            tone="accent"
            titleActions={
              <Button size="sm" variant="ghost" onClick={pin}>
                <Icon name="plus" /> Pin to canvas
              </Button>
            }
          >
            {result.latex && <ReadOnlyMathField latex={result.latex} />}
            <div className="mt-2 text-xs text-fg-muted">
              {result.converged ? 'converged' : 'did not converge'} after {result.steps.length} steps
            </div>
            <div className="mt-3">
              <ConvergenceChart steps={result.steps} field="y" />
            </div>
            <details className="mt-2">
              <summary className="text-xs text-fg-muted cursor-pointer">
                {result.steps.length} iterates
              </summary>
              <div className="max-h-64 overflow-auto mt-1">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-fg-muted">
                      <th className="text-left py-0.5 px-2">n</th>
                      <th className="text-left py-0.5 px-2">x</th>
                      <th className="text-left py-0.5 px-2">y</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.steps.map((s) => (
                      <tr key={s.n}>
                        <td className="py-0.5 px-2 text-fg-muted">{s.n}</td>
                        <td className="py-0.5 px-2 text-fg">{format(s.x)}</td>
                        <td className="py-0.5 px-2 text-fg-2">{s.y !== undefined ? format(s.y) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </Card>
        ) : (
          <Banner kind="error" title="Run failed">{result.error ?? 'unknown error'}</Banner>
        ))}
      </div>
      <PanelStatus>
        <span>{method.category}</span>
        {result && <span>· {result.steps.length} iterates</span>}
      </PanelStatus>
    </div>
  );
}

function fromDefaults(m: { params: ReadonlyArray<{ key: string; default?: string | number }> }): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const p of m.params) out[p.key] = p.default ?? '';
  return out;
}

function format(n: number): string {
  if (!Number.isFinite(n)) return 'NaN';
  if (Math.abs(n) >= 1e6 || (Math.abs(n) < 1e-3 && n !== 0)) return n.toExponential(4);
  return Number(n.toFixed(6)).toString();
}
