// Smart solve hook. Decides between simplify, single solve, and system
// solve based on (in priority order):
//   1. The current selection — 2+ math blocks = system mode.
//   2. The link graph — if the active math block is part of a linked
//      component of 2+ math blocks, solve them as a system.
//   3. A single selected math block / the currently-focused math-field.
//
// Before any solve, variable definitions (`var = number`) from the active
// sheet are bound into the compute engine, so `F = ma` resolves naturally.

import { useCallback, type RefObject } from 'react';
import type { MathfieldElement } from 'mathlive';

import { useStore } from '../state/store';
import { solveExpr, solveSystem, simplify, ingestDefinitions } from '../solver';
import { selectionLatex } from '../utils/mathfield';
import { connectedMathBlocks } from '../state/graph';
import type { MathBlock } from '../state/types';

type Mode = 'solve' | 'simplify';

export function useSolveAction(activeMathFieldRef: RefObject<MathfieldElement | null>) {
  // Build a runner that the parent uses to wire BOTH "Solve" and "Simplify".
  return useCallback((mode: Mode = 'solve') => {
    const s = useStore.getState();
    const sheet = s.sheets[s.activeSheetId];
    const showSteps = s.showSteps;

    // Bind known variables for THIS solve.
    const defs = ingestDefinitions(sheet.blocks);

    // ---------- target detection ----------
    const selectedMath = s.selectedIds
      .map((id) => sheet.blocks.find((b) => b.id === id))
      .filter((b): b is MathBlock => !!b && b.type === 'math');

    const focusedId = s.activeMathBlockId;
    const focused = focusedId
      ? sheet.blocks.find((b) => b.id === focusedId && b.type === 'math') as MathBlock | undefined
      : undefined;

    // If user is asking to SIMPLIFY, that's always single-block-or-field.
    if (mode === 'simplify') {
      const target = selectedMath[0] ?? focused;
      const latex = (target?.latex) ||
        (activeMathFieldRef.current
          ? selectionLatex(activeMathFieldRef.current) || activeMathFieldRef.current.value
          : '');
      if (!latex.trim()) {
        s.toast('Click into an equation first', 'warn');
        return;
      }
      const r = simplify(latex);
      if (!r.ok) { s.toast(r.note ?? 'Could not simplify', 'error'); return; }
      placeBelow(target ?? null, r.latex, sheet);
      return;
    }

    // ---------- system mode: 2+ selected, or 2+ linked-and-focused ----------
    let systemBlocks: MathBlock[] | null = null;
    if (selectedMath.length >= 2) {
      systemBlocks = selectedMath;
    } else if (focused) {
      const linked = connectedMathBlocks(sheet, focused.id);
      if (linked.length >= 2) systemBlocks = linked;
    }

    if (systemBlocks) {
      const r = solveSystem(systemBlocks.map((b) => b.latex), { showSteps });
      if (!r.ok) { s.toast(r.note ?? 'Could not solve system', 'error'); return; }
      const maxY = Math.max(...systemBlocks.map((b) => b.y));
      const minX = Math.min(...systemBlocks.map((b) => b.x));
      const noteBits = [`solved from ${systemBlocks.length} equations`];
      if (defs.length) noteBits.push(`using ${defs.length} known var${defs.length === 1 ? '' : 's'}`);
      s.addMathBlock({
        latex: r.latex,
        x: minX,
        y: maxY + 120,
        note: noteBits.join(', '),
        showNote: true,
      });
      s.toast(`Solved system of ${systemBlocks.length} equations`, 'success');
      return;
    }

    // ---------- single block / active field ----------
    const target = selectedMath[0] ?? focused;
    let latex = '';
    if (target) {
      latex = target.latex;
    } else if (activeMathFieldRef.current) {
      const mf = activeMathFieldRef.current;
      latex = selectionLatex(mf) || mf.value;
    } else {
      s.toast('Click into an equation, or link/select equations to solve as a group', 'warn');
      return;
    }
    if (!latex.trim()) { s.toast('Nothing to solve', 'warn'); return; }

    const r = solveExpr(latex, { showSteps });
    if (!r.ok) { s.toast(r.note ?? 'Could not solve', 'error'); return; }

    const note = defs.length ? `used ${defs.length} known var${defs.length === 1 ? '' : 's'}` : undefined;
    placeBelow(target ?? null, r.latex, sheet, note);
  }, [activeMathFieldRef]);
}

function placeBelow(
  src: MathBlock | null,
  latex: string,
  sheet: ReturnType<typeof useStore.getState>['sheets'][string],
  note?: string,
) {
  const s = useStore.getState();
  if (src) {
    s.addMathBlock({
      latex,
      x: src.x,
      y: src.y + Math.max(80, src.fontSize * 3.5),
      note,
      showNote: !!note,
    });
    // Auto-link source to result so the chain is visible
    const resultId = s.selectedIds[0]; // addMathBlock selects the new one
    if (resultId && resultId !== src.id) s.addLink(src.id, resultId);
  } else {
    s.addMathBlock({ latex, note, showNote: !!note });
  }
  void sheet; // silence unused (caller passes for symmetry)
}
