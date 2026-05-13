// Selection slice — which blocks are visually selected, plus a separate
// "active math-field" pointer for the field that has the caret right now.

import type { AppSlice } from '../store';

export interface SelectionSlice {
  selectedIds: string[];
  activeMathBlockId: string | null;

  setSelection: (ids: string[]) => void;
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  setActiveMathBlockId: (id: string | null) => void;
}

export const createSelectionSlice: AppSlice<SelectionSlice> = (set) => ({
  selectedIds: [],
  activeMathBlockId: null,

  setSelection: (ids) => set((s) => { s.selectedIds = [...ids]; }),
  toggleSelected: (id) => set((s) => {
    const i = s.selectedIds.indexOf(id);
    if (i >= 0) s.selectedIds.splice(i, 1);
    else s.selectedIds.push(id);
  }),
  clearSelection: () => set((s) => { s.selectedIds = []; }),
  setActiveMathBlockId: (id) => set((s) => { s.activeMathBlockId = id; }),
});
