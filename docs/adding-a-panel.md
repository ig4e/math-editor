# Adding a panel

A "panel" is any dockable, draggable surface in the workspace — Canvas, Solver, Graph, AI chat, Settings, etc. Adding one is three steps and never touches the workspace shell.

## The contract

`src/workspace/PanelRegistry.ts` exports:

```ts
export interface Panel {
  /** Stable ID — referenced from layout JSON and command IDs. */
  id: string;                                  // 'canvas', 'graph2d', 'ai', …

  /** Shown in the flexlayout tab. */
  title: string;

  /** From the shared icon set in `Icons.tsx`. */
  icon: IconName;

  /** Always lazy. Wrapped via `lazyPanel(loader)` from `utils/lazy.ts`. */
  component: React.LazyExoticComponent<React.ComponentType>;

  /** Where to dock when first opened. Defaults to 'right'. */
  defaultLocation?: 'left' | 'right' | 'bottom' | 'center';

  /** Optional buttons rendered in the panel header's right slot. */
  headerActions?: () => ReactNode;
}

export function registerPanel(panel: Panel): void;
```

The workspace `<Layout>` looks up panel records by `id` when flexlayout instantiates a tab. Everything else flows from there.

## Three-step recipe

### 1. Create the panel folder

```
src/panels/myFeature/
├── MyFeaturePanel.tsx        # the component
├── register.ts               # the one-liner registration (imported by app bootstrap)
└── (anything else this panel owns: hooks, helpers, types …)
```

`MyFeaturePanel.tsx` is the default export and must use the shared panel chrome:

```tsx
import { PanelHeader } from '../../components/common/PanelHeader';
import { PanelStatus } from '../../components/common/PanelStatus';
import { EmptyState } from '../../components/common/EmptyState';

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
  defaultLocation: 'right',
});
```

Then add one line to `src/panels/index.ts`:

```ts
import './myFeature/register';
```

That file is imported once at app bootstrap; every panel's `register.ts` runs as a side effect.

### 3. Wire commands (optional but usually wanted)

To make the panel openable from the command palette and from a keybind, add a command in `src/commands/commands.ts`:

```ts
{
  id: 'view.openMyFeature',
  label: 'Open My Feature',
  category: 'View',
  defaultShortcut: '$mod+Shift+Y',
  run: (ctx) => ctx.workspace.openPanel('myFeature'),
}
```

`ctx.workspace.openPanel(id)` looks up the panel by ID, ensures it's mounted, and focuses its tab.

## Conventions to follow

- **Panel chrome is `PanelHeader` + (optional) `PanelRibbon` + content + (optional) `PanelStatus`.** No custom header.
- **Empty state**: render `<EmptyState>` instead of "Nothing here yet." text.
- **Errors**: render `<Banner kind="error">` inside the panel, never as a toast.
- **Loading**: render `<SkeletonRow>` / `<SkeletonCard>` while async work is in flight.
- **State**: read from the Zustand store with a memoized selector. Don't accept state via props from the workspace.
- **Side effects**: register them in the panel's hooks, scoped via `useEffect`. They tear down when the panel unmounts.

## Anti-patterns to avoid

- Editing `workspace/Workspace.tsx` to add the panel. The registry is the only path in.
- Importing the panel's component directly from anywhere outside `workspace/`. Lazy-load via the registry.
- Rolling your own button / dropdown / dialog. Compose from `components/common/`.
- Setting your own theme colors. Tokens are in `index.css`.

## Example: minimal "Hello world" panel

See `src/panels/hello/` (built in Phase 1 as a smoke test). It's 25 lines, registers itself, and appears in the command palette as **View → Open Hello**.
