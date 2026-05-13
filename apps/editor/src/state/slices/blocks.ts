// Blocks slice — CRUD on the active sheet's blocks array.

import type { AppSlice } from '../store';
import type { Block, MathBlock, TextBlock } from '../types';
import { uid } from '../helpers';

export interface BlocksSlice {
  addMathBlock: (opts?: Partial<MathBlock>) => string;
  addTextBlock: (opts?: Partial<TextBlock>) => string;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  moveBlock: (id: string, x: number, y: number) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  setShowNote: (id: string, on: boolean) => void;
}

export const createBlocksSlice: AppSlice<BlocksSlice> = (set) => ({
  addMathBlock: (opts) => {
    const id = uid();
    set((s) => {
      const sh = s.sheets[s.activeSheetId];
      if (!sh) return;
      const block: MathBlock = {
        id,
        type: 'math',
        x: opts?.x ?? 100,
        y: opts?.y ?? 100,
        fontSize: opts?.fontSize ?? 22,
        note: opts?.note ?? '',
        showNote: opts?.showNote ?? false,
        latex: opts?.latex ?? '',
      };
      sh.blocks.push(block);
      s.selectedIds = [id];
    });
    return id;
  },

  addTextBlock: (opts) => {
    const id = uid();
    set((s) => {
      const sh = s.sheets[s.activeSheetId];
      if (!sh) return;
      const block: TextBlock = {
        id,
        type: 'text',
        x: opts?.x ?? 100,
        y: opts?.y ?? 100,
        fontSize: opts?.fontSize ?? 16,
        note: opts?.note ?? '',
        showNote: opts?.showNote ?? false,
        text: opts?.text ?? '',
      };
      sh.blocks.push(block);
      s.selectedIds = [id];
    });
    return id;
  },

  updateBlock: (id, patch) => set((s) => {
    const sh = s.sheets[s.activeSheetId];
    const b = sh?.blocks.find((b) => b.id === id);
    if (!b) return;
    Object.assign(b, patch);
  }),

  moveBlock: (id, x, y) => set((s) => {
    const sh = s.sheets[s.activeSheetId];
    const b = sh?.blocks.find((b) => b.id === id);
    if (b) { b.x = x; b.y = y; }
  }),

  deleteBlock: (id) => set((s) => {
    const sh = s.sheets[s.activeSheetId];
    if (!sh) return;
    sh.blocks = sh.blocks.filter((b) => b.id !== id);
    s.selectedIds = s.selectedIds.filter((x) => x !== id);
    if (s.activeMathBlockId === id) s.activeMathBlockId = null;
  }),

  duplicateBlock: (id) => set((s) => {
    const sh = s.sheets[s.activeSheetId];
    const b = sh?.blocks.find((b) => b.id === id);
    if (!sh || !b) return;
    const copy: Block = { ...b, id: uid(), x: b.x + 30, y: b.y + 30 };
    sh.blocks.push(copy);
    s.selectedIds = [copy.id];
  }),

  setShowNote: (id, on) => set((s) => {
    const sh = s.sheets[s.activeSheetId];
    const b = sh?.blocks.find((b) => b.id === id);
    if (b) b.showNote = on;
  }),
});
