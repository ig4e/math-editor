// Solver panel — Simplify / Solve / Solve system + step list.
// Reads the canvas selection (math blocks). When showSteps is on,
// the runner prefers mathsteps for its step-by-step output; otherwise
// compute-engine handles the single-shot.

import { useCallback, useMemo, useState } from 'react';
import { useStore } from '../../state/store';
import { useSelectedMathBlocks } from '../../state/selectors';
import { detectAll } from '../variables/parser';
import { solve, type SolverResult, type SolverStep } from '../../solvers';
import {
  PanelHeader, PanelRibbon, PanelStatus,
  Button, Card, EmptyState, Banner, Spinner,
} from '../../components/common';
import { Icon } from '../../components/Icons';

import '../../solvers/all';
import { ReadOnlyMathField } from './ReadOnlyMathField';

type Action = 'simplify' | 'solve' | 'system';

export default function SolverPanel() {
  const selected = useSelectedMathBlocks();
  const blocks = useStore((s) => s.sheets[s.activeSheetId]?.blocks ?? []);
  const showSteps = useStore((s) => s.showSteps);
  const toast = useStore((s) => s.toast);

  const [result, setResult] = useState<SolverResult | null>(null);
  const [busy, setBusy] = useState(false);

  // Detected vars become substitutions for the active solve.
  const variables = useMemo(() => {
    const mathBlocks = blocks.filter((b) => b.type === 'math');
    const defs = detectAll(mathBlocks as never);
    const out: Record<string, number | string> = {};
    for (const d of defs) out[d.name] = d.value;
    return out;
  }, [blocks]);

  const run = useCallback(async (action: Action) => {
    if (selected.length === 0) {
      toast('Select a math block first', 'warn');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      let r: SolverResult;
      if (action === 'system') {
        if (selected.length < 2) {
          toast('Select 2+ math blocks for a system', 'warn');
          setBusy(false);
          return;
        }
        // Phase 3 baseline: solve each member independently and present
        // them together. Full multivariable elimination + bound arrows
        // land in P3b.
        const results = await Promise.all(
          selected.map((b) => solve({
            source: b.latex,
            capability: 'solve',
            variables,
          }, { requireSteps: showSteps })),
        );
        const okResults = results.filter((x) => x.ok);
        if (okResults.length === 0) {
          r = { ok: false, error: 'No member solved' };
        } else {
          r = {
            ok: true,
            latex: okResults.map((x) => x.latex).join(' \\quad '),
            steps: okResults.flatMap((x) => x.steps ?? []),
          };
        }
      } else {
        const block = selected[0];
        if (!block) {
          setBusy(false);
          return;
        }
        r = await solve(
          { source: block.latex, capability: action, variables },
          { requireSteps: showSteps },
        );
      }
      setResult(r);
      if (!r.ok) toast(r.error ?? 'Solve failed', 'error');
    } finally {
      setBusy(false);
    }
  }, [selected, showSteps, toast, variables]);

  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Solver" icon="eval" />
      <PanelRibbon>
        <Button
          size="sm"
          variant="primary"
          disabled={busy || selected.length === 0}
          onClick={() => void run('solve')}
        >
          {busy ? <Spinner size="sm" /> : <Icon name="eval" />} Solve
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy || selected.length === 0}
          onClick={() => void run('simplify')}
        >
          <Icon name="fx" /> Simplify
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy || selected.length < 2}
          onClick={() => void run('system')}
        >
          <Icon name="link" /> System
        </Button>
      </PanelRibbon>
      <div className="flex-1 overflow-auto p-3 flex flex-col gap-3">
        {!result && selected.length === 0 && (
          <EmptyState
            icon="cursor"
            title="Select a math block"
            description="Click into an equation on the canvas, or select multiple to solve a system."
          />
        )}
        {selected.length > 0 && (
          <Card title={`Selection (${selected.length})`} density="compact">
            <div className="flex flex-col gap-1.5">
              {selected.map((b) => (
                <ReadOnlyMathField key={b.id} latex={b.latex} />
              ))}
            </div>
          </Card>
        )}
        {result?.ok && result.latex && (
          <Card title="Result" tone="accent">
            <ReadOnlyMathField latex={result.latex} />
            {result.backend && (
              <div className="mt-1 text-[10px] text-fg-muted">via {result.backend}</div>
            )}
          </Card>
        )}
        {result?.ok && result.steps && result.steps.length > 0 && (
          <Card title={`Steps (${result.steps.length})`}>
            <ol className="flex flex-col gap-1.5 list-decimal list-inside">
              {result.steps.map((s, i) => <StepRow key={i} step={s} />)}
            </ol>
          </Card>
        )}
        {result && !result.ok && (
          <Banner kind="error" title="Solve failed">{result.error}</Banner>
        )}
      </div>
      <PanelStatus>
        Selected · <span className="text-fg">{selected.length}</span> ·
        Variables · <span className="text-fg">{Object.keys(variables).length}</span>
      </PanelStatus>
    </div>
  );
}

function StepRow({ step }: { step: SolverStep }) {
  return (
    <li className="text-sm">
      {step.description && (
        <span className="text-fg-muted mr-2">{step.description}</span>
      )}
      <ReadOnlyMathField latex={step.latex} inline />
    </li>
  );
}
