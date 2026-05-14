// AppShell — the new app root, replacing the FlexLayout-based
// Workspace from v2. Excalidraw is now THE host; every panel lives as
// a tab inside Excalidraw's native <Sidebar>, math and text blocks
// are first-class scene element types (`math`, `text-block`), and our
// extensions plug into Excalidraw's documented slots:
//
//   - <Sidebar>          → all panels (Solver, Variables, Graph, …)
//   - <MainMenu>         → math-specific items beside Excalidraw's
//   - <Footer>           → math toolbar + status strip
//   - <WelcomeScreen>    → first-run hints (Excalidraw's own primitives)
//   - renderTopRightUI   → Add Math / Add Text + sidebar quick-launchers
//   - renderBlockContent → math-field / contenteditable HTML overlay
//                          on top of each block scene element

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Excalidraw, Sidebar, isBlockElement } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type {
  NonDeleted,
  ExcalidrawBlockElement,
  ExcalidrawMathElement,
  ExcalidrawTextBlockElement,
} from '@excalidraw/excalidraw/element/types';
// SCSS barrel exported by the workspace fork of @excalidraw/excalidraw.
// The published npm package shipped a single bundled `index.css`; the
// source equivalent splits into app.scss + styles.scss + fonts/fonts.css,
// re-exported through ../packages/excalidraw/index.scss.
import '@excalidraw/excalidraw/index.scss';

import { useStore } from '../state/store';
import { useActiveSheet } from '../state/selectors';
import type { Block } from '../state/types';
import { CanvasMainMenu } from '../panels/canvas/CanvasMainMenu';
import { CanvasFooter } from '../panels/canvas/CanvasFooter';
import { CanvasWelcome } from '../panels/canvas/CanvasWelcome';
import { CanvasTopRight } from '../panels/canvas/CanvasTopRight';
import { CanvasTTDDialog } from '../panels/canvas/CanvasTTDDialog';
import { SelectionToolbar } from '../panels/canvas/SelectionToolbar';
import { setExcalidrawAPI, setSidebarToggler } from '../panels/canvas/inject';
import { BlockEmbed } from '../panels/canvas/BlockEmbed';
import { blockFromElement } from '../panels/canvas/blockElements';
import { getAllPanels, subscribePanels } from './PanelRegistry';
import { Icon } from '../components/Icons';
import { Spinner } from '../components/common';
import './sidebar.css';

export const SIDEBAR_NAME = 'math-notebook';
const SCENE_DEBOUNCE_MS = 250;

// Module-level, stable reference so React.memo'd <Excalidraw> doesn't
// see a new UIOptions object every render. (UIOptions is excluded from
// areEqual anyway, but keeping it stable is consistent with how the
// other props flow.)
const EXCALIDRAW_UI_OPTIONS = {
  canvasActions: {
    changeViewBackgroundColor: true,
    clearCanvas: true,
    export: { saveFileToDisk: true },
    loadScene: true,
    saveToActiveFile: true,
    toggleTheme: false,
    saveAsImage: true,
  },
  // Keep the dock preference docked so Excalidraw's library and our
  // panels sidebar can sit side-by-side without one squishing the
  // other on wide viewports.
  dockedSidebarBreakpoint: 800,
} as const;

/** Shallow content compare for block arrays. Same length, same id at
 *  each index, and each block's primitive fields all === . Returns
 *  true when the next mirror would be a no-op so we can skip the
 *  store update and break the onChange feedback loop. */
function blocksAreEqual(a: readonly Block[], b: readonly Block[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    if (x.id !== y.id || x.type !== y.type || x.x !== y.x || x.y !== y.y) return false;
    if (x.fontSize !== y.fontSize || x.note !== y.note || x.showNote !== y.showNote) return false;
    if (x.type === 'math' && y.type === 'math' && x.latex !== y.latex) return false;
    if (x.type === 'text' && y.type === 'text' && x.text !== y.text) return false;
  }
  return true;
}

