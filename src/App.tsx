// App root: glue between Toolbar / TabBar / Whiteboard / Toaster.
// Owns the active math-field ref and the file <input> for opening JSON,
// and runs the solver against selection or active field.

import { useCallback, useEffect, useRef } from 'react';
import type { MathfieldElement } from 'mathlive';
import { Toolbar } from './components/Toolbar';
import { TabBar } from './components/TabBar';
import { Toaster } from './components/Toaster';
import { Whiteboard } from './components/Whiteboard';
import { IconSprite, Icon } from './components/Icons';
import { useStore } from './state/store';
import { solveExpr, solveSystem } from './solver';
import { exportElementToPng, downloadJSON } from './utils/export';
import { screenToWorld, clamp } from './utils/geom';

export default function App() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Live math-field ref (whichever block is currently focused).
  const activeMathFieldRef = useRef<MathfieldElement | null>(null);
  const setActiveMathField = useCallback((el: MathfieldElement | null) => {
    activeMathFieldRef.current = el;
  }, []);

  // Viewport DOM ref for PNG export.
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // File <input> for opening .mathsheet
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------- actions ----------
  const addMathAtCenter = useCallback(() => {
    const center = centerOfViewport(viewportRef.current);
    const id = useStore.getState().addMathBlock({ x: center[0] - 120, y: center[1] - 24 });
    // Focus the new field after it mounts
    requestAnimationFrame(() => {
      const el = document.querySelector(
        `.block[data-id="${id}"] math-field`,
      ) as MathfieldElement | null;
      el?.focus();
    });
  }, []);

  const addTextAtCenter = useCallback(() => {
    const center = centerOfViewport(viewportRef.current);
    const id = useStore.getState().addTextBlock({ x: center[0] - 120, y: center[1] - 16 });
    requestAnimationFrame(() => {
      const el = document.querySelector(
        `.block[data-id="${id}"] .text-body`,
      ) as HTMLElement | null;
      el?.focus();
    });
  }, []);

  // Apply \textcolor or \colorbox to the active math-field's selection.
  const applyColorToSelection = useCallback((box: boolean) => {
    const mf = activeMathFieldRef.current;
    if (!mf) {
      useStore.getState().toast('Click into an equation first', 'warn');
      return;
    }
    const sel = selectionLatex(mf);
    if (!sel) {
      useStore.getState().toast('Select part of the equation first', 'warn');
      return;
    }
    const name = useStore.getState().colorName;
    const cmd = box ? `\\colorbox{${name}}{${sel}}` : `\\textcolor{${name}}{${sel}}`;
    mf.insert(cmd, { selectionMode: 'after', focus: true });
  }, []);

  // Smart solve: 2+ math blocks selected → system; 1 selected → that block; else → active field
  const onSolve = useCallback(() => {
    const s = useStore.getState();
    const sheet = s.sheets[s.activeSheetId];
    const selectedMath = s.selectedIds
      .map((id) => sheet.blocks.find((b) => b.id === id))
      .filter((b): b is import('./state/types').MathBlock => !!b && b.type === 'math');

    if (selectedMath.length >= 2) {
      // System solve
      const latexes = selectedMath.map((b) => b.latex);
      const result = solveSystem(latexes);
      if (!result.ok) {
        s.toast(result.note ?? 'Could not solve system', 'error');
        return;
      }
      // Place result block below the bottom-most selected math block
      const maxY = Math.max(...selectedMath.map((b) => b.y));
      const minX = Math.min(...selectedMath.map((b) => b.x));
      s.addMathBlock({
        latex: result.latex,
        x: minX,
        y: maxY + 100,
        note: `solved from ${selectedMath.length} equations`,
        showNote: true,
      });
      s.toast(`Solved system of ${selectedMath.length} equations`, 'success');
      return;
    }

    // Single block path
    const targetBlock = selectedMath.length === 1 ? selectedMath[0] : null;
    let latex = '';
    if (targetBlock) {
      latex = targetBlock.latex;
    } else if (activeMathFieldRef.current) {
      const mf = activeMathFieldRef.current;
      latex = selectionLatex(mf) || mf.value;
    } else {
      s.toast('Click into an equation, or select equations to solve as a system', 'warn');
      return;
    }
    if (!latex.trim()) {
      s.toast('Nothing to solve', 'warn');
      return;
    }
    const result = solveExpr(latex);
    if (!result.ok) {
      s.toast(result.note ?? 'Could not solve', 'error');
      return;
    }
    const src = targetBlock ?? (() => {
      const id = activeMathFieldRef.current?.closest('.block')?.getAttribute('data-id');
      return id ? sheet.blocks.find((b) => b.id === id) : null;
    })();
    if (src) {
      // place just below source
      s.addMathBlock({ latex: result.latex, x: src.x, y: src.y + Math.max(60, src.fontSize * 3) });
    } else {
      s.addMathBlock({ latex: result.latex });
    }
  }, []);

  // ---------- file IO ----------
  const onSaveFile = useCallback(() => {
    const s = useStore.getState();
    downloadJSON(
      {
        sheets: s.sheets,
        sheetOrder: s.sheetOrder,
        activeSheetId: s.activeSheetId,
      },
      'workspace.mathsheet',
    );
    s.toast('Workspace saved', 'success');
  }, []);

  const onOpenFile = useCallback(() => fileInputRef.current?.click(), []);
  const onFileChosen = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const json = JSON.parse(String(r.result));
        useStore.getState().replaceFromJSON(json);
        useStore.getState().toast('Workspace loaded', 'success');
      } catch (err) {
        console.error(err);
        useStore.getState().toast('Invalid file', 'error');
      }
    };
    r.readAsText(f);
    e.target.value = '';
  }, []);

  const onExportPNG = useCallback(async () => {
    const el = viewportRef.current;
    if (!el) return;
    const s = useStore.getState();
    try {
      s.toast('Rendering PNG…', 'info');
      const bg = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-canvas').trim() || '#f4f4ef';
      await exportElementToPng(el, `${s.sheets[s.activeSheetId].name}.png`, {
        backgroundColor: bg,
      });
      s.toast('PNG exported', 'success');
    } catch (err) {
      console.error(err);
      s.toast('PNG export failed', 'error');
    }
  }, []);

  const onClear = useCallback(() => {
    if (!confirm('Clear this sheet?')) return;
    useStore.getState().clearActiveSheet();
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

  // ---------- help dialog ----------
  const onHelp = useCallback(() => {
    useStore.getState().toast(
      'E = math · T = text · V/P/X = tools · + / − / 0 = zoom · Ctrl/Cmd+Click = multi-select · Ctrl+Enter (in field) = solve',
      'info',
    );
  }, []);

  // ---------- keyboard shortcuts ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName.toLowerCase();
      const editable = (e.target as HTMLElement | null)?.isContentEditable;
      if (tag === 'math-field' || tag === 'input' || tag === 'textarea' || editable) return;
      const s = useStore.getState();

      if (e.key === 'e' || e.key === 'E') { addMathAtCenter(); e.preventDefault(); }
      else if (e.key === 't' || e.key === 'T') { addTextAtCenter(); e.preventDefault(); }
      else if (e.key === 'v' || e.key === 'V') s.setTool('move');
      else if (e.key === 'p' || e.key === 'P') s.setTool('pen');
      else if (e.key === 'x' || e.key === 'X') s.setTool('eraser');
      else if (e.key === '0') s.resetView();
      else if (e.key === '+' || e.key === '=') onZoom(1.2);
      else if (e.key === '-') onZoom(1 / 1.2);
      else if (e.key === '?') onHelp();
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        for (const id of s.selectedIds) s.deleteBlock(id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addMathAtCenter, addTextAtCenter, onZoom, onHelp]);

  // ---------- first-run starter equation ----------
  const didStartRef = useRef(false);
  useEffect(() => {
    if (didStartRef.current) return;
    didStartRef.current = true;
    const s = useStore.getState();
    const sheet = s.sheets[s.activeSheetId];
    if (sheet.blocks.length === 0 && sheet.strokes.length === 0) {
      const center = centerOfViewport(viewportRef.current);
      s.addMathBlock({
        latex: 'x = \\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}',
        x: center[0] - 180,
        y: center[1] - 40,
      });
    }
  }, []);

  return (
    <>
      <IconSprite />
      <Toolbar
        onAddMath={addMathAtCenter}
        onAddText={addTextAtCenter}
        onHighlight={() => applyColorToSelection(true)}
        onColorPicked={(c) => {
          useStore.getState().setColorName(c);
          // If something is selected in a math-field, recolor immediately.
          const mf = activeMathFieldRef.current;
          if (mf && selectionLatex(mf)) {
            applyColorToSelection(false);
          }
        }}
        onSolve={onSolve}
        onZoomIn={() => onZoom(1.2)}
        onZoomOut={() => onZoom(1 / 1.2)}
        onResetView={() => useStore.getState().resetView()}
        onSave={onSaveFile}
        onOpen={onOpenFile}
        onPNG={onExportPNG}
        onClear={onClear}
        onHelp={onHelp}
      />
      <TabBar />
      <main className="surface">
        <Whiteboard
          setActiveMathField={setActiveMathField}
          onEvaluateRequest={onSolve}
          viewportRef={viewportRef}
        />
        <SelectionHint />
      </main>
      <Toaster />
      <input
        ref={fileInputRef}
        type="file"
        accept=".mathsheet,.json,application/json"
        hidden
        onChange={onFileChosen}
      />
    </>
  );
}

