// Zustand root store. Composes slices, persisted via the same key as before;
// a v2→v3 migration backfills `shapes` and `links` arrays onto existing sheets.

import { create, type StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSheetsSlice,    type SheetsSlice    } from './slices/sheets';
import { createBlocksSlice,    type BlocksSlice    } from './slices/blocks';
import { createStrokesSlice,   type StrokesSlice   } from './slices/strokes';
import { createShapesSlice,    type ShapesSlice    } from './slices/shapes';
import { createLinksSlice,     type LinksSlice     } from './slices/links';
import { createSelectionSlice, type SelectionSlice } from './slices/selection';
import { createUiSlice,        type UiSlice        } from './slices/ui';
import { createToastSlice,     type ToastSlice     } from './slices/toasts';

import type { Sheet } from './types';
import { backfillSheet } from './helpers';

export type Store =
  & SheetsSlice
  & BlocksSlice
  & StrokesSlice
  & ShapesSlice
  & LinksSlice
  & SelectionSlice
  & UiSlice
  & ToastSlice;

/**
 * Shared slice-creator type — pins the immer mutator across every slice so
 * `set` is the immer-flavored one and the slice types intersect cleanly.
 */
export type AppSlice<T> = StateCreator<
  Store,
  [['zustand/immer', never]],
  [],
  T
>;

const PERSIST_KEY = 'math-sheet:v2'; // key unchanged so old data survives
const PERSIST_VERSION = 3;

export const useStore = create<Store>()(
  persist(
    immer((set, get, api) => ({
      ...createSheetsSlice(set, get, api),
      ...createBlocksSlice(set, get, api),
      ...createStrokesSlice(set, get, api),
      ...createShapesSlice(set, get, api),
      ...createLinksSlice(set, get, api),
      ...createSelectionSlice(set, get, api),
      ...createUiSlice(set, get, api),
      ...createToastSlice(set, get, api),
    })),
    {
      name: PERSIST_KEY,
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        sheets: s.sheets,
        sheetOrder: s.sheetOrder,
        activeSheetId: s.activeSheetId,
        theme: s.theme,
        autoShape: s.autoShape,
        showSteps: s.showSteps,
      }),
      migrate: (state, fromVersion) => {
        // v2 sheets lacked `shapes` and `links` arrays — backfill defaults.
        if (fromVersion < 3 && state && typeof state === 'object') {
          const s = state as { sheets?: Record<string, Partial<Sheet>> };
          if (s.sheets) {
            for (const id of Object.keys(s.sheets)) {
              const sh = s.sheets[id];
              if (sh && sh.id && sh.name) {
                s.sheets[id] = backfillSheet(sh as Partial<Sheet> & { id: string; name: string });
              }
            }
          }
        }
        return state as Store;
      },
    },
  ),
);
