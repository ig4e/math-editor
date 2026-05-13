// SelectionToolbar — floating "Solve / Graph / Ask AI" overlay that
// appears above the Excalidraw selection bbox when ≥1 math block (via
// its anchor element) is part of the selection. Mounted next to
// MathOverlay inside CanvasPanel.
//
// Side-effect: bridges Excalidraw's `appState.selectedElementIds` into
// `store.selectedIds` (block scope only) so the existing math.solve /
// solve-system commands work without further wiring. Without this
// bridge, command-palette Solve fires on whatever was selected before.

import { useEffect, useMemo, useState } from 'react';
import { sceneCoordsToViewportCoords } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useStore } from '../../state/store';
import { useActiveSheet } from '../../state/selectors';
import { useCommand } from '../../commands/useCommand';
import { isAnchor, anchorBlockId } from './anchors';
import { Icon } from '../../components/Icons';
import { cx } from '../../utils/cx';

interface Props {
  apiRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
}

interface BBox { x: number; y: number; w: number; h: number }

export function SelectionToolbar({ apiRef }: Props) {
  const sheet = useActiveSheet();
  const setSelection = useStore((s) => s.setSelection);
  const { runCommand } = useCommand();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const off = api.onChange(() => setTick((t) => t + 1));
    return () => { off(); };
  }, [apiRef]);

  // Compute selected anchor block IDs + the union scene bbox. We
  // recompute on every Excalidraw tick — cheap because selections are
  // small (rarely > 10 elements).
  const { selectedBlockIds, bboxScene } = useMemo<{
    selectedBlockIds: string[];
    bboxScene: BBox | null;
  }>(() => {
    void tick;
    const api = apiRef.current;
    if (!api) return { selectedBlockIds: [], bboxScene: null };
    const appState = api.getAppState();
    const selectedMap = appState.selectedElementIds ?? {};
    const selectedSet = new Set(Object.keys(selectedMap));
    if (selectedSet.size === 0) {
      return { selectedBlockIds: [], bboxScene: null };
    }
    const elements = api.getSceneElements();
    const ids: string[] = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let anyMath = false;
    for (const el of elements) {
      if (!selectedSet.has(el.id)) continue;
      const bid = isAnchor(el) ? anchorBlockId(el) : null;
      if (bid) { ids.push(bid); anyMath = true; }
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (el.x + el.width  > maxX) maxX = el.x + el.width;
      if (el.y + el.height > maxY) maxY = el.y + el.height;
    }
    if (!anyMath || !isFinite(minX)) {
      return { selectedBlockIds: [], bboxScene: null };
    }
    return {
      selectedBlockIds: ids,
      bboxScene: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
    };
  }, [apiRef, tick]);

  // Bridge canvas selection → store selection so commands fire on the
  // right blocks. Effect dep is the joined string so we don't churn on
  // identical-content arrays.
  useEffect(() => {
    setSelection(selectedBlockIds);
  }, [selectedBlockIds.join('|'), setSelection]); // eslint-disable-line react-hooks/rules-of-hooks

  if (!sheet || !bboxScene || selectedBlockIds.length === 0) return null;
  const api = apiRef.current;
  if (!api) return null;
  const appState = api.getAppState();
  const { x: vpX, y: vpY } = sceneCoordsToViewportCoords(
    { sceneX: bboxScene.x + bboxScene.w / 2, sceneY: bboxScene.y },
    appState,
  );

  // Anchor the toolbar 12 px above the selection's top-center, in
  // viewport coords. translate(-50%, -100%) shifts to top-center.
  return (
    <div
      className="absolute z-[40] pointer-events-none"
      style={{ left: `${vpX}px`, top: `${vpY - 12}px`, transform: 'translate(-50%, -100%)' }}
      data-testid="selection-toolbar"
    >
      <div
        className={cx(
          'pointer-events-auto inline-flex items-center gap-1',
          'rounded-lg border border-border bg-surface-glass backdrop-blur',
          'px-1 py-1 shadow-card text-xs',
        )}
      >
        <ToolbarButton
          icon="eval"
          label={`Solve (${selectedBlockIds.length})`}
          onClick={() => runCommand('math.solve')}
        />
        {selectedBlockIds.length >= 2 && (
          <ToolbarButton
            icon="link"
            label="Solve system"
            onClick={() => runCommand('math.solveSystem')}
          />
        )}
        <ToolbarButton
          icon="graph"
          label="Graph"
          onClick={() => runCommand('view.open.graph2d')}
        />
        <ToolbarButton
          icon="sparkles"
          label="Ask AI"
          onClick={() => runCommand('view.open.ai')}
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  icon, label, onClick,
}: { icon: 'eval' | 'link' | 'graph' | 'sparkles'; label: string; onClick(): void }) {
  return (
    // eslint-disable-next-line no-restricted-syntax -- floating overlay chrome; mirrors Excalidraw's own selection bar styling
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cx(
        'inline-flex items-center gap-1 h-7 px-2 rounded-md',
        'text-fg-2 hover:bg-surface-2 hover:text-fg',
        'transition-colors duration-100',
      )}
    >
      <Icon name={icon} className="w-3.5 h-3.5" />
      <span className="font-medium">{label}</span>
    </button>
  );
}
