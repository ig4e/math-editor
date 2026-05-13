// Single Zustand store. Persisted fields go inside the `persist` slice;
// transient UI state (active tool, selection, toasts) lives outside it.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Block, MathBlock, TextBlock, Sheet, Stroke, Tool, ColorName,
  Toast, ToastKind, Theme, View,
} from './types';

const STORAGE_KEY = 'math-sheet:v2';

// ---------- helpers ----------
const uid = () => Math.random().toString(36).slice(2, 10);

function newSheet(name = 'Sheet 1'): Sheet {
  return {
    id: uid(),
    name,
    blocks: [],
    strokes: [],
    view: { panX: 0, panY: 0, zoom: 1 },
  };
}

// ---------- types ----------
interface PersistedState {
  sheets: Record<string, Sheet>;
  sheetOrder: string[];
  activeSheetId: string;
  theme: Theme;
}

interface State extends PersistedState {
  // session
  tool: Tool;
  colorName: ColorName;
  selectedIds: string[];
  activeMathBlockId: string | null;
  toasts: Toast[];

  // selectors (helpers)
  active: () => Sheet;
}

interface Actions {
  // sheets / tabs
  addSheet: () => void;
  removeSheet: (id: string) => void;
  renameSheet: (id: string, name: string) => void;
  setActiveSheet: (id: string) => void;
  reorderSheet: (id: string, toIndex: number) => void;

  // view
  setView: (v: Partial<View>) => void;
  resetView: () => void;

  // blocks
  addMathBlock: (opts?: Partial<MathBlock>) => string;
  addTextBlock: (opts?: Partial<TextBlock>) => string;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  moveBlock: (id: string, x: number, y: number) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  setShowNote: (id: string, on: boolean) => void;

  // selection
  setSelection: (ids: string[]) => void;
  toggleSelected: (id: string) => void;
  clearSelection: () => void;

  // strokes
  addStroke: (s: Stroke) => void;
  appendStrokePoint: (id: string, pt: [number, number]) => void;
  eraseAt: (pt: [number, number], tolerance: number) => boolean;

  // tool/color/theme
  setTool: (t: Tool) => void;
  setColorName: (c: ColorName) => void;
  setTheme: (t: Theme) => void;

  // math focus
  setActiveMathBlockId: (id: string | null) => void;

