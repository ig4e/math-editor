// Sheets / tabs slice — owns the multi-sheet workspace, the active sheet,
// the active sheet's view (pan/zoom), and bulk operations like clear and
// import-from-JSON (which act on sheets and so live here).

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
      // never end up with zero sheets — reset to a single blank one
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
      s.activeSheetId = s.sheetOrder[Math.max(0, idx - 1)];
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
    sh.view = { ...sh.view, ...v };
  }),
  resetView: () => set((s) => {
    s.sheets[s.activeSheetId].view = { panX: 0, panY: 0, zoom: 1 };
  }),

  // -------- bulk --------
  clearActiveSheet: () => set((s) => {
    const sh = s.sheets[s.activeSheetId];
    sh.blocks = [];
    sh.strokes = [];
    sh.view = { panX: 0, panY: 0, zoom: 1 };
    s.selectedIds = [];
  }),

  replaceFromJSON: (data) => set((s) => {
    const d = data as Partial<Pick<SheetsSlice, 'sheets' | 'sheetOrder' | 'activeSheetId'>>;
    if (d.sheets && d.sheetOrder && d.activeSheetId) {
      s.sheets = d.sheets;
      s.sheetOrder = d.sheetOrder;
      s.activeSheetId = d.activeSheetId;
      s.selectedIds = [];
      return;
    }
    // Legacy single-sheet import — wrap into a new sheet
    const single = data as Sheet;
    if (single && single.blocks && single.strokes && single.view) {
      const sh: Sheet = { ...single, id: newSheet().id, name: single.name || 'Imported' };
      s.sheets[sh.id] = sh;
      s.sheetOrder.push(sh.id);
      s.activeSheetId = sh.id;
      s.selectedIds = [];
    }
  }),
});
