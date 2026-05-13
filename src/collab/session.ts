// Yjs + y-webrtc collab session. One session per active room; the room
// ID lives in the URL hash (#room=<id>). Sync covers the active sheet's
// math/text blocks; canvas (Excalidraw) sync is a follow-up.
//
// Peer-to-peer via the public y-webrtc signaling server (free, no
// account). For deployments that need a private signaler, set
// `roomSignaling` in startCollab opts.

import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { useStore } from '../state/store';
import type { Block } from '../state/types';

export interface CollabPresence {
  /** Random short user ID assigned on join. */
  userId: string;
  name: string;
  color: string;
  /** Optional cursor position in canvas scene coords. */
  cursor?: { x: number; y: number };
  activeBlockId?: string | null;
}

export interface CollabSession {
  roomId: string;
  doc: Y.Doc;
  provider: WebrtcProvider;
  /** Public peer info from the Yjs awareness instance. */
  awareness: WebrtcProvider['awareness'];
  /** Tear-down: stop sync + close peer connections. */
  destroy(): void;
}

let active: CollabSession | null = null;
const listeners = new Set<(s: CollabSession | null) => void>();

export function subscribeSession(cb: (s: CollabSession | null) => void): () => void {
  listeners.add(cb);
  cb(active);
  return () => listeners.delete(cb);
}

export function getSession(): CollabSession | null { return active; }

export function startCollab(opts: {
  roomId: string;
  user: { name: string; color: string };
  signaling?: string[];
}): CollabSession {
  destroyCollab();
  const doc = new Y.Doc();
  const provider = new WebrtcProvider(opts.roomId, doc, {
    signaling: opts.signaling ?? ['wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://signaling.yjs.dev'],
    password: undefined,
    awareness: undefined,
    maxConns: 20,
    filterBcConns: true,
    peerOpts: {},
  });

  const userId = Math.random().toString(36).slice(2, 10);
  provider.awareness.setLocalStateField('user', {
    userId,
    name: opts.user.name,
    color: opts.user.color,
  } satisfies Partial<CollabPresence>);

  active = {
    roomId: opts.roomId,
    doc,
    provider,
    awareness: provider.awareness,
    destroy() {
      provider.destroy();
      doc.destroy();
      if (active && active.roomId === opts.roomId) active = null;
      listeners.forEach((l) => l(null));
    },
  };
  listeners.forEach((l) => l(active));

  // Wire bidirectional sync — see ./sync.ts.
  bindToStore(active);

  return active;
}

export function destroyCollab(): void {
  active?.destroy();
}

// ----- sync (block-level only — Excalidraw scene sync deferred) -------

function bindToStore(session: CollabSession): void {
  const blocks = session.doc.getMap<Block>('blocks');
  // On every Yjs update, mirror to the store.
  blocks.observe(() => {
    const next: Block[] = [];
    blocks.forEach((b) => next.push(b));
    const s = useStore.getState();
    const sheet = s.sheets[s.activeSheetId];
    if (!sheet) return;
    // Replace blocks atomically; the panel re-renders.
    s.replaceFromJSON({
      sheets: {
        ...s.sheets,
        [s.activeSheetId]: { ...sheet, blocks: next },
      },
      sheetOrder: s.sheetOrder,
      activeSheetId: s.activeSheetId,
    });
  });

  // On every store change (block edit/add/delete locally), mirror into
  // the Yjs map. We unsubscribe when the session is destroyed.
  const unsub = useStore.subscribe((state) => {
    const sheet = state.sheets[state.activeSheetId];
    if (!sheet) return;
    // Cheap diff: clear + repopulate. Yjs is good at this — it diffs
    // the resulting CRDT operations behind the scenes.
    session.doc.transact(() => {
      const seen = new Set<string>();
      for (const b of sheet.blocks) {
        seen.add(b.id);
        blocks.set(b.id, b);
      }
      blocks.forEach((_, key) => {
        if (!seen.has(key)) blocks.delete(key);
      });
    });
  });

  // Patch destroy to unhook the store subscription too.
  const realDestroy = session.destroy.bind(session);
  session.destroy = () => { unsub(); realDestroy(); };
}

// ----- room id helpers ------------------------------------------------

export function generateRoomId(): string {
  const a = crypto.getRandomValues(new Uint8Array(6));
  return [...a].map((b) => b.toString(36)).join('').slice(0, 10);
}

export function readRoomFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const m = window.location.hash.match(/[#&]room=([^&]+)/);
  return m ? decodeURIComponent(m[1]!) : null;
}

export function buildRoomURL(roomId: string): string {
  const base = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}`;
  return `${base}#room=${encodeURIComponent(roomId)}`;
}
