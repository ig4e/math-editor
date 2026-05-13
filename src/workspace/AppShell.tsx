// AppShell — the new app root, replacing the FlexLayout-based
// Workspace from v2. Excalidraw is now THE host; every panel lives as
// a tab inside Excalidraw's native <Sidebar>, math and text blocks
// live as embeddable scene elements, and our extensions plug into
// Excalidraw's documented slots:
//
//   - <Sidebar>        → all panels (Solver, Variables, Graph, …)
//   - <MainMenu>       → math-specific items beside Excalidraw's
//   - <Footer>         → math toolbar + status strip
//   - <WelcomeScreen>  → first-run hints (Excalidraw's own primitives)
//   - renderTopRightUI → Add Math / Add Text + sidebar quick-launchers
//
// validateEmbeddable + renderEmbeddable wire math/text blocks as real
// Excalidraw elements (see ../panels/canvas/anchors.ts + BlockEmbed).

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Excalidraw, Sidebar } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { NonDeleted, ExcalidrawEmbeddableElement } from '@excalidraw/excalidraw/element/types';
import '@excalidraw/excalidraw/index.css';

import { useStore } from '../state/store';
import { useActiveSheet } from '../state/selectors';
import { CanvasMainMenu } from '../panels/canvas/CanvasMainMenu';
import { CanvasFooter } from '../panels/canvas/CanvasFooter';
import { CanvasWelcome } from '../panels/canvas/CanvasWelcome';
import { CanvasTopRight } from '../panels/canvas/CanvasTopRight';
import { SelectionToolbar } from '../panels/canvas/SelectionToolbar';
import { useEmbeddableSync, isBlockLink, blockIdFromElement } from '../panels/canvas/anchors';
import { setExcalidrawAPI, setSidebarToggler } from '../panels/canvas/inject';
import { BlockEmbed } from '../panels/canvas/BlockEmbed';
import { getAllPanels, subscribePanels } from './PanelRegistry';
import { Icon } from '../components/Icons';
import { Spinner } from '../components/common';
import './sidebar.css';

export const SIDEBAR_NAME = 'math-notebook';
const SCENE_DEBOUNCE_MS = 250;

export function AppShell() {
  const activeSheetId = useStore((s) => s.activeSheetId);
  const sheet = useActiveSheet();
  const setSheetSnapshot = useStore((s) => s.setSheetSnapshot);
  const setActiveSidebarTab = useStore((s) => s.setActiveSidebarTab);
  const activeSidebarTab = useStore((s) => s.activeSidebarTab);

  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  useEmbeddableSync(apiRef);

  // Re-render when panel registry changes (e.g. HMR adds a panel).
  const [, force] = useState(0);
  useEffect(() => subscribePanels(() => force((x) => x + 1)), []);

  const panels = useMemo(
    () => getAllPanels().filter((p) => p.id !== 'canvas'),
    // Re-evaluated on every render; the registry being a plain Map
    // means getAllPanels is cheap and the result is stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
    setSheetSnapshot(activeSheetId, {
      elements,
      appState: serializeAppState(appState),
      files,
    });
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

  // Imperative sidebar toggle for commands / panel-driven opens. We
  // expose it through the same inject module as the Excalidraw API.
  useEffect(() => {
    setSidebarToggler((tab) => {
      const api = apiRef.current;
      if (!api) return false;
      api.toggleSidebar({ name: SIDEBAR_NAME, tab, force: true });
      setActiveSidebarTab(tab);
      return true;
    });
    return () => setSidebarToggler(null);
  }, [setActiveSidebarTab]);

  return (
    <div className="absolute inset-0 bg-app">
      <Excalidraw
        key={activeSheetId}
        excalidrawAPI={(api) => { apiRef.current = api; setExcalidrawAPI(api); }}
        initialData={{
          ...(initialData ?? {}),
          appState: {
            ...((initialData?.['appState'] as object) ?? {}),
            theme: 'dark',
            // Pre-open the sidebar so the panel rail is visible on load.
            openSidebar: activeSidebarTab
              ? { name: SIDEBAR_NAME, tab: activeSidebarTab }
              : null,
          },
        }}
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
            toggleTheme: false,
            saveAsImage: true,
          },
          // Excalidraw's library sidebar uses 'library' as its name.
          // Keeping the dock pref docked keeps both side-by-side.
          dockedSidebarBreakpoint: 800,
        }}
      >
        <CanvasMainMenu />
        <CanvasFooter />
        <CanvasWelcome />
        <Sidebar
          name={SIDEBAR_NAME}
          docked
          onStateChange={(state) => {
            setActiveSidebarTab(state?.tab ?? null);
          }}
        >
          <Sidebar.Header />
          <Sidebar.Tabs>
            <Sidebar.TabTriggers>
              {panels.map((p) => (
                <Sidebar.TabTrigger key={p.id} tab={p.id}>
                  <span title={p.title} aria-label={p.title} className="inline-flex items-center justify-center">
                    <Icon name={p.icon} />
                  </span>
                </Sidebar.TabTrigger>
              ))}
            </Sidebar.TabTriggers>
            {panels.map((p) => {
              const C = p.component;
              return (
                <Sidebar.Tab key={p.id} tab={p.id}>
                  <PanelMount title={p.title}>
                    <C />
                  </PanelMount>
                </Sidebar.Tab>
              );
            })}
          </Sidebar.Tabs>
        </Sidebar>
      </Excalidraw>
      <SelectionToolbar apiRef={apiRef} />
    </div>
  );
}

function PanelMount({ children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-surface">
      <Suspense
        fallback={
          <div className="h-full w-full flex items-center justify-center gap-2 text-fg-muted text-sm">
            <Spinner /> Loading…
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}

function serializeAppState(s: Record<string, unknown>): Record<string, unknown> {
  const keep = [
    'gridSize', 'viewBackgroundColor', 'scrollX', 'scrollY', 'zoom',
    'currentItemStrokeColor', 'currentItemBackgroundColor',
    'currentItemFillStyle', 'currentItemStrokeWidth',
    'currentItemRoughness', 'currentItemOpacity', 'currentItemFontFamily',
    'currentItemFontSize', 'currentItemTextAlign', 'currentItemRoundness',
    'currentItemArrowType', 'currentItemEndArrowhead', 'currentItemStartArrowhead',
    'openSidebar',
  ];
  const out: Record<string, unknown> = {};
  for (const k of keep) {
    if (k in s) out[k] = s[k];
  }
  return out;
}
