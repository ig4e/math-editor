// Zustand root store. Composes six slices, persisted via the same key + version
// as before so existing localStorage data carries over unchanged.

import { create, type StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createSheetsSlice,    type SheetsSlice    } from './slices/sheets';
import { createBlocksSlice,    type BlocksSlice    } from './slices/blocks';
import { createStrokesSlice,   type StrokesSlice   } from './slices/strokes';
import { createSelectionSlice, type SelectionSlice } from './slices/selection';
import { createUiSlice,        type UiSlice        } from './slices/ui';
import { createToastSlice,     type ToastSlice     } from './slices/toasts';

export type Store =
  & SheetsSlice
  & BlocksSlice
  & StrokesSlice
  & SelectionSlice
  & UiSlice
  & ToastSlice;

/**
 * Shared slice-creator type. The mutators tuple pins immer everywhere so
 * every slice gets the immer-flavored `set` and TS can intersect them
 * cleanly. Use this type when defining any new slice.
 */
export type AppSlice<T> = StateCreator<
  Store,
  [['zustand/immer', never]],
  [],
  T
>;

const PERSIST_KEY = 'math-sheet:v2';
const PERSIST_VERSION = 2;

export const useStore = create<Store>()(
  persist(
    immer((set, get, api) => ({
      ...createSheetsSlice(set, get, api),
      ...createBlocksSlice(set, get, api),
      ...createStrokesSlice(set, get, api),
      ...createSelectionSlice(set, get, api),
      ...createUiSlice(set, get, api),
      ...createToastSlice(set, get, api),
    })),
    {
      name: PERSIST_KEY,
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Only persist user-data + theme. Tool, color, selection, toasts
      // are session-only by design.
      partialize: (s) => ({
        sheets: s.sheets,
        sheetOrder: s.sheetOrder,
        activeSheetId: s.activeSheetId,
        theme: s.theme,
      }),
    },
  ),
);
