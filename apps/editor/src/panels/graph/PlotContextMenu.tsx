// Right-click context menu over a plot row. Surfaces roots / extrema /
// intersections. Results are dropped onto the canvas as text labels +
// annotation points so a worked example builds up alongside the math.

import * as DM from '@radix-ui/react-dropdown-menu';
import { useMemo, type ReactNode } from 'react';
import { compileFunction } from '../../graphers/detectSpec';
import { findRoots, findExtrema, findIntersections } from '../../graphers/analysis';
import type { PlotSpec } from '../../graphers/spec';
import { useStore } from '../../state/store';
import { injectText } from '../canvas/inject';
import { cx } from '../../utils/cx';

interface Props {
  spec: PlotSpec;
  /** Other plots on the board — needed for intersections. */
  others: readonly PlotSpec[];
  variables: Record<string, number>;
  children: ReactNode;
}

export function PlotContextMenu({ spec, others, variables, children }: Props) {
  const toast = useStore((s) => s.toast);

  const f = useMemo(() => {
    if (spec.kind !== 'function') return null;
    return compileFunction(spec.expression, spec.variable ?? 'x', variables);
  }, [spec, variables]);

  const runRoots = () => {
    if (!f) { toast('Roots only work on y = f(x) plots', 'warn'); return; }
    const xs = findRoots(f, -10, 10);
    if (xs.length === 0) { toast('No roots in [-10, 10]', 'info'); return; }
    xs.forEach((x, i) => {
      injectText({ at: { x: 200 + i * 100, y: 200 }, text: `root: x ≈ ${x.toFixed(4)}`, fontSize: 16 });
    });
    toast(`Found ${xs.length} root${xs.length === 1 ? '' : 's'}`, 'success');
  };

  const runExtrema = () => {
    if (!f) { toast('Extrema only work on y = f(x) plots', 'warn'); return; }
    const es = findExtrema(f, -10, 10);
    if (es.length === 0) { toast('No extrema in [-10, 10]', 'info'); return; }
    es.forEach((e, i) => {
      injectText({
        at: { x: 200 + i * 140, y: 240 },
        text: `${e.kind}: (${e.x.toFixed(3)}, ${e.y.toFixed(3)})`,
        fontSize: 16,
      });
    });
    toast(`Found ${es.length} extremum${es.length === 1 ? '' : 'a'}`, 'success');
  };

  const runIntersections = (other: PlotSpec) => {
    if (!f || other.kind !== 'function') return;
    const g = compileFunction(other.expression, other.variable ?? 'x', variables);
    const points = findIntersections(f, g, -10, 10);
    if (points.length === 0) {
      toast('No intersections in [-10, 10]', 'info');
      return;
    }
    points.forEach((p, i) => {
      injectText({
        at: { x: 200 + i * 160, y: 280 },
        text: `∩: (${p.x.toFixed(3)}, ${p.y.toFixed(3)})`,
        fontSize: 16,
      });
    });
    toast(`Found ${points.length} intersection${points.length === 1 ? '' : 's'}`, 'success');
  };

  const intersectableOthers = others.filter((o) => o.kind === 'function' && o !== spec);

  return (
    <DM.Root>
      <DM.Trigger asChild>{children}</DM.Trigger>
      <DM.Portal>
        <DM.Content
          align="start"
          sideOffset={4}
          className="z-[300] min-w-[180px] bg-surface border border-border rounded-md shadow-card p-1"
        >
          <MenuItem onSelect={runRoots} disabled={!f}>Show roots</MenuItem>
          <MenuItem onSelect={runExtrema} disabled={!f}>Show max / min</MenuItem>
          {intersectableOthers.length > 0 && (
            <>
              <DM.Separator className="h-px bg-border-soft my-1" />
              <DM.Label className="px-2 py-1 text-[10px] uppercase tracking-wide text-fg-muted">
                Intersections with
              </DM.Label>
              {intersectableOthers.map((o, i) => (
                <MenuItem key={i} onSelect={() => runIntersections(o)}>
                  {(o as { label?: string }).label ?? `Plot ${i + 1}`}
                </MenuItem>
              ))}
            </>
          )}
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}

function MenuItem({ children, onSelect, disabled }: { children: ReactNode; onSelect(): void; disabled?: boolean }) {
  return (
    <DM.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cx(
        'flex items-center h-7 px-2 rounded-md text-sm text-fg',
        'data-[highlighted]:bg-accent-bg data-[highlighted]:text-accent data-[highlighted]:outline-none',
        'data-[disabled]:opacity-60 data-[disabled]:cursor-not-allowed',
      )}
    >
      {children}
    </DM.Item>
  );
}
