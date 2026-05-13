// The whiteboard surface: viewport → world wrapper (translate only) → stroke
// layer + blocks. A "pen capture" layer sits on top in pen/eraser mode so
// drawing always wins over block UI (this fixes the "can't draw over
// equations" bug — blocks no longer block events).
//
// Crisp-zoom strategy: we do NOT use CSS scale. The wrapper only `translate`s
// (panX, panY). Each block multiplies its world-coords and base font-size by
// `zoom` to compute its pixel-perfect render position. The strokes layer
// rebuilds its path d-strings whenever zoom changes. End result: math and
// strokes are always rendered at their actual resolution.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { MathfieldElement } from 'mathlive';
import { useStore } from '../state/store';
import { Block } from './Block';
import { StrokeLayer } from './StrokeLayer';
import { screenToWorld, clamp } from '../utils/geom';

interface Props {
  /** Receives the live <math-field> for whichever block is focused. */
  setActiveMathField: (el: MathfieldElement | null) => void;
  onEvaluateRequest: () => void;
  /** The viewport div is exposed so the export module can rasterize it. */
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

const ERASER_TOLERANCE = 14; // world units — generous so it's easy to hit thin strokes

export function Whiteboard({ setActiveMathField, onEvaluateRequest, viewportRef }: Props) {
  const sheet         = useStore((s) => s.sheets[s.activeSheetId]);
  const tool          = useStore((s) => s.tool);
  const colorName     = useStore((s) => s.colorName);
  const selectedIds   = useStore((s) => s.selectedIds);
  const clearSelection= useStore((s) => s.clearSelection);
  const setView       = useStore((s) => s.setView);
  const addStroke     = useStore((s) => s.addStroke);
  const appendPoint   = useStore((s) => s.appendStrokePoint);
  const eraseAt       = useStore((s) => s.eraseAt);

  const view = sheet.view;

  // ---------- pan ----------
  const panRef = useRef<{
    pointerId: number; startX: number; startY: number; panX0: number; panY0: number;
  } | null>(null);

  const onViewportPointerDown = (e: React.PointerEvent) => {
    if (tool !== 'move') return;
    if (e.button === 2) return;
    if ((e.target as HTMLElement).closest('.block')) return; // block handles its own drag
    panRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX, startY: e.clientY,
      panX0: view.panX, panY0: view.panY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    clearSelection();
  };
  const onViewportPointerMove = (e: React.PointerEvent) => {
    const p = panRef.current;
    if (p && e.pointerId === p.pointerId) {
      setView({
        panX: p.panX0 + (e.clientX - p.startX),
        panY: p.panY0 + (e.clientY - p.startY),
      });
    }
  };
  const onViewportPointerUp = (e: React.PointerEvent) => {
    if (panRef.current?.pointerId === e.pointerId) panRef.current = null;
  };

  // ---------- zoom ----------
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const lx = e.clientX - rect.left, ly = e.clientY - rect.top;
    const factor = Math.exp(-e.deltaY * 0.0015);
    const cur = useStore.getState().sheets[useStore.getState().activeSheetId].view;
    const newZoom = clamp(cur.zoom * factor, 0.25, 4);
    const ratio = newZoom / cur.zoom;
    setView({
      panX: lx - (lx - cur.panX) * ratio,
      panY: ly - (ly - cur.panY) * ratio,
      zoom: newZoom,
    });
  }, [setView, viewportRef]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel, viewportRef]);

  // ---------- pen / eraser overlay ----------
  const strokeIdRef = useRef<string | null>(null);

  const startStroke = (e: React.PointerEvent) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const [wx, wy] = screenToWorld(view, rect, e.clientX, e.clientY);
    const stroke = {
      id: Math.random().toString(36).slice(2, 10),
      color: COLOR_HEX[colorName],
      width: 2,
      points: [[round(wx), round(wy)] as [number, number]],
    };
    addStroke(stroke);
    strokeIdRef.current = stroke.id;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const continueStroke = (e: React.PointerEvent) => {
    if (!strokeIdRef.current || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const [wx, wy] = screenToWorld(view, rect, e.clientX, e.clientY);
    appendPoint(strokeIdRef.current, [round(wx), round(wy)]);
  };
  const endStroke = () => { strokeIdRef.current = null; };

  // Eraser: drag-to-erase with hit testing.
  const erasingRef = useRef(false);
  const eraseAtClient = (clientX: number, clientY: number) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const [wx, wy] = screenToWorld(view, rect, clientX, clientY);
    // Tolerance is in world units, but adjusted slightly so it feels constant on screen.
    eraseAt([wx, wy], ERASER_TOLERANCE / view.zoom);
  };
  const onPenPointerDown = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (tool === 'pen') startStroke(e);
    else if (tool === 'eraser') {
      erasingRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      eraseAtClient(e.clientX, e.clientY);
    }
  };
  const onPenPointerMove = (e: React.PointerEvent) => {
    if (tool === 'pen' && strokeIdRef.current) continueStroke(e);
    else if (tool === 'eraser' && erasingRef.current) eraseAtClient(e.clientX, e.clientY);
  };
  const onPenPointerUp = (e: React.PointerEvent) => {
    if (tool === 'pen') endStroke();
    else if (tool === 'eraser') erasingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // ---------- label numbering for math blocks ----------
  const refNumbers = useMemo(() => {
    const m = new Map<string, number>();
    let n = 0;
    for (const b of sheet.blocks) if (b.type === 'math') m.set(b.id, ++n);
    return m;
  }, [sheet.blocks]);

  // Track which block last claimed the math-field (so the parent can act on it)
  const setMathFieldFor = useRef(new Map<string, MathfieldElement | null>());
  const handleMathFieldRef = useCallback(
    (id: string) => (el: MathfieldElement | null) => {
      if (el) {
        setMathFieldFor.current.set(id, el);
        // Only push to parent when this block is the focused one. We rely on
        // the math-field's own focus events to push the actual "current" one.
        el.addEventListener('focusin', () => setActiveMathField(el));
      } else {
        setMathFieldFor.current.delete(id);
      }
    },
    [setActiveMathField],
  );

  return (
    <div
      ref={viewportRef}
      className={`viewport tool-${tool}`}
      onPointerDown={onViewportPointerDown}
      onPointerMove={onViewportPointerMove}
      onPointerUp={onViewportPointerUp}
      onPointerCancel={onViewportPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* The "world" is translation-only; per-element pixel sizing handles zoom */}
      <div
        className="world"
        style={{ transform: `translate3d(${view.panX}px, ${view.panY}px, 0)` }}
      >
        <StrokeLayer />
        <div className="blocks">
          {sheet.blocks.map((b) => (
            <Block
              key={b.id}
              block={b}
              selected={selectedIds.includes(b.id)}
              refNumber={refNumbers.get(b.id) ?? null}
              onMathFieldRef={handleMathFieldRef(b.id)}
              onEvaluateRequest={onEvaluateRequest}
            />
          ))}
        </div>
      </div>

      {/* Pen / eraser capture layer — sits ABOVE blocks so drawing always wins */}
      {(tool === 'pen' || tool === 'eraser') && (
        <div
          className="pen-capture"
          data-export-ignore="true"
          onPointerDown={onPenPointerDown}
          onPointerMove={onPenPointerMove}
          onPointerUp={onPenPointerUp}
          onPointerCancel={onPenPointerUp}
        />
      )}
    </div>
  );
}

// xcolor name → hex used for stroke color. Kept in sync with Toolbar's COLORS.
const COLOR_HEX: Record<string, string> = {
  black:  '#111111',
  red:    '#e11d48',
  blue:   '#2563eb',
  green:  '#16a34a',
  orange: '#ca8a04',
  purple: '#9333ea',
};

const round = (n: number) => Math.round(n * 10) / 10;
