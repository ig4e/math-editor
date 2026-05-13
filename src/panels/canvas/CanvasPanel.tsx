// Canvas panel — hosts Excalidraw with its full native UI. Math and
// text blocks live as real Excalidraw `embeddable` elements (NOT a
// React overlay): their position, size, drag, zoom, scroll, select,
// undo, delete are all owned by Excalidraw natively.
//
// `validateEmbeddable` allow-lists our custom `mathblock://` and
// `textblock://` link schemes; `renderEmbeddable` renders the React
// subtree (math-field / contenteditable) inside the element bounds via
// <BlockEmbed>.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { NonDeleted, ExcalidrawEmbeddableElement } from '@excalidraw/excalidraw/element/types';
import '@excalidraw/excalidraw/index.css';

import { useStore } from '../../state/store';
import { useActiveSheet } from '../../state/selectors';
import { CanvasMainMenu } from './CanvasMainMenu';
import { CanvasTopRight } from './CanvasTopRight';
import { CanvasFooter } from './CanvasFooter';
import { CanvasWelcome } from './CanvasWelcome';
import { SelectionToolbar } from './SelectionToolbar';
import { useEmbeddableSync, isBlockLink, blockIdFromElement } from './anchors';
import { setExcalidrawAPI } from './inject';
import { BlockEmbed } from './BlockEmbed';

const SCENE_DEBOUNCE_MS = 250;

export default function CanvasPanel() {
  const activeSheetId = useStore((s) => s.activeSheetId);
  const sheet = useActiveSheet();
  const setSheetSnapshot = useStore((s) => s.setSheetSnapshot);

  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  // Block-as-embeddable sync (was useAnchorSync in v2).
  useEmbeddableSync(apiRef);

  const [initialData] = useState(() => {
    const snap = sheet?.excalidrawSnapshot;
    return snap && typeof snap === 'object'
      ? (snap as Record<string, unknown>)
      : undefined;
  });

  const debounceTimer = useRef<number | null>(null);
  const persistScene = useCallback(() => {
    if (!apiRef.current) return;
    const elements = apiRef.current.getSceneElements();
    const appState = apiRef.current.getAppState();
    const files = apiRef.current.getFiles();
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

  useEffect(() => () => {
    if (debounceTimer.current !== null) window.clearTimeout(debounceTimer.current);
    persistScene();
  }, [persistScene]);

  const renderEmbeddable = useCallback((element: NonDeleted<ExcalidrawEmbeddableElement>) => {
    const ref = blockIdFromElement(element);
    if (!ref) return null;
    return <BlockEmbed blockId={ref.id} type={ref.type} />;
  }, []);

  return (
    <div className="h-full w-full relative">
      <Excalidraw
        key={activeSheetId}
        excalidrawAPI={(api) => { apiRef.current = api; setExcalidrawAPI(api); }}
        initialData={initialData}
        onChange={onChange}
        theme="dark"
        validateEmbeddable={isBlockLink}
        renderEmbeddable={renderEmbeddable}
        renderTopRightUI={() => <CanvasTopRight apiRef={apiRef} />}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            export: { saveFileToDisk: true },
            loadScene: true,
            saveToActiveFile: true,
            toggleTheme: false, // app is dark-only
            saveAsImage: true,
          },
        }}
      >
        <CanvasMainMenu />
        <CanvasFooter />
        <CanvasWelcome />
      </Excalidraw>
      <SelectionToolbar apiRef={apiRef} />
    </div>
  );
}

// ----- helpers ---------------------------------------------------------

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
