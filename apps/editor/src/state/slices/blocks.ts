// Blocks slice — CRUD on the active sheet's blocks.
//
// As of Stage C the scene (Excalidraw element graph) is the source of
// truth for blocks. Each block is a first-class `math` / `text-block`
// element carrying its own content. This slice still exposes the
// familiar addMathBlock / updateBlock / deleteBlock surface so the
// hundreds of callsites in panels + commands + AI tools don't need
// to change — they delegate to the scene helpers in
// `panels/canvas/blockElements.ts`. A scene -> store mirror in
// `AppShell` keeps `sheet.blocks` in sync for read-only consumers.

import type { AppSlice } from '../store';
import type { Block, MathBlock, TextBlock } from '../types';
import {
  addMathElement,
  addTextBlockElement,
  updateBlockElement,
  deleteBlockElement,
  duplicateBlockElement,
} from '../../panels/canvas/blockElements';
import type { BlockPatch } from '../../panels/canvas/blockElements';

export interface BlocksSlice {
  addMathBlock: (opts?: Partial<MathBlock>) => string;
  addTextBlock: (opts?: Partial<TextBlock>) => string;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  moveBlock: (id: string, x: number, y: number) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  setShowNote: (id: string, on: boolean) => void;
}

/**
 * Mirror a freshly-created block into the store immediately, so callers
 * that read `sheet.blocks` synchronously after addMathBlock() see the
 * new entry without waiting for the next onChange tick.
 */
function mirrorAdd(
  set: Parameters<AppSlice<BlocksSlice>>[0],
  block: Block,
): void {
  set((s) => {
    const sh = s.sheets[s.activeSheetId];
    if (!sh) return;
    if (sh.blocks.some((b) => b.id === block.id)) return;
    sh.blocks.push(block);
    s.selectedIds = [block.id];
  });
}

export const createBlocksSlice: AppSlice<BlocksSlice> = (set) => ({
  addMathBlock: (opts) => {
    const id =
      addMathElement(opts) ??
      // Fallback: API not ready yet (very early init). Create a
      // store-only stub; the scene mirror will reconcile on next
      // onChange when the user does anything.
      `block-${Math.random().toString(36).slice(2, 11)}`;
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
    mirrorAdd(set, block);
    return id;
  },

  addTextBlock: (opts) => {
    const id =
      addTextBlockElement(opts) ??
      `block-${Math.random().toString(36).slice(2, 11)}`;
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
    mirrorAdd(set, block);
    return id;
  },

  updateBlock: (id, patch) => {
    // Push to scene first — that's the canonical store.
    updateBlockElement(id, patch as BlockPatch);
    // Also mirror to the store immediately so subscribers see the
    // change before the next onChange round-trips.
    set((s) => {
      const sh = s.sheets[s.activeSheetId];
      const b = sh?.blocks.find((b) => b.id === id);
      if (b) Object.assign(b, patch);
    });
  },

  moveBlock: (id, x, y) => {
    updateBlockElement(id, { x, y });
    set((s) => {
      const sh = s.sheets[s.activeSheetId];
      const b = sh?.blocks.find((b) => b.id === id);
      if (b) {
        b.x = x;
        b.y = y;
      }
    });
  },

  deleteBlock: (id) => {
    deleteBlockElement(id);
    set((s) => {
      const sh = s.sheets[s.activeSheetId];
      if (!sh) return;
      sh.blocks = sh.blocks.filter((b) => b.id !== id);
      s.selectedIds = s.selectedIds.filter((x) => x !== id);
      if (s.activeMathBlockId === id) s.activeMathBlockId = null;
    });
  },

  duplicateBlock: (id) => {
    const newId = duplicateBlockElement(id);
    if (!newId) return;
    set((s) => {
      const sh = s.sheets[s.activeSheetId];
      const src = sh?.blocks.find((b) => b.id === id);
      if (!sh || !src) return;
      const copy: Block = { ...src, id: newId, x: src.x + 30, y: src.y + 30 };
      sh.blocks.push(copy);
      s.selectedIds = [newId];
    });
  },

  setShowNote: (id, on) => {
    updateBlockElement(id, { showNote: on });
    set((s) => {
      const sh = s.sheets[s.activeSheetId];
      const b = sh?.blocks.find((b) => b.id === id);
      if (b) b.showNote = on;
    });
  },
});
