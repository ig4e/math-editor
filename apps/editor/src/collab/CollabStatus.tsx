// Compact status indicator: peers in the current room. Mounted in the
// canvas footer (and as a Settings entry later).

import { useEffect, useState } from 'react';
import { subscribeSession, type CollabSession, type CollabPresence } from './session';

export function CollabStatus() {
  const [session, setSession] = useState<CollabSession | null>(null);
  const [peers, setPeers] = useState<CollabPresence[]>([]);

  useEffect(() => subscribeSession(setSession), []);

  useEffect(() => {
    if (!session) return;
    const update = () => {
      const states: CollabPresence[] = [];
      session.awareness.getStates().forEach((s) => {
        const u = (s as { user?: CollabPresence }).user;
        if (u) states.push(u);
      });
      setPeers(states);
    };
    update();
    session.awareness.on('change', update);
    return () => session.awareness.off('change', update);
  }, [session]);

  if (!session) return null;
  return (
    <div className="inline-flex items-center gap-1 text-[10px] text-fg-muted">
      <span className="relative inline-flex w-2 h-2 rounded-full bg-success">
        <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
      </span>
      <span>room <span className="font-mono text-fg-2">{session.roomId}</span></span>
      <span>· {peers.length} peer{peers.length === 1 ? '' : 's'}</span>
      <div className="flex -space-x-1 ml-1">
        {peers.slice(0, 5).map((p) => (
          <div
            key={p.userId}
            title={p.name}
            className="w-3.5 h-3.5 rounded-full border border-surface"
            style={{ background: p.color }}
          />
        ))}
      </div>
    </div>
  );
}
