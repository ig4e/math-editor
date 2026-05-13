// Eraser gesture: drag-erase over any mark (strokes, shapes, links).
// Distance-based hit-tests delegate to each slice so the eraser hits the
// thing closest under the cursor.

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
    const s = useStore.getState();
    const view = s.sheets[s.activeSheetId].view;
    const [wx, wy] = screenToWorld(view, rect, clientX, clientY);
    const tol = ERASER_PX / view.zoom;
    // Hit-test strokes → shapes → links, in that visual stacking order.
    s.eraseAt([wx, wy], tol)
      || s.eraseShapeAt([wx, wy], tol)
      || s.eraseLinkAt([wx, wy], tol);
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
