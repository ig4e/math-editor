// Canvas panel — hosts Excalidraw with its full native UI. Extension
// happens via Excalidraw's documented slots:
//   - MainMenu       → CanvasMainMenu  (math-specific menu items beside theirs)
//   - renderTopRightUI → CanvasTopRight (+ Math / + Text / theme toggle)
//   - Footer         → CanvasFooter (active-provider, var-count, ⌘K hint)
//   - WelcomeScreen  → CanvasWelcome (on empty sheets)
//
// Math blocks + bound-arrow anchors land in P2c (MathOverlay + anchors.ts).
// inject.ts (programmatic injection from other panels) lands with P2c too.
//
// We import Excalidraw's CSS at the panel level so it's part of the
// canvas-panel chunk, not the main entry.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';

import { useStore } from '../../state/store';
import { useActiveSheet } from '../../state/selectors';
import { CanvasMainMenu } from './CanvasMainMenu';
import { CanvasTopRight } from './CanvasTopRight';
import { CanvasFooter } from './CanvasFooter';
import { CanvasWelcome } from './CanvasWelcome';
import { MathOverlay } from './MathOverlay';
import { useAnchorSync } from './anchors';
import { setExcalidrawAPI } from './inject';

const SCENE_DEBOUNCE_MS = 250;

export default function CanvasPanel() {
  const activeSheetId = useStore((s) => s.activeSheetId);
  const sheet = useActiveSheet();
  const theme = useStore((s) => s.theme);
  const setSheetSnapshot = useStore((s) => s.setSheetSnapshot);

  // ExcalidrawImperativeAPI ref — captured via the `excalidrawAPI` prop.
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  // Bidirectional block ↔ anchor sync.
  useAnchorSync(apiRef);

  // `initialData` is read once per sheet mount; flipping sheets needs a
  // remount, so we use the sheetId as a React key on <Excalidraw>.
  const [initialData] = useState(() => {
    const snap = sheet?.excalidrawSnapshot;
    return snap && typeof snap === 'object'
      ? (snap as Record<string, unknown>)
      : undefined;
  });

  // Debounced scene → store snapshot.
  const debounceTimer = useRef<number | null>(null);
  const persistScene = useCallback(() => {
    if (!apiRef.current) return;
    const elements = apiRef.current.getSceneElements();
    const appState = apiRef.current.getAppState();
    const files = apiRef.current.getFiles();
    // We strip transient appState (selection, viewBackgroundColor on theme
    // switch) so Ctrl+Z and reloads don't fight each other.
    const snapshot = {
      elements,
      appState: serializeAppState(appState),
      files,
    };
    setSheetSnapshot(activeSheetId, snapshot);
  }, [activeSheetId, setSheetSnapshot]);

  const onChange = useCallback(() => {
    if (debounceTimer.current !== null) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(persistScene, SCENE_DEBOUNCE_MS);
  }, [persistScene]);

  // Final flush on unmount.
  useEffect(() => () => {
    if (debounceTimer.current !== null) window.clearTimeout(debounceTimer.current);
    persistScene();
  }, [persistScene]);

  return (
    <div className="h-full w-full relative">
      <Excalidraw
        key={activeSheetId}
        excalidrawAPI={(api) => { apiRef.current = api; setExcalidrawAPI(api); }}
        initialData={initialData}
        onChange={onChange}
        theme={theme}
        renderTopRightUI={() => <CanvasTopRight apiRef={apiRef} />}
        UIOptions={{
          // We expose our own canvas-level dialog later; let Excalidraw's
          // canvas-area help-popover stay on (it documents shape shortcuts).
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            export: { saveFileToDisk: true },
            loadScene: true,
            saveToActiveFile: true,
            toggleTheme: false, // our prefsSlice.theme is the source of truth
            saveAsImage: true,
          },
        }}
      >
        <CanvasMainMenu />
        <CanvasFooter />
        <CanvasWelcome />
      </Excalidraw>
      <MathOverlay apiRef={apiRef} />
    </div>
  );
}

// ----- helpers ---------------------------------------------------------

/** Trim transient appState fields that would otherwise dirty the persist
 *  layer on every cursor wiggle. We keep view (zoom/scroll), grid, and
 *  user-settable defaults. */
function serializeAppState(s: Record<string, unknown>): Record<string, unknown> {
  const keep = [
    'gridSize', 'viewBackgroundColor', 'scrollX', 'scrollY', 'zoom',
    'currentItemStrokeColor', 'currentItemBackgroundColor',
    'currentItemFillStyle', 'currentItemStrokeWidth',
    'currentItemRoughness', 'currentItemOpacity', 'currentItemFontFamily',
    'currentItemFontSize', 'currentItemTextAlign', 'currentItemRoundness',
    'currentItemArrowType', 'currentItemEndArrowhead', 'currentItemStartArrowhead',
  ];
  const out: Record<string, unknown> = {};
  for (const k of keep) {
    if (k in s) out[k] = s[k];
  }
  return out;
}