export function AppShell() {
  const activeSheetId = useStore((s) => s.activeSheetId);
  const sheet = useActiveSheet();
  const setSheetSnapshot = useStore((s) => s.setSheetSnapshot);
  const setActiveSidebarTab = useStore((s) => s.setActiveSidebarTab);
  const activeSidebarTab = useStore((s) => s.activeSidebarTab);
  const setSheetBlocks = useStore((s) => s.setSheetBlocks);

  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);

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

  // The persisted snapshot lives inside the zustand store, which means
  // immer ran `produce()` on it on the way in and froze every object
  // it contained (`Object.freeze` is immer's default on dev + prod).
  // Excalidraw owns the scene mutably once initialised — its
  // `mutateElement` writes `element.x = …` during drag/resize. Frozen
  // elements throw `Cannot assign to read only property 'x'` the
  // moment the user grabs anything. Deep-clone the snapshot before
  // handing it over so Excalidraw sees a regular, mutable tree.
  // `structuredClone` is supported everywhere we ship and handles
  // nested arrays / Maps / null cleanly.
  const [initialData] = useState(() => {
    const snap = sheet?.excalidrawSnapshot;
    if (!snap || typeof snap !== 'object') return undefined;
    try {
      return structuredClone(snap) as Record<string, unknown>;
    } catch {
      // Fallback for the rare environment without structuredClone or
      // when the snapshot contains an unclonable shape (e.g. a function
      // someone snuck in via a custom field). JSON round-trip drops
      // non-serializable bits, which is fine for the snapshot.
      return JSON.parse(JSON.stringify(snap)) as Record<string, unknown>;
    }
  });

  // Pre-load our curated math-diagram templates as Excalidraw's
  // default library on first run. We fetch the lib JSON (a single
  // file under public/), parse it, and seed the Library panel. The
  // PWA precaches the file so this works offline after the first
  // warm load. Declared up-front so `excalidrawInitialData` below
  // can read it.
  const [libraryItems, setLibraryItems] = useState<unknown[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/math-templates.excalidrawlib');
        if (!res.ok) return;
        const data = await res.json() as { libraryItems?: unknown[] };
        if (!cancelled && Array.isArray(data.libraryItems)) {
          setLibraryItems(data.libraryItems);
        }
      } catch { /* offline / not deployed — ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const debounceTimer = useRef<number | null>(null);
  // CRITICAL: deep-clone the scene array + every element before handing
  // it to the store. The store is zustand+immer, and immer freezes
  // everything it commits. If we passed Excalidraw's *live* scene
  // array, immer would freeze the array AND every element object
  // inside it — and the very next pointer-move would crash with
  // "Cannot assign to read only property 'x'" because Excalidraw's
  // own `mutateElement` writes element.x/y in place. Snapshotting via
  // structuredClone severs that link: the store holds a frozen deep
  // copy, the scene keeps its mutable originals.
  const persistScene = useCallback(() => {
    if (!apiRef.current) return;
    const elements = apiRef.current.getSceneElements();
    const appState = apiRef.current.getAppState();
    const files = apiRef.current.getFiles();
    let snapshotElements: unknown;
    let snapshotFiles: unknown;
    try {
      snapshotElements = structuredClone(elements);
      snapshotFiles = structuredClone(files);
    } catch {
      // JSON round-trip is safe here: scene elements are pure-data
      // shapes Excalidraw can re-restore from JSON.
      snapshotElements = JSON.parse(JSON.stringify(elements));
      snapshotFiles = JSON.parse(JSON.stringify(files));
    }
    setSheetSnapshot(activeSheetId, {
      elements: snapshotElements,
      appState: serializeAppState(appState),
      files: snapshotFiles,
    });
  }, [activeSheetId, setSheetSnapshot]);

  // scene → store mirror for blocks. Single direction: whatever the
  // scene says is true; the store's `sheet.blocks` array exists so
  // panels (Solver, Variables, AI, …) can keep their selectors. No
  // write-back from store → scene during this hook — every mutation
  // goes through panels/canvas/blockElements.ts -> api.updateScene,
  // which feeds back here on the next onChange.
  //
  // Idempotent on purpose: Excalidraw fires onChange after *every*
  // componentDidUpdate, even when the scene didn't actually change.
  // If we blindly called setSheetBlocks each time, zustand would
  // dispatch a new sheet object, AppShell would re-render, its
  // children prop into <Excalidraw> would be a new JSX tree, the
  // React.memo equality check (which always fails on children !==)
  // would let Excalidraw re-render, componentDidUpdate fires
  // onChange again, → infinite loop. The shallow compare below kills
  // that cycle.
  const mirrorBlocks = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    const next: Block[] = [];
    for (const el of api.getSceneElements()) {
      if (isBlockElement(el)) {
        next.push(blockFromElement(el as ExcalidrawMathElement | ExcalidrawTextBlockElement));
      }
    }
    const prev = useStore.getState().sheets[activeSheetId]?.blocks;
    if (prev && blocksAreEqual(prev, next)) return;
    setSheetBlocks(activeSheetId, next);
  }, [activeSheetId, setSheetBlocks]);

  // Read the latest mirrorBlocks via a ref so the imperative
  // excalidrawAPI / renderTopRightUI callbacks below can have empty
  // deps without going stale. Each render writes the latest closure
  // into the ref; the callback uses ref.current.
  const mirrorBlocksRef = useRef(mirrorBlocks);
  mirrorBlocksRef.current = mirrorBlocks;

  const persistSceneRef = useRef(persistScene);
  persistSceneRef.current = persistScene;

  const onChange = useCallback(() => {
    mirrorBlocksRef.current();
    if (debounceTimer.current !== null) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => persistSceneRef.current(), SCENE_DEBOUNCE_MS);
  }, []);

  useEffect(() => () => {
    if (debounceTimer.current !== null) window.clearTimeout(debounceTimer.current);
    persistSceneRef.current();
  }, []);

  // Stable; capturing the latest setExcalidrawAPI + mirrorBlocks via
  // module-level state / refs. Inline `excalidrawAPI={(api) => ...}`
  // would change identity every AppShell render — React.memo's
  // shallow-compare would fail on that prop, forcing Excalidraw to
  // re-render, triggering componentDidUpdate, firing onChange, → loop.
  const handleExcalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api;
    setExcalidrawAPI(api);
    mirrorBlocksRef.current();
  }, []);

  const renderBlockContent = useCallback(
    (element: NonDeleted<ExcalidrawBlockElement>) => (
      <BlockEmbed element={element} />
    ),
    [],
  );

  // Stable renderTopRightUI — same reason as handleExcalidrawAPI.
  const renderTopRightUI = useCallback(() => (
    <CanvasTopRight apiRef={apiRef} />
  ), []);

  // Stable Sidebar onStateChange — same reason.
  const handleSidebarStateChange = useCallback((state: { tab?: string | null } | null) => {
    setActiveSidebarTab(state?.tab ?? null);
  }, [setActiveSidebarTab]);

  // Memo initialData so it doesn't allocate a new object every render.
  // The Excalidraw component's areEqual EXCLUDES initialData from its
  // shallow compare, so this is correctness-irrelevant for the memo
  // gate — but it also stops React from telling the constructor that
  // initialData changed identity, which could re-run setup-side work
  // somewhere downstream.
  const excalidrawInitialData = useMemo(() => ({
    ...(initialData ?? {}),
    appState: {
      ...((initialData?.['appState'] as object) ?? {}),
      theme: 'dark' as const,
      openSidebar: activeSidebarTab
        ? { name: SIDEBAR_NAME, tab: activeSidebarTab }
        : null,
    },
    ...(libraryItems
      ? { libraryItems: libraryItems as never }
      : {}),
  }), [initialData, activeSidebarTab, libraryItems]);

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
        excalidrawAPI={handleExcalidrawAPI}
        initialData={excalidrawInitialData}
        onChange={onChange}
        theme="dark"
        renderBlockContent={renderBlockContent}
        renderTopRightUI={renderTopRightUI}
        UIOptions={EXCALIDRAW_UI_OPTIONS}
      >
        <CanvasMainMenu />
        <CanvasFooter />
        <CanvasWelcome />
        <CanvasTTDDialog />
        <Sidebar
          name={SIDEBAR_NAME}
          docked
          onStateChange={handleSidebarStateChange}
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
