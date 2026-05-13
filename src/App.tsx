// App root — pure composition. All imperative work lives in hooks, all
// styling lives in components. Read this top-down for a tour of the app.

import { useCallback, useRef } from 'react';

import { Toolbar }         from './components/Toolbar/Toolbar';
import { TabBar }          from './components/TabBar';
import { Toaster }         from './components/Toaster';
import { Whiteboard }      from './components/Whiteboard';
import { SelectionHint }   from './components/SelectionHint';
import { VariablesPanel }  from './components/VariablesPanel';
import { ConfirmDialog }   from './components/ConfirmDialog';
import { IconSprite }      from './components/Icons';

import { useStore } from './state/store';
import { useThemeSync }         from './hooks/useThemeSync';
import { useToastLifecycle }    from './hooks/useToastLifecycle';
import { useFirstRunStarter }   from './hooks/useFirstRunStarter';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSolveAction }       from './hooks/useSolveAction';
import { useFileIO }            from './hooks/useFileIO';
import { useActiveMathField }   from './hooks/useActiveMathField';

import { applyColor, selectionLatex } from './utils/mathfield';
import { screenToWorld, clamp }       from './utils/geom';
import type { ColorName } from './state/types';

export default function App() {
  // ----- DOM refs --------------------------------------------------------
  const viewportRef        = useRef<HTMLDivElement | null>(null);
  const fileInputRef       = useRef<HTMLInputElement | null>(null);
  const activeMathFieldRef = useActiveMathField();

  // ----- side-effect hooks ----------------------------------------------
  useThemeSync();
  useToastLifecycle();
  useFirstRunStarter(viewportRef);

  // ----- imperative actions ---------------------------------------------
  const runSolver  = useSolveAction(activeMathFieldRef);
  const onSolve    = useCallback(() => runSolver('solve'),    [runSolver]);
  const onSimplify = useCallback(() => runSolver('simplify'), [runSolver]);
  const file       = useFileIO(viewportRef, fileInputRef);

  const addMathAtCenter = useCallback(() => {
    const [x, y] = centerOfViewport(viewportRef.current);
    const id = useStore.getState().addMathBlock({ x: x - 120, y: y - 24 });
    requestAnimationFrame(() => {
      (document.querySelector(`.js-block[data-id="${id}"] math-field`) as HTMLElement | null)?.focus();
    });
  }, []);
  const addTextAtCenter = useCallback(() => {
    const [x, y] = centerOfViewport(viewportRef.current);
    const id = useStore.getState().addTextBlock({ x: x - 120, y: y - 16 });
    requestAnimationFrame(() => {
      (document.querySelector(`.js-block[data-id="${id}"] [contenteditable]`) as HTMLElement | null)?.focus();
    });
  }, []);

  const onZoom = useCallback((factor: number) => {
    const s = useStore.getState();
    const sheet = s.sheets[s.activeSheetId];
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const newZoom = clamp(sheet.view.zoom * factor, 0.25, 4);
    const ratio = newZoom / sheet.view.zoom;
    s.setView({
      panX: cx - (cx - sheet.view.panX) * ratio,
      panY: cy - (cy - sheet.view.panY) * ratio,
      zoom: newZoom,
    });
  }, []);

  const onHighlight = useCallback(() => {
    const mf = activeMathFieldRef.current;
    if (!mf) { useStore.getState().toast('Click into an equation first', 'warn'); return; }
    if (!applyColor(mf, useStore.getState().colorName, true)) {
      useStore.getState().toast('Select part of the equation first', 'warn');
    }
  }, []);

  const onColorPicked = useCallback((c: ColorName) => {
    useStore.getState().setColorName(c);
    // If a selection exists, recolor it immediately.
    const mf = activeMathFieldRef.current;
    if (mf && selectionLatex(mf)) applyColor(mf, c, false);
  }, []);

  const onHelp = useCallback(() => {
    useStore.getState().toast(
      'E = math · T = text · V/P/X = tools · + / − / 0 = zoom · Ctrl/Cmd+Click = multi-select · Ctrl+Enter (in field) = solve',
      'info',
    );
  }, []);

  // ----- shortcuts ------------------------------------------------------
  useKeyboardShortcuts({
    addMath: addMathAtCenter,
    addText: addTextAtCenter,
    zoomIn:  () => onZoom(1.2),
    zoomOut: () => onZoom(1 / 1.2),
    help:    onHelp,
  });

  // ----- layout ---------------------------------------------------------
  return (
    <>
      <IconSprite />
      <Toolbar
        onAddMath={addMathAtCenter}
        onAddText={addTextAtCenter}
        onHighlight={onHighlight}
        onColorPicked={onColorPicked}
        onSolve={onSolve}
        onSimplify={onSimplify}
        onZoomIn={() => onZoom(1.2)}
        onZoomOut={() => onZoom(1 / 1.2)}
        onResetView={() => useStore.getState().resetView()}
        onSave={file.onSaveFile}
        onOpen={file.onOpenFile}
        onPNG={file.onExportPNG}
        onClear={file.onClear}
        onHelp={onHelp}
      />
      <TabBar />
      <main className="absolute top-[80px] inset-x-0 bottom-0">
        <Whiteboard
          onEvaluateRequest={onSolve}
          viewportRef={viewportRef}
        />
        <SelectionHint />
        <VariablesPanel />
      </main>
      <Toaster />
      <ConfirmDialog />
      <input
        ref={fileInputRef}
        type="file"
        accept=".mathsheet,.json,application/json"
        hidden
        onChange={file.onFileChosen}
      />
    </>
  );
}

function centerOfViewport(el: HTMLDivElement | null): [number, number] {
  if (!el) return [200, 200];
  const r = el.getBoundingClientRect();
  const s = useStore.getState();
  const view = s.sheets[s.activeSheetId].view;
  return screenToWorld(view, r, r.left + r.width / 2, r.top + r.height / 2);
}
