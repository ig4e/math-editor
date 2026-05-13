// Block header drag-to-move. Returns pointer handlers to spread onto the
// block's header element.

import { useCallback, type RefObject } from 'react';
import { useStore } from '../state/store';
import { screenToWorld } from '../utils/geom';
import { useGestureRef } from './useGestureRef';

interface DragState { dx: number; dy: number; viewport: DOMRect }

export function useBlockDrag(blockId: string, viewportRef: RefObject<HTMLDivElement | null>) {
  const drag = useGestureRef<DragState>();

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (useStore.getState().tool !== 'move') return;
    e.stopPropagation();
    const s = useStore.getState();
    const sheet = s.sheets[s.activeSheetId];
    const block = sheet.blocks.find((b) => b.id === blockId);
    if (!block) return;

    // selection logic — single click selects, modifiers extend
    if (e.shiftKey || e.ctrlKey || e.metaKey) s.toggleSelected(blockId);
    else if (!s.selectedIds.includes(blockId)) s.setSelection([blockId]);

    const viewport = viewportRef.current?.getBoundingClientRect();
    if (!viewport) return;
    const [wx, wy] = screenToWorld(sheet.view, viewport, e.clientX, e.clientY);
    drag.start(e.pointerId, { dx: wx - block.x, dy: wy - block.y, viewport });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [blockId, drag, viewportRef]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.matches(e.pointerId)) return;
    const d = drag.read()!;
    const view = useStore.getState().sheets[useStore.getState().activeSheetId].view;
    const [wx, wy] = screenToWorld(view, d.viewport, e.clientX, e.clientY);
    useStore.getState().moveBlock(blockId, Math.round(wx - d.dx), Math.round(wy - d.dy));
  }, [blockId, drag]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    drag.end(e.pointerId);
  }, [drag]);

  return { onPointerDown, onPointerMove, onPointerUp };
}
