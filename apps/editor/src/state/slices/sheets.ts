// Sheets / tabs slice — owns the multi-sheet workspace, the active sheet,
// the active sheet's view (pan/zoom), and bulk operations like clear and
// import-from-JSON.

import type { AppSlice } from '../store';
import type { Sheet, View } from '../types';
import { newSheet } from '../helpers';

export interface SheetsSlice {
  sheets: Record<string, Sheet>;
  sheetOrder: string[];
  activeSheetId: string;

  // tabs
  addSheet: () => void;
  removeSheet: (id: string) => void;
  renameSheet: (id: string, name: string) => void;
  setActiveSheet: (id: string) => void;
  reorderSheet: (id: string, toIndex: number) => void;

  // view
  setView: (v: Partial<View>) => void;
  resetView: () => void;

  // per-sheet Excalidraw scene snapshot (Phase 2 writes via canvasPanel)
  setSheetSnapshot: (id: string, snapshot: unknown) => void;

  // Replace the sheet's blocks array with a snapshot derived from the
  // scene. Stage C: scene is source-of-truth; AppShell calls this on
  // every onChange to mirror block elements into the store so panels
  // keep their useStore selectors.
  setSheetBlocks: (id: string, blocks: import('../types').Block[]) => void;

  // per-sheet markdown notes (Phase 7 writes via NotesPanel)
  setSheetNotes: (id: string, notes: string) => void;

  // bulk
  clearActiveSheet: () => void;
  replaceFromJSON: (data: unknown) => void;
}

// Initial sheet that ships when there's no persisted data.
const initialSheet = newSheet();

export const createSheetsSlice: AppSlice<SheetsSlice> = (set) => ({
  sheets: { [initialSheet.id]: initialSheet },
  sheetOrder: [initialSheet.id],
  activeSheetId: initialSheet.id,

  // -------- tabs --------
  addSheet: () => set((s) => {
    const sheet = newSheet(`Sheet ${s.sheetOrder.length + 1}`);
    s.sheets[sheet.id] = sheet;
    s.sheetOrder.push(sheet.id);
    s.activeSheetId = sheet.id;
    s.selectedIds = [];
  }),

  removeSheet: (id) => set((s) => {
    if (s.sheetOrder.length === 1) {
      const next = newSheet('Sheet 1');
      delete s.sheets[id];
      s.sheets[next.id] = next;
      s.sheetOrder = [next.id];
      s.activeSheetId = next.id;
      s.selectedIds = [];
      return;
    }
    const idx = s.sheetOrder.indexOf(id);
    delete s.sheets[id];
    s.sheetOrder.splice(idx, 1);
    if (s.activeSheetId === id) {
      const fallback = s.sheetOrder[Math.max(0, idx - 1)];
      if (fallback) s.activeSheetId = fallback;
      s.selectedIds = [];
    }
  }),

  renameSheet: (id, name) => set((s) => {
    const sh = s.sheets[id];
    if (sh) sh.name = name.trim() || sh.name;
  }),

  setActiveSheet: (id) => set((s) => {
    if (!s.sheets[id]) return;
    s.activeSheetId = id;
    s.selectedIds = [];
    s.activeMathBlockId = null;
  }),

  reorderSheet: (id, toIndex) => set((s) => {
    const from = s.sheetOrder.indexOf(id);
    if (from < 0) return;
    s.sheetOrder.splice(from, 1);
    s.sheetOrder.splice(toIndex, 0, id);
  }),

  // -------- view --------
  setView: (v) => set((s) => {
    const sh = s.sheets[s.activeSheetId];
    if (sh) sh.view = { ...sh.view, ...v };
  }),
  resetView: () => set((s) => {
    const sh = s.sheets[s.activeSheetId];
    if (sh) sh.view = { panX: 0, panY: 0, zoom: 1 };
  }),

  // -------- snapshot --------
  setSheetSnapshot: (id, snapshot) => set((s) => {
    const sh = s.sheets[id];
    if (sh) sh.excalidrawSnapshot = snapshot;
  }),

  setSheetBlocks: (id, blocks) => set((s) => {
    const sh = s.sheets[id];
    if (!sh) return;
    sh.blocks = blocks;
  }),

  setSheetNotes: (id, notes) => set((s) => {
    const sh = s.sheets[id];
    if (sh) sh.notes = notes;
  }),

  // -------- bulk --------
  clearActiveSheet: () => set((s) => {
    const sh = s.sheets[s.activeSheetId];
    if (!sh) return;
    sh.blocks = [];
    sh.excalidrawSnapshot = undefined;
    sh.view = { panX: 0, panY: 0, zoom: 1 };
    s.selectedIds = [];
    s.activeMathBlockId = null;
  }),

  replaceFromJSON: (data) => set((s) => {
    const d = data as Partial<Pick<SheetsSlice, 'sheets' | 'sheetOrder' | 'activeSheetId'>>;
    if (d.sheets && d.sheetOrder && d.activeSheetId) {
      s.sheets = d.sheets;
      s.sheetOrder = d.sheetOrder;
      s.activeSheetId = d.activeSheetId;
      s.selectedIds = [];
    }
  }),
});
