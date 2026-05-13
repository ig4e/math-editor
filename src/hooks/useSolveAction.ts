// Smart solve handler — figures out whether to evaluate a single expression,
// solve a single equation, or solve a system based on what's selected.

import { useCallback, type RefObject } from 'react';
import type { MathfieldElement } from 'mathlive';

import { useStore } from '../state/store';
import { solveExpr, solveSystem } from '../solver';
import { selectionLatex } from '../utils/mathfield';
import type { MathBlock } from '../state/types';

export function useSolveAction(activeMathFieldRef: RefObject<MathfieldElement | null>) {
  return useCallback(() => {
    const s = useStore.getState();
    const sheet = s.sheets[s.activeSheetId];

    const selectedMath = s.selectedIds
      .map((id) => sheet.blocks.find((b) => b.id === id))
      .filter((b): b is MathBlock => !!b && b.type === 'math');

    // ----- system mode -----
    if (selectedMath.length >= 2) {
      const r = solveSystem(selectedMath.map((b) => b.latex));
      if (!r.ok) { s.toast(r.note ?? 'Could not solve system', 'error'); return; }
      const maxY = Math.max(...selectedMath.map((b) => b.y));
      const minX = Math.min(...selectedMath.map((b) => b.x));
      s.addMathBlock({
        latex: r.latex,
        x: minX,
        y: maxY + 100,
        note: `solved from ${selectedMath.length} equations`,
        showNote: true,
      });
      s.toast(`Solved system of ${selectedMath.length} equations`, 'success');
      return;
    }

    // ----- single block / active field mode -----
    const target = selectedMath.length === 1 ? selectedMath[0] : null;
    let latex = '';
    if (target) {
      latex = target.latex;
    } else if (activeMathFieldRef.current) {
      const mf = activeMathFieldRef.current;
      latex = selectionLatex(mf) || mf.value;
    } else {
      s.toast('Click into an equation, or select equations to solve as a system', 'warn');
      return;
    }

    if (!latex.trim()) { s.toast('Nothing to solve', 'warn'); return; }

    const r = solveExpr(latex);
    if (!r.ok) { s.toast(r.note ?? 'Could not solve', 'error'); return; }

    // Place beneath the source block
    const src = target ?? (() => {
      const id = activeMathFieldRef.current?.closest('.js-block')?.getAttribute('data-id');
      return id ? sheet.blocks.find((b) => b.id === id) : null;
    })();
    if (src) {
      s.addMathBlock({
        latex: r.latex,
        x: src.x,
        y: src.y + Math.max(60, src.fontSize * 3),
      });
    } else {
      s.addMathBlock({ latex: r.latex });
    }
  }, [activeMathFieldRef]);
}
