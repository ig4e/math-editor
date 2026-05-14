// Custom Yjs ↔ Excalidraw binding. We don't use `y-excalidraw` because
// it has React 19 compatibility issues; this binding is purposely
// minimal so we control the conflict semantics.
//
// Data model: a Y.Map<string, ExcalidrawElement> keyed by element id.
// As of Stage C, every scene element — including math + text-block —
// is a first-class Excalidraw element with its full content embedded
// in the element. They sync via this map like everything else; no
// special-case carve-out remains.
//
// Local → Yjs: on every debounced Excalidraw onChange, diff the scene
// vs the map (via the per-element `version` field) and Y.transact the
// deltas. Origin tag 'local' prevents echo.
//
// Yjs → local: observe the map. On non-local updates, gather the full
// element list from Yjs and updateScene with captureUpdate:'never' so
// we don't pollute the undo stack.

import type * as Y from 'yjs';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { CollabSession } from './session';
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
    const remote: ExcalidrawElement[] = [];
    yMap.forEach((el) => remote.push(el));
    api.updateScene({
      elements: remote as never,
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

  // Excalidraw's onChange is already debounced upstream (AppShell
  // wires a 250 ms debounce on persistence). Subscribe directly —
  // every call here is already throttled.
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
