// The flexlayout host. Mounts a <Layout> driven by workspaceSlice.layout
// (persisted) and a `factory` that resolves each tab's component string
// to a registered Panel from PanelRegistry.
//
// Layout state lives in two places that must stay in sync:
//   1) the flexlayout Model (the live tree, owned by the component)
//   2) workspaceSlice.layout (the persisted snapshot)
//
// We bridge them via `onModelChange` (writes snapshot → store) and a
// useEffect that builds the Model from store.layout on first mount or
// after a reset.

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Layout, Model, type IJsonModel, type TabNode, type ITabSetRenderValues,
} from 'flexlayout-react';
import 'flexlayout-react/style/light.css';

import { useStore } from '../state/store';
import { getPanel, subscribePanels } from './PanelRegistry';
import { defaultLayout } from './layout.defaults';
import { Spinner, EmptyState } from '../components/common';

interface Props {
  /** Test seam — pass a layout to skip the persisted one. */
  initialLayout?: IJsonModel;
}

export function Workspace({ initialLayout }: Props) {
  const persisted = useStore((s) => s.layout);
  const setLayout = useStore((s) => s.setLayout);

  // Build the Model on first mount; re-build only if persist is wiped
  // (which happens on Reset Layout).
  const [model, setModel] = useState<Model>(() =>
    buildModel((initialLayout ?? (persisted as IJsonModel | null) ?? defaultLayout) as IJsonModel),
  );

  // Force-rerender on registry change so newly registered panels get
  // their factory call.
  const [, force] = useState(0);
  useEffect(() => subscribePanels(() => force((x) => x + 1)), []);

  // Reset path: layout becomes null → re-build from defaults.
  const prevLayoutRef = useRef(persisted);
  useEffect(() => {
    if (persisted === null && prevLayoutRef.current !== null) {
      setModel(buildModel(defaultLayout));
    }
    prevLayoutRef.current = persisted;
  }, [persisted]);

  // ----- factory: lookup panel + render with Suspense ------------------
  const factory = useMemo(
    () => (node: TabNode) => {
      const id = node.getComponent();
      if (!id) return null;
      const panel = getPanel(id);
      if (!panel) {
        return (
          <EmptyState
            icon="info"
            title={`Panel "${id}" not registered`}
            description="The panel is referenced in the layout but no registration matches its ID."
          />
        );
      }
      const C = panel.component;
      return (
        // data-tour-target lets the Tour spotlight find this panel by id
        // without coupling to flexlayout's internal node IDs.
        <div data-tour-target={panel.id} className="h-full w-full">
          <PanelSuspense>
            <C />
          </PanelSuspense>
        </div>
      );
    },
    [],
  );

  // ----- tab strip render ---------------------------------------------
  const onRenderTabSet = (_node: unknown, _renderValues: ITabSetRenderValues) => {
    // Reserved for Phase 1+: P2 adds the canvas action menu here.
  };

  return (
    <div className="absolute inset-0">
      <Layout
        model={model}
        factory={factory}
        onModelChange={(m) => {
          const json = m.toJson();
          const open = collectOpenPanels(m);
          setLayout(json, open);
        }}
        onRenderTabSet={onRenderTabSet}
      />
    </div>
  );
}

// ----- helpers ---------------------------------------------------------

function buildModel(json: IJsonModel): Model {
  try {
    return Model.fromJson(json);
  } catch (err) {
    console.warn('[workspace] invalid layout JSON, falling back to defaults', err);
    return Model.fromJson(defaultLayout);
  }
}

function collectOpenPanels(model: Model): string[] {
  const ids: string[] = [];
  model.visitNodes((node) => {
    if (node.getType() === 'tab') {
      const c = (node as TabNode).getComponent();
      if (c) ids.push(c);
    }
  });
  return ids;
}

function PanelSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full flex items-center justify-center gap-2 text-fg-muted text-sm">
          <Spinner /> Loading panel…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
