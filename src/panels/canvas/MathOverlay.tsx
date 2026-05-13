// MathOverlay — renders math/text blocks on top of the Excalidraw canvas,
// positioned via `sceneCoordsToViewportCoords`. Layered above the canvas
// (z-index in pointer-events: none container, blocks themselves are
// pointer-events: auto so MathLive can receive input).
//
// We re-render on Excalidraw's appState changes (which is also throttled
// by useSyncExternalStore-style listener). Position math uses Excalidraw's
// scene→viewport helper so pan/zoom is "free".

import { useEffect, useState } from 'react';
import { sceneCoordsToViewportCoords } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useStore } from '../../state/store';
import { useActiveSheet, useRefNumbers } from '../../state/selectors';
import { MathBlock } from './MathBlock';
import { TextBlock } from './TextBlock';

interface Props {
  apiRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
}

export function MathOverlay({ apiRef }: Props) {
  const sheet = useActiveSheet();
  const selectedIds = useStore((s) => s.selectedIds);
  const refNumbers = useRefNumbers();
  const [tick, setTick] = useState(0);

  // Re-render on every Excalidraw scene mutation so positions stay in
  // sync with pan/zoom/drag. Excalidraw debounces internally.
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const off = api.onChange(() => setTick((t) => t + 1));
    return () => { off(); };
  }, [apiRef]);

  const api = apiRef.current;
  if (!api || !sheet) return null;
  // Read on every render so we get the latest scroll/zoom values.
  const appState = api.getAppState();
  void tick;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {sheet.blocks.map((b) => {
        const { x, y } = sceneCoordsToViewportCoords({ sceneX: b.x, sceneY: b.y }, appState);
        const selected = selectedIds.includes(b.id);
        return (
          <div
            key={b.id}
            className="absolute"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: `scale(${appState.zoom.value})`,
              transformOrigin: 'top left',
            }}
          >
            {b.type === 'math' ? (
              <MathBlock block={b} selected={selected} refNumber={refNumbers[b.id] ?? null} />
            ) : (
              <TextBlock block={b} selected={selected} />
            )}
          </div>
        );
      })}
    </div>
  );
}
