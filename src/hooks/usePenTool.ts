// Pen-tool gesture: creates a stroke on pointerdown, extends on move,
// and (when autoShape is on) runs the recognizer on completion — replacing
// the freehand stroke with a clean parametric shape if recognition succeeds.

import { useCallback, useRef, type RefObject } from 'react';
import { useStore } from '../state/store';
import { COLOR_HEX } from '../utils/colors';
import { screenToWorld } from '../utils/geom';
import { uid } from '../state/helpers';
import { recognize } from '../utils/recognizer';

export function usePenTool(viewportRef: RefObject<HTMLDivElement | null>) {
  const activeStrokeId = useRef<string | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (useStore.getState().tool !== 'pen') return;
    if (!viewportRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = viewportRef.current.getBoundingClientRect();
    const view = useStore.getState().sheets[useStore.getState().activeSheetId].view;
    const [wx, wy] = screenToWorld(view, rect, e.clientX, e.clientY);
    const stroke = {
      id: uid(),
      color: COLOR_HEX[useStore.getState().colorName],
      width: 2,
      points: [[round(wx), round(wy)] as [number, number]],
    };
    useStore.getState().addStroke(stroke);
    activeStrokeId.current = stroke.id;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [viewportRef]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (useStore.getState().tool !== 'pen' || !activeStrokeId.current) return;
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const view = useStore.getState().sheets[useStore.getState().activeSheetId].view;
    const [wx, wy] = screenToWorld(view, rect, e.clientX, e.clientY);
    useStore.getState().appendStrokePoint(activeStrokeId.current, [round(wx), round(wy)]);
  }, [viewportRef]);

  const onPointerUp = useCallback(() => {
    const id = activeStrokeId.current;
    activeStrokeId.current = null;
    if (!id) return;

    const s = useStore.getState();
    if (!s.autoShape) return;

    const sheet = s.sheets[s.activeSheetId];
    const stroke = sheet.strokes.find((st) => st.id === id);
    if (!stroke) return;

    const shape = recognize(stroke);
    if (shape) {
      s.replaceStrokeWithShape(id, shape);
      s.toast(`Recognized: ${shape.kind}`, 'info');
    }
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}

const round = (n: number) => Math.round(n * 10) / 10;
