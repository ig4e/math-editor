// Variables panel — detected `name = number` definitions with live
// sliders. Editing a slider rewrites the source equation's LaTeX so
// the canvas math block updates in lockstep.

import { useMemo } from 'react';
import { useStore } from '../../state/store';
import { useActiveSheet, useRefNumbers } from '../../state/selectors';
import { detectAll, type VariableDef } from './parser';
import { PanelHeader, PanelStatus, EmptyState, Slider, Card } from '../../components/common';
import { Icon } from '../../components/Icons';

export default function VariablesPanel() {
  const sheet = useActiveSheet();
  const refNumbers = useRefNumbers();
  const updateBlock = useStore((s) => s.updateBlock);

  const mathBlocks = useMemo(
    () => (sheet?.blocks ?? []).filter((b) => b.type === 'math'),
    [sheet?.blocks],
  );
  const vars = useMemo(() => detectAll(mathBlocks as never), [mathBlocks]);

  const onSliderChange = (def: VariableDef, value: number) => {
    if (!def.isNumeric) return;
    const block = (sheet?.blocks ?? []).find((b) => b.id === def.sourceBlockId);
    if (!block || block.type !== 'math') return;
    const formatted = formatNumber(value);
    const next = block.latex.replace(
      /(=\s*).+$/,
      `$1${formatted}`,
    );
    updateBlock(block.id, { latex: next });
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Variables" icon="tag" />
      <div className="flex-1 overflow-auto p-3">
        {vars.length === 0 ? (
          <EmptyState
            icon="tag"
            title="No variables yet"
            description="Add a math block like `g = 9.8` on the canvas and it shows up here with a live slider."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {vars.map((def) => (
              <Row
                key={def.name}
                def={def}
                refNumber={refNumbers[def.sourceBlockId] ?? null}
                onSliderChange={(v) => onSliderChange(def, v)}
              />
            ))}
          </div>
        )}
      </div>
      <PanelStatus>
        Known values · <span className="text-fg">{vars.length}</span>
      </PanelStatus>
    </div>
  );
}

interface RowProps {
  def: VariableDef;
  refNumber: number | null;
  onSliderChange(v: number): void;
}

function Row({ def, refNumber, onSliderChange }: RowProps) {
  const isNumeric = def.isNumeric;
  const numeric = isNumeric ? (def.value as number) : 0;

  // Slider range: ±2× the current magnitude, snapping to a sensible step.
  const span = Math.max(1, Math.abs(numeric) * 2);
  const min = numeric - span;
  const max = numeric + span;
  const step = niceStep(span);

  return (
    <Card density="compact">
      <div className="flex items-center gap-2">
        <Icon name="tag" className="text-fg-muted" />
        <span className="font-mono text-sm text-fg">{def.name}</span>
        <span className="text-fg-muted">=</span>
        <span className="font-mono text-sm text-accent">
          {isNumeric ? formatNumber(numeric) : (def.value as string)}
        </span>
        <span className="flex-1" />
        {refNumber !== null && (
          <span className="text-[10px] text-fg-faint font-mono">from ({refNumber})</span>
        )}
      </div>
      {isNumeric && (
        <div className="mt-2">
          <Slider
            value={numeric}
            min={min}
            max={max}
            step={step}
            onValueChange={onSliderChange}
            ariaLabel={`Value of ${def.name}`}
          />
        </div>
      )}
    </Card>
  );
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(decimalsFor(n));
}

function decimalsFor(n: number): number {
  const a = Math.abs(n);
  if (a >= 100) return 1;
  if (a >= 10) return 2;
  if (a >= 1) return 3;
  return 4;
}

function niceStep(span: number): number {
  const order = Math.pow(10, Math.floor(Math.log10(span)) - 2);
  return Math.max(0.001, order);
}
