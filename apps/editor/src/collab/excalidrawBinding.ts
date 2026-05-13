// Custom Yjs ↔ Excalidraw binding. We don't use `y-excalidraw` because
// it has React 19 compatibility issues; this binding is purposely
// minimal so we control the conflict semantics.
//
// Data model: a Y.Map<string, ExcalidrawElement> keyed by element id.
// Anchors (math-block placeholder rects) are excluded from sync —
// block-level sync already covers them via session.ts, and double-
// syncing both views would race when one peer's useAnchorSync writes
// over another peer's just-arrived block move.
//
// Local → Yjs: on every debounced Excalidraw onChange, diff the scene
// vs the map (via the per-element `version` field) and Y.transact the
// deltas. Origin tag 'local' prevents echo.
//
// Yjs → local: observe the map. On non-local updates, gather the full
// element list (non-anchors from Yjs + locally-derived anchors from
// the live scene) and updateScene with captureUpdate:'never' so we
// don't pollute the undo stack.

import type * as Y from 'yjs';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { CollabSession } from './session';
import { isAnchor } from '../panels/canvas/anchors';
import { getExcalidrawAPI } from '../panels/canvas/inject';

const ORIGIN_LOCAL = 'excalidraw-binding-local';
type ElementWithVersion = ExcalidrawElement & { version?: number };

/** Wire two-way sync between a Yjs Y.Map and the active Excalidraw
 *  scene. Returns a teardown function. */
export function bindExcalidrawScene(session: CollabSession): () => void {
  const yMap = session.doc.getMap<ExcalidrawElement>('scene-elements');

  // ---- Yjs → local ---------------------------------------------------
  const onYjsUpdate = (_evt: Y.YMapEvent<ExcalidrawElement>, txn: Y.Transaction) => {
    if (txn.origin === ORIGIN_LOCAL) return;
    const api = getExcalidrawAPI();
    if (!api) return;
    // Gather remote non-anchor elements + local anchors.
    const remote: ExcalidrawElement[] = [];
    yMap.forEach((el) => remote.push(el));
    const localAnchors = api.getSceneElementsIncludingDeleted().filter(isAnchor);
    const next = [...remote, ...localAnchors];
    api.updateScene({
      elements: next as never,
      captureUpdate: 'never' as unknown as never,
    });
  };
  yMap.observe(onYjsUpdate);

  // ---- Local → Yjs ---------------------------------------------------
  // Diff a snapshot of the live scene against yMap and write deltas.
  const pushLocal = () => {
    const api = getExcalidrawAPI();
    if (!api) return;
    const current = api.getSceneElementsIncludingDeleted();
    const seen = new Set<string>();
    session.doc.transact(() => {
      for (const el of current) {
        if (isAnchor(el)) continue;       // local-only
        if (el.isDeleted) continue;       // Yjs tombstones via deletion below
        seen.add(el.id);
        const prev = yMap.get(el.id) as ElementWithVersion | undefined;
        const curV = (el as ElementWithVersion).version ?? 0;
        const prevV = prev?.version ?? -1;
        if (curV !== prevV) {
          // structuredClone strips any in-memory references / methods.
          yMap.set(el.id, structuredClone(el));
        }
      }
      yMap.forEach((_value, key) => {
        if (!seen.has(key)) yMap.delete(key);
      });
    }, ORIGIN_LOCAL);
  };

  // Excalidraw's onChange is already debounced upstream (CanvasPanel
  // wires a 250ms debounce). Subscribe directly — every call here is
  // already throttled.
  let off: (() => void) | null = null;
  const start = () => {
    const api = getExcalidrawAPI();
    if (!api) return;
    off = api.onChange(pushLocal);
    // Initial push so a fresh joiner sees the current scene.
    pushLocal();
  };
  // The api may resolve later than this function runs; poll briefly.
  if (getExcalidrawAPI()) {
    start();
  } else {
    const poll = window.setInterval(() => {
      if (getExcalidrawAPI()) {
        window.clearInterval(poll);
        start();
      }
    }, 100);
    // Stop polling after 10s; if the canvas never mounted, bail.
    window.setTimeout(() => window.clearInterval(poll), 10_000);
  }

  return () => {
    yMap.unobserve(onYjsUpdate);
    if (off) off();
  };
}
