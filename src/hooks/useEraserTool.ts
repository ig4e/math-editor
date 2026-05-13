// Eraser gesture: drag over strokes to delete them. Uses distance hit-test
// instead of fragile path click events (the previous approach often missed
// thin strokes).

import { useCallback, useRef, type RefObject } from 'react';
import { useStore } from '../state/store';
import { screenToWorld } from '../utils/geom';

// Generous tolerance in screen pixels — converted to world units on use so
// the eraser feels the same regardless of zoom.
const ERASER_PX = 14;

export function useEraserTool(viewportRef: RefObject<HTMLDivElement | null>) {
  const erasing = useRef(false);

  const eraseAtClient = useCallback((clientX: number, clientY: number) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const view = useStore.getState().sheets[useStore.getState().activeSheetId].view;
    const [wx, wy] = screenToWorld(view, rect, clientX, clientY);
    useStore.getState().eraseAt([wx, wy], ERASER_PX / view.zoom);
  }, [viewportRef]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (useStore.getState().tool !== 'eraser') return;
    e.preventDefault();
    e.stopPropagation();
    erasing.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    eraseAtClient(e.clientX, e.clientY);
  }, [eraseAtClient]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (useStore.getState().tool !== 'eraser' || !erasing.current) return;
    eraseAtClient(e.clientX, e.clientY);
  }, [eraseAtClient]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    erasing.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
