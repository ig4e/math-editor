// Pan + wheel-zoom for the whiteboard viewport.
//
// Returns a handler bag for pointer events (used in move mode) and attaches
// its own wheel listener with passive:false so we can preventDefault scroll.

import { useCallback, useEffect, type RefObject } from 'react';
import { useStore } from '../state/store';
import { clamp } from '../utils/geom';
import { useGestureRef } from './useGestureRef';

interface PanState { startX: number; startY: number; panX0: number; panY0: number }

export function usePanZoom(viewportRef: RefObject<HTMLDivElement | null>) {
  const pan = useGestureRef<PanState>();

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (useStore.getState().tool !== 'move') return;
    if (e.button === 2) return;
    // Don't pan when grabbing inside a block — block owns its own drag.
    if ((e.target as HTMLElement).closest('.js-block')) return;

    const view = useStore.getState().sheets[useStore.getState().activeSheetId].view;
    pan.start(e.pointerId, {
      startX: e.clientX, startY: e.clientY,
      panX0: view.panX, panY0: view.panY,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    useStore.getState().clearSelection();
  }, [pan]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!pan.matches(e.pointerId)) return;
    const p = pan.read()!;
    useStore.getState().setView({
      panX: p.panX0 + (e.clientX - p.startX),
      panY: p.panY0 + (e.clientY - p.startY),
    });
  }, [pan]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pan.end(e.pointerId);
  }, [pan]);

  // Wheel must be a native listener so we can opt out of passive mode.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const lx = e.clientX - rect.left;
      const ly = e.clientY - rect.top;
      const cur = useStore.getState().sheets[useStore.getState().activeSheetId].view;
      const factor = Math.exp(-e.deltaY * 0.0015);
      const newZoom = clamp(cur.zoom * factor, 0.25, 4);
      const ratio = newZoom / cur.zoom;
      useStore.getState().setView({
        panX: lx - (lx - cur.panX) * ratio,
        panY: ly - (ly - cur.panY) * ratio,
        zoom: newZoom,
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewportRef]);

  return { onPointerDown, onPointerMove, onPointerUp };
}