  // toasts
  toast: (message: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;

  // sheet clear / replace
  clearActiveSheet: () => void;
  replaceFromJSON: (json: unknown) => void;
}

// ---------- store ----------
const initialSheet = newSheet();
const initialPersisted: PersistedState = {
  sheets: { [initialSheet.id]: initialSheet },
  sheetOrder: [initialSheet.id],
  activeSheetId: initialSheet.id,
  theme:
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
};

export const useStore = create<State & Actions>()(
  persist(
    immer((set, get) => ({
      ...initialPersisted,

      // session
      tool: 'move',
      colorName: 'black',
      selectedIds: [],
      activeMathBlockId: null,
      toasts: [],

      active: () => get().sheets[get().activeSheetId],

      // ---------- sheets / tabs ----------
      addSheet: () => set((s) => {
        const sheet = newSheet(`Sheet ${s.sheetOrder.length + 1}`);
        s.sheets[sheet.id] = sheet;
        s.sheetOrder.push(sheet.id);
        s.activeSheetId = sheet.id;
        s.selectedIds = [];
      }),

      removeSheet: (id) => set((s) => {
        if (s.sheetOrder.length === 1) {
          // never end up with zero sheets — reset the last one instead
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

      // ---------- view ----------
      setView: (v) => set((s) => {
        const sh = s.sheets[s.activeSheetId];
        sh.view = { ...sh.view, ...v };
      }),

      resetView: () => set((s) => {
        s.sheets[s.activeSheetId].view = { panX: 0, panY: 0, zoom: 1 };
      }),

      // ---------- blocks ----------
      addMathBlock: (opts) => {
        const id = uid();
        set((s) => {
          const sh = s.sheets[s.activeSheetId];
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
        const b = sh.blocks.find((b) => b.id === id);
        if (!b) return;
        Object.assign(b, patch);
      }),

      moveBlock: (id, x, y) => set((s) => {
        const b = s.sheets[s.activeSheetId].blocks.find((b) => b.id === id);
        if (b) { b.x = x; b.y = y; }
      }),

      deleteBlock: (id) => set((s) => {
        const sh = s.sheets[s.activeSheetId];
        sh.blocks = sh.blocks.filter((b) => b.id !== id);
        s.selectedIds = s.selectedIds.filter((x) => x !== id);
        if (s.activeMathBlockId === id) s.activeMathBlockId = null;
      }),

      duplicateBlock: (id) => set((s) => {
        const sh = s.sheets[s.activeSheetId];
        const b = sh.blocks.find((b) => b.id === id);
        if (!b) return;
        const copy: Block = { ...b, id: uid(), x: b.x + 30, y: b.y + 30 };
        sh.blocks.push(copy);
        s.selectedIds = [copy.id];
      }),

      setShowNote: (id, on) => set((s) => {
        const b = s.sheets[s.activeSheetId].blocks.find((b) => b.id === id);
        if (b) b.showNote = on;
      }),

      // ---------- selection ----------
      setSelection: (ids) => set((s) => { s.selectedIds = [...ids]; }),
      toggleSelected: (id) => set((s) => {
        const i = s.selectedIds.indexOf(id);
        if (i >= 0) s.selectedIds.splice(i, 1);
        else s.selectedIds.push(id);
      }),
      clearSelection: () => set((s) => { s.selectedIds = []; }),

      // ---------- strokes ----------
      addStroke: (stroke) => set((s) => {
        s.sheets[s.activeSheetId].strokes.push(stroke);
      }),
      appendStrokePoint: (id, pt) => set((s) => {
        const st = s.sheets[s.activeSheetId].strokes.find((x) => x.id === id);
        if (!st) return;
        const last = st.points[st.points.length - 1];
        if (last && Math.hypot(pt[0] - last[0], pt[1] - last[1]) < 1.5) return;
        st.points.push(pt);
      }),
      eraseAt: (pt, tolerance) => {
        let removed = false;
        set((s) => {
          const sh = s.sheets[s.activeSheetId];
          const before = sh.strokes.length;
          sh.strokes = sh.strokes.filter(
            (st) => !strokeHitsPoint(st, pt, tolerance),
          );
          removed = sh.strokes.length !== before;
        });
        return removed;
      },

      // ---------- tool/color/theme ----------
      setTool: (t) => set((s) => { s.tool = t; }),
      setColorName: (c) => set((s) => { s.colorName = c; }),
      setTheme: (t) => set((s) => {
        s.theme = t;
        document.documentElement.dataset.theme = t;
      }),

      setActiveMathBlockId: (id) => set((s) => { s.activeMathBlockId = id; }),

      // ---------- toasts ----------
      toast: (message, kind = 'info') => set((s) => {
        const id = uid();
        s.toasts.push({ id, message, kind });
        setTimeout(() => {
          // schedule dismissal from outside immer (closure on `id`)
          useStore.getState().dismissToast(id);
        }, kind === 'error' ? 5000 : 2800);
      }),
      dismissToast: (id) => set((s) => {
        s.toasts = s.toasts.filter((t) => t.id !== id);
      }),

      // ---------- bulk ----------
      clearActiveSheet: () => set((s) => {
        const sh = s.sheets[s.activeSheetId];
        sh.blocks = [];
        sh.strokes = [];
        sh.view = { panX: 0, panY: 0, zoom: 1 };
        s.selectedIds = [];
      }),

      replaceFromJSON: (data) => set((s) => {
        try {
          const d = data as Partial<PersistedState>;
          if (d.sheets && d.sheetOrder && d.activeSheetId) {
            s.sheets = d.sheets;
            s.sheetOrder = d.sheetOrder;
            s.activeSheetId = d.activeSheetId;
            s.selectedIds = [];
          } else {
            // Single-sheet import: treat as the active sheet
            const single = data as Sheet;
            if (single.blocks && single.strokes && single.view) {
              const id = uid();
              const sh: Sheet = { ...single, id, name: single.name || 'Imported' };
              s.sheets[id] = sh;
              s.sheetOrder.push(id);
              s.activeSheetId = id;
              s.selectedIds = [];
            }
          }
        } catch {
          // swallow — caller toasts
        }
      }),
    })),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): PersistedState => ({
        sheets: s.sheets,
        sheetOrder: s.sheetOrder,
        activeSheetId: s.activeSheetId,
        theme: s.theme,
      }),
      version: 2,
    },
  ),
);

// ---------- stroke hit test ----------
function strokeHitsPoint(
  s: Stroke,
  [px, py]: [number, number],
  tolerance: number,
): boolean {
  const t2 = tolerance * tolerance;
  const pts = s.points;
  if (pts.length === 1) {
    const [ax, ay] = pts[0];
    return (ax - px) ** 2 + (ay - py) ** 2 < t2;
  }
  for (let i = 1; i < pts.length; i++) {
    if (segDistSq(pts[i - 1], pts[i], [px, py]) < t2) return true;
  }
  return false;
}
function segDistSq(
  [ax, ay]: [number, number],
  [bx, by]: [number, number],
  [px, py]: [number, number],
): number {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const x = ax + t * dx, y = ay + t * dy;
  return (px - x) ** 2 + (py - y) ** 2;
}
