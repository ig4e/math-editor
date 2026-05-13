// Corner resize: scales the block's per-block fontSize. We use fontSize
// rather than width/height because the math-field re-lays out crisp at
// any size when font-size changes (free higher quality on resize).

import { useCallback } from 'react';
import { useStore } from '../state/store';
import { useGestureRef } from './useGestureRef';

interface ResizeState { startFs: number; startX: number; startY: number }

const MIN_FS = 10;
const MAX_FS = 80;

export function useBlockResize(blockId: string) {
  const resize = useGestureRef<ResizeState>();

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const s = useStore.getState();
    const block = s.sheets[s.activeSheetId].blocks.find((b) => b.id === blockId);
    if (!block) return;
    resize.start(e.pointerId, {
      startFs: block.fontSize,
      startX: e.clientX,
      startY: e.clientY,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [blockId, resize]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!resize.matches(e.pointerId)) return;
    const r = resize.read()!;
    const view = useStore.getState().sheets[useStore.getState().activeSheetId].view;
    // Average X+Y drag so resize feels natural in any direction.
    const delta = ((e.clientX - r.startX) + (e.clientY - r.startY)) / 2;
    // Divide by current zoom so the drag feel is independent of zoom level.
    const next = r.startFs + (delta / Math.max(view.zoom, 0.5)) * 0.25;
    const clamped = Math.max(MIN_FS, Math.min(MAX_FS, next));
    useStore.getState().updateBlock(blockId, {
      fontSize: Math.round(clamped * 10) / 10,
    });
  }, [blockId, resize]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    resize.end(e.pointerId);
  }, [resize]);

  return { onPointerDown, onPointerMove, onPointerUp };
}
