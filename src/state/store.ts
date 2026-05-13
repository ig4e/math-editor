// Zustand root store. Composes slices, persisted to localStorage and wrapped
// in zundo's `temporal` middleware so we get clean Ctrl+Z / Ctrl+Y undo on
// user-data changes. Tool/theme/selection/etc. live outside the undo history.

import { create, type StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';

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

export type AppSlice<T> = StateCreator<
  Store,
  [['zustand/immer', never]],
  [],
  T
>;

const PERSIST_KEY = 'math-sheet:v2';
const PERSIST_VERSION = 3;
/** Cap undo history so deep edit sessions don't grow unbounded. */
const UNDO_LIMIT = 100;

export const useStore = create<Store>()(
  persist(
    temporal(
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
        limit: UNDO_LIMIT,
        // Only snapshot user-data — never tool/theme/selection/toasts.
        // This is what makes Ctrl+Z feel right: it doesn't accidentally
        // revert a theme toggle or undo a selection click.
        partialize: (s) => ({
          sheets: s.sheets,
          sheetOrder: s.sheetOrder,
        }),
        // Avoid pushing a snapshot for ephemeral updates (same shape).
        equality: (a, b) => a.sheets === b.sheets && a.sheetOrder === b.sheetOrder,
      },
    ),
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