// Extract just the selected LaTeX (empty string if nothing selected).
function selectionLatex(mf: MathfieldElement): string {
  const sel = mf.selection;
  if (!sel) return '';
  // sel.ranges is an array of [start, end] offsets; all collapsed means no selection
  const collapsed = (sel.ranges as Array<[number, number]>).every(([a, b]) => a === b);
  if (collapsed) return '';
  return mf.getValue(sel, 'latex');
}

function centerOfViewport(el: HTMLDivElement | null): [number, number] {
  if (!el) return [200, 200];
  const r = el.getBoundingClientRect();
  const view = useStore.getState().sheets[useStore.getState().activeSheetId].view;
  return screenToWorld(view, r, r.left + r.width / 2, r.top + r.height / 2);
}

// Floating status pill at bottom-left — gives feedback that doesn't
// warrant a toast (selection count, current mode, etc.)
function SelectionHint() {
  const tool        = useStore((s) => s.tool);
  const selectedIds = useStore((s) => s.selectedIds);
  const blocks      = useStore((s) => s.sheets[s.activeSheetId].blocks);
  const mathSelected = selectedIds.filter((id) =>
    blocks.find((b) => b.id === id && b.type === 'math'),
  ).length;

  const lines: string[] = [];
  if (tool === 'pen')    lines.push('Pen — drag to draw');
  if (tool === 'eraser') lines.push('Eraser — drag over strokes to remove');
  if (mathSelected >= 2) lines.push(`${mathSelected} equations linked — Solve will solve as a system`);
  else if (selectedIds.length > 0) lines.push(`${selectedIds.length} selected`);

  if (lines.length === 0) return null;
  return (
    <div className="status-pill" aria-live="polite">
      <Icon name="info" />
      <span>{lines.join(' · ')}</span>
    </div>
  );
}
