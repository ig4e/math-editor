// Graph 2D panel. Auto-plots the user's selected math blocks via the
// JSXGraph grapher, with the detected Variables panel sliders bound as
// live substitutions. Ribbon: grid / equal-axes toggle, fit-to-view,
// "Pin to canvas". Left column: plot list (toggle, color, equation tag).

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../state/store';
import { useActiveSheet, useSelectedMathBlocks } from '../../state/selectors';
import { detectAll } from '../variables/parser';
import { detectSpec } from '../../graphers/detectSpec';
import { PLOT_COLORS, type PlotSpec } from '../../graphers/spec';
import {
  PanelHeader, PanelStatus,
  IconButton, EmptyState, Banner,
} from '../../components/common';
import { Icon } from '../../components/Icons';
import { JSXBoard, type JSXBoardHandle } from './JSXBoard';
import { PlotContextMenu } from './PlotContextMenu';
import { injectImage } from '../canvas/inject';
import { cx } from '../../utils/cx';

interface PlotEntry {
  spec: PlotSpec;
  blockId: string;
  enabled: boolean;
}

export default function GraphPanel() {
  const sheet = useActiveSheet();
  const selected = useSelectedMathBlocks();
  const toast = useStore((s) => s.toast);

  // Detect plot specs for every selected math block; fall back to ALL
  // math blocks on the sheet if nothing is selected.
  const baseBlocks = selected.length > 0
    ? selected
    : (sheet?.blocks ?? []).filter((b) => b.type === 'math');

  const initialEntries = useMemo<PlotEntry[]>(
    () => baseBlocks
      .map((b) => {
        if (b.type !== 'math') return null;
        const spec = detectSpec(b.latex);
        if (!spec) return null;
        return { spec, blockId: b.id, enabled: true };
      })
      .filter((e): e is PlotEntry => !!e)
      .map((e, i) => ({
        ...e,
        spec: { ...e.spec, color: e.spec.color ?? PLOT_COLORS[i % PLOT_COLORS.length] },
      })),
    [baseBlocks],
  );

  const [entries, setEntries] = useState<PlotEntry[]>(initialEntries);
  const [grid, setGrid] = useState(true);
  const [equalScale, setEqualScale] = useState(false);

  // Refresh entries when the underlying blocks actually change. The key
  // is serialized inside the effect so we don't re-derive when only the
  // array *reference* changed (filter/ternary return a new array every
  // render). Must be useEffect — calling setEntries inside useMemo runs
  // during render and triggers an infinite loop because
  // baseBlocks/initialEntries are new refs every render.
  const entriesKey = useMemo(
    () =>
      baseBlocks
        .map((b) => (b.type === 'math' ? `${b.id}:${b.latex}` : ''))
        .join('|'),
    [baseBlocks],
  );
  useEffect(() => {
    setEntries(initialEntries);
    // initialEntries is intentionally omitted; entriesKey already
    // captures the meaningful change set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entriesKey]);

  // Variables → numeric substitutions for the plot.
  const variables = useMemo(() => {
    const mathBlocks = (sheet?.blocks ?? []).filter((b) => b.type === 'math');
    const defs = detectAll(mathBlocks as never);
    const out: Record<string, number> = {};
    for (const d of defs) {
      if (typeof d.value === 'number') out[d.name] = d.value;
    }
    return out;
  }, [sheet?.blocks]);

  const enabledSpecs = useMemo(
    () => entries.filter((e) => e.enabled).map((e) => e.spec),
    [entries],
  );

  const boardRef = useRef<JSXBoardHandle | null>(null);

  const onPin = async () => {
    if (!boardRef.current) return;
    const snap = await boardRef.current.snapshot();
    if (!snap) {
      toast('Snapshot failed', 'error');
      return;
    }
    injectImage({ at: { x: 200, y: 200 }, dataURL: snap.dataURL, width: snap.width, height: snap.height });
    toast('Pinned plot to canvas', 'success');
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader
        title="Graph 2D"
        icon="graph"
        actions={
          <>
            <IconButton
              icon={grid ? 'check' : 'square'}
              size="sm"
              label="Toggle grid"
              active={grid}
              onClick={() => setGrid((v) => !v)}
            />
            <IconButton
              icon="resize"
              size="sm"
              label="Lock equal axes"
              active={equalScale}
              onClick={() => setEqualScale((v) => !v)}
            />
            <IconButton
              icon="image"
              size="sm"
              label="Pin to canvas"
              onClick={() => void onPin()}
              disabled={enabledSpecs.length === 0}
            />
          </>
        }
      />
      {entries.length === 0 ? (
        <div className="flex-1">
          <EmptyState
            icon="graph"
            title="Nothing to plot"
            description="Select a math block like `y = x^2`, `x^2 + y^2 = 4`, or `f(x) = sin(x)` on the canvas. Implicit, function, and parametric forms are all supported."
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-row overflow-hidden">
          <PlotList
            entries={entries}
            allSpecs={entries.map((e) => e.spec)}
            variables={variables}
            onToggle={(idx) => {
              setEntries((cur) => cur.map((e, i) => i === idx ? { ...e, enabled: !e.enabled } : e));
            }}
          />
          <div className="flex-1 relative">
            {enabledSpecs.length > 0 ? (
              <JSXBoard
                ref={boardRef}
                specs={enabledSpecs}
                variables={variables}
                grid={grid}
                equalScale={equalScale}
              />
            ) : (
              <Banner kind="info" className="m-3">No plots enabled.</Banner>
            )}
          </div>
        </div>
      )}
      <PanelStatus>
        Plots · <span className="text-fg">{entries.length}</span> ·
        Variables · <span className="text-fg">{Object.keys(variables).length}</span>
      </PanelStatus>
    </div>
  );
}

interface PlotListProps {
  entries: readonly PlotEntry[];
  allSpecs: readonly PlotSpec[];
  variables: Record<string, number>;
  onToggle(idx: number): void;
}

function PlotList({ entries, allSpecs, variables, onToggle }: PlotListProps) {
  return (
    <aside className="w-56 shrink-0 overflow-auto border-r border-border-soft py-2 px-1.5 bg-surface-2">
      <ul className="flex flex-col gap-1">
        {entries.map((e, i) => (
          <PlotContextMenu key={`${e.blockId}-${i}`} spec={e.spec} others={allSpecs} variables={variables}>
          <li
            className="flex items-center gap-2 px-2 h-8 rounded-md hover:bg-surface cursor-context-menu"
          >
            {/* eslint-disable-next-line no-restricted-syntax -- 16×16 visibility checkbox affordance inside a plot list row */}
            <button
              type="button"
              aria-label={e.enabled ? 'Hide plot' : 'Show plot'}
              onClick={() => onToggle(i)}
              className="w-4 h-4 inline-flex items-center justify-center"
            >
              <span
                className={cx(
                  'w-3 h-3 rounded-sm border',
                  e.enabled ? 'border-transparent' : 'border-fg-faint',
                )}
                style={{ background: e.enabled ? (e.spec as { color?: string }).color : 'transparent' }}
              />
            </button>
            <span className="text-xs text-fg-2 truncate font-mono">
              {(e.spec as { label?: string }).label ?? e.spec.kind}
            </span>
            <Icon name="chevron-right" className="w-3 h-3 text-fg-faint" />
          </li>
          </PlotContextMenu>
        ))}
      </ul>
    </aside>
  );
}
