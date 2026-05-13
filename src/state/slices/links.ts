// Equation links — a graph of "these solve together". Drawing a link between
// two blocks adds an edge; solving any node walks the connected component.

import type { AppSlice } from '../store';
import { uid } from '../helpers';

export interface LinksSlice {
  addLink: (fromId: string, toId: string) => void;
  removeLink: (id: string) => void;
  /** Pending source for the link tool's two-click interaction. */
  linkPendingFrom: string | null;
  setLinkPendingFrom: (id: string | null) => void;
  /** Drag-erase hit test against links. */
  eraseLinkAt: (pt: [number, number], tolerance: number) => boolean;
}

import { segDistSq } from '../../utils/shapeGeom';

export const createLinksSlice: AppSlice<LinksSlice> = (set, get) => ({
  linkPendingFrom: null,

  addLink: (fromId, toId) => set((s) => {
    if (fromId === toId) return;
    const sh = s.sheets[s.activeSheetId];
    // dedupe — undirected
    const exists = sh.links.some(
      (l) => (l.fromId === fromId && l.toId === toId)
          || (l.fromId === toId   && l.toId === fromId),
    );
    if (exists) return;
    sh.links.push({ id: uid(), fromId, toId });
  }),

  removeLink: (id) => set((s) => {
    const sh = s.sheets[s.activeSheetId];
    sh.links = sh.links.filter((l) => l.id !== id);
  }),

  setLinkPendingFrom: (id) => set((s) => { s.linkPendingFrom = id; }),

  eraseLinkAt: (pt, tolerance) => {
    let removed = false;
    const s = get();
    const sh = s.sheets[s.activeSheetId];
    // Approximate each link as a segment between block centers (180×60 default).
    const centerOf = (id: string): [number, number] | null => {
      const b = sh.blocks.find((b) => b.id === id);
      if (!b) return null;
      return [b.x + 90, b.y + 28];
    };
    const t2 = tolerance * tolerance;
    set((s2) => {
      const sh2 = s2.sheets[s2.activeSheetId];
      const before = sh2.links.length;
      sh2.links = sh2.links.filter((l) => {
        const a = centerOf(l.fromId);
        const b = centerOf(l.toId);
        if (!a || !b) return false;
        return segDistSq(a, b, pt) >= t2;
      });
      removed = sh2.links.length !== before;
    });
    return removed;
  },
});
