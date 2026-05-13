# Adding a panel

A "panel" is one of the tabs in Excalidraw's side `<Sidebar>` — Solver, Graph 2D, AI chat, Settings, etc. Adding one is three steps and never touches the workspace shell.

> **Architectural note (v3+):** the app shell IS Excalidraw. Panels are rendered as `<Sidebar.Tab>` children inside `<AppShell>`. There is no FlexLayout, no separate "workspace" surface — the canvas is the whole window, and the side panel slides in over the right edge when opened. See [`architecture.md`](./architecture.md#the-shell-is-excalidraw).

## The contract

`src/workspace/PanelRegistry.ts` exports:

```ts
export interface Panel {
  /** Stable ID — referenced by sidebar tabs, commands, and links. */
  id: string;                                  // 'solver', 'graph2d', 'ai', …

  /** Tooltip text shown over the icon-only sidebar tab trigger. */
  title: string;

  /** From the shared icon set in `Icons.tsx`. */
  icon: IconName;

  /** Always lazy. Wrapped via `lazyPanel(loader)` from `utils/lazy.ts`. */
  component: React.LazyExoticComponent<React.ComponentType>;

  /** Short summary surfaced in the command palette. */
  description?: string;
}

export function registerPanel(panel: Panel): void;
```

`<AppShell>` reads `getAllPanels()` and renders each as a `<Sidebar.Tab>` + a trigger icon. Order of registration in `src/panels/index.ts` controls the order of the tab triggers.

## Three-step recipe

### 1. Create the panel folder

```
src/panels/myFeature/
├── MyFeaturePanel.tsx        # the component
├── register.ts               # the one-liner registration (imported by app bootstrap)
└── (anything else this panel owns: hooks, helpers, types …)
```

`MyFeaturePanel.tsx` is the default export and uses the shared panel chrome:

```tsx
import { PanelHeader, PanelStatus, EmptyState } from '../../components/common';

export default function MyFeaturePanel() {
  return (
    <div className="flex flex-col h-full bg-surface text-fg">
      <PanelHeader title="My Feature" />
      <div className="flex-1 overflow-auto p-3">
        {/* panel content */}
      </div>
      <PanelStatus>0 items</PanelStatus>
    </div>
  );
}
```

### 2. Register it

```ts
// src/panels/myFeature/register.ts
import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'myFeature',
  title: 'My Feature',
  icon: 'sparkles',
  component: lazyPanel(() => import('./MyFeaturePanel')),
});
```

Then add one line to `src/panels/index.ts`:

```ts
import './myFeature/register';
```

That file is imported once at app bootstrap; every panel's `register.ts` runs as a side effect, the registry collects the records, and `<AppShell>` renders them.

### 3. Wire commands (optional but usually wanted)

To make the panel openable from the command palette and a keybind, the bootstrap `syncPanelOpenCommands()` already emits a dynamic `view.open.<id>` command for every registered panel that calls `ctx.workspace.openPanel(id)`. If you want a custom shortcut or a different label, register your own command in addition:

```ts
{
  id: 'myFeature.open',
  label: 'My Feature — show panel',
  category: 'View',
  defaultShortcut: '$mod+Shift+Y',
  run: (ctx) => ctx.workspace.openPanel('myFeature'),
}
```

`ctx.workspace.openPanel(id)` writes the active tab into the workspace slice **and** calls Excalidraw's `toggleSidebar({ name: 'math-notebook', tab: id, force: true })` so the sidebar flips to the new panel.

## Conventions to follow

- **Panel chrome is `PanelHeader` + (optional) `PanelRibbon` + content + (optional) `PanelStatus`.** No custom header.
- **Empty state**: render `<EmptyState>` instead of "Nothing here yet." text.
- **Errors**: render `<Banner kind="error">` inside the panel, never as a toast.
- **Loading**: render `<SkeletonRow>` / `<SkeletonCard>` or `<Spinner>` while async work is in flight.
- **State**: read from the Zustand store with a memoized selector. Don't accept state via props from `<AppShell>`.
- **Side effects**: register them in the panel's hooks, scoped via `useEffect`. They tear down when the sidebar collapses or the panel unmounts.
- **No `<button>` outside `components/common/`** — eslint blocks it. Compose Button / IconButton.

## Anti-patterns to avoid

- Editing `workspace/AppShell.tsx` to add the panel. The registry is the only path in.
- Importing the panel's component directly from anywhere outside `workspace/AppShell`. Lazy-load via the registry.
- Rolling your own button / dropdown / dialog. Compose from `components/common/`.
- Setting your own theme colors. Tokens are in `index.css`.
- Trying to "dock" the panel anywhere except inside Excalidraw's sidebar — there is no other layout system.

## Programmatic open from anywhere

If an AI tool call or a panel needs to open another panel:

```ts
import { workspaceController } from '../../workspace/useWorkspace';

workspaceController.openPanel('graph2d');
```

This works the same in commands, in inject helpers, and inside other panels' callbacks.
