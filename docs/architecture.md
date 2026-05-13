# Architecture

A high-level tour of the codebase. Read [`roadmap.md`](./roadmap.md) first for the "why"; this doc is the "what" and "where".

## One-screen mental model

```
                     ┌─────────────────────────────────────────────┐
                     │                  <App>                      │
                     │  ┌────────────────────────────────────────┐ │
                     │  │            <Workspace>                 │ │   flexlayout-react
                     │  │   ┌──────────┐  ┌─────────────────┐    │ │   Layout JSON in
                     │  │   │  Canvas  │  │  Solver         │    │ │   workspaceSlice
                     │  │   │ (Excal-  │  ├─────────────────┤    │ │
                     │  │   │  idraw)  │  │  Variables      │    │ │
                     │  │   │          │  ├─────────────────┤    │ │
                     │  │   │          │  │  Graph 2D       │    │ │
                     │  │   └──────────┘  └─────────────────┘    │ │
                     │  └────────────────────────────────────────┘ │
                     │  <CommandPalette> · <ConfirmDialog> · …      │
                     └─────────────────────────────────────────────┘
                                       │
       ┌───────────────────────────────┼───────────────────────────────┐
       │                               │                               │
   ┌───────┐                  ┌──────────────┐                ┌──────────────┐
   │ State │  Zustand store   │  Registries  │                │  Backends    │
   │ slices│  + immer +       │  Panel       │                │  Solvers     │
   │       │  IDB persist     │  Command     │                │  Graphers    │
   │       │                  │  Keybind     │                │  AI providers│
   └───────┘                  └──────────────┘                └──────────────┘
```

Every long-lived concern is either **state** (Zustand slice), a **registry record** (panel / command / keybind), or a **backend** (solver / grapher / AI provider). Adding a feature means adding to one of those — never wiring a new prop tree.

## State

One Zustand store, slice-composed via the `AppSlice<T>` mutator pattern:

| Slice | Owns |
|---|---|
| `sheetsSlice` | multi-sheet workspace + active sheet pointer |
| `blocksSlice` | math + text blocks per sheet |
| `scenesSlice` | per-sheet Excalidraw scene (elements + appState + files) |
| `selectionSlice` | block + scene selection bridge |
| `workspaceSlice` | flexlayout JSON + active preset |
| `keysSlice` | BYOK API keys (encrypted at rest) |
| `prefsSlice` | theme, curriculum, showSteps, default provider/model |
| `toastsSlice` | transient toast queue |

Persist storage is **IndexedDB** via a thin `idb-keyval` adapter — sheets can be MBs without blowing localStorage's 5 MB cap. Persist key is fresh (`math-notebook:v1`).

User-data slices (`sheets`, `blocks`, `scenes`) are wrapped in `zundo`'s `temporal` middleware so Ctrl+Z / Ctrl+Y are clean. UI / theme / selection / toasts deliberately stay outside the undo history.

## Registries — the three contracts every phase adds to

### Panel registry

`workspace/PanelRegistry.ts` exports a `Panel` interface; every panel registers itself by appending one record:

```ts
interface Panel {
  id: string;                               // 'canvas', 'graph2d', …
  title: string;                            // shown in tabs
  icon: IconName;
  component: React.LazyExoticComponent<…>;  // always lazy
  defaultLocation?: 'left'|'right'|'bottom'|'center';
  headerActions?: () => ReactNode;
}
```

`<Workspace>` is a flexlayout `<Layout>` whose factory looks up panel records by `id`. See [`adding-a-panel.md`](./adding-a-panel.md).

### Command registry

`commands/commands.ts` is a single array of `Command` records:

```ts
interface Command {
  id: string;                                       // 'math.solve', 'view.openGraph', …
  label: string;
  category: 'Math'|'View'|'File'|'AI'|'Help'|'Edit';
  run(ctx: CommandContext): void | Promise<void>;
  when?: (ctx: CommandContext) => boolean;
  defaultShortcut?: string;
}
```

`CommandPalette.tsx` (cmdk) reads from this array. Recently used floats to top.

### Keybind registry

`keybinds/defaults.ts` is the platform-aware default map (Cmd on Mac, Ctrl elsewhere). `keysSlice` stores user overrides. `keybinds/useKeybinds.ts` binds the resolved map via `tinykeys` and dispatches to the matching command. See [`keybindings.md`](./keybindings.md).

## Pluggable backends

### Solvers

`solvers/index.ts`:

```ts
interface Solver {
  id: 'compute-engine' | 'mathsteps' | 'pyodide-sympy' | 'wolfram' | 'ai';
  capabilities: ('simplify'|'solve'|'steps'|'system'|'integrate'|'differentiate')[];
  invoke(input: SolverInput): Promise<SolverResult>;
}
```

The runner picks the right backend by capability + user preference (local → online fallback only if opted in). See [`adding-a-solver-backend.md`](./adding-a-solver-backend.md).

### Graphers

`graphers/index.ts` — same shape for 2D and 3D backends. Each exposes `plot(spec)` returning a React element. Both lazy-loaded.

### AI providers

`ai/providers.ts`:

```ts
interface AIProvider {
  id: 'anthropic'|'openai'|'google'|'xai'|'mistral'|'groq'|'openai-compat';
  models: string[];
  build(key: string, baseURL?: string): LanguageModel;
}
```

A generic `openai-compat` adapter covers DeepSeek / Qwen / Moonshot / Zhipu / etc. See [`adding-an-ai-provider.md`](./adding-an-ai-provider.md) and [`ai-byok.md`](./ai-byok.md).

## File layout

```
src/
├── main.tsx · App.tsx · index.css · mathlive.d.ts
│
├── workspace/                       # flexlayout host + presets + registry
├── panels/                          # one folder per panel type
│   ├── canvas/                      #   Excalidraw + math overlay
│   ├── graph/                       #   JSXGraph plotter
│   ├── graph3d/                     #   three.js + R3F surfaces
│   ├── solver/                      #   step-by-step
│   ├── variables/                   #   detected defs + sliders
│   ├── ai/                          #   chat + tools
│   ├── notes/                       #   markdown
│   ├── reference/                   #   formula sheet
│   ├── inspector/                   #   MathJSON AST
│   ├── matrix/                      #   linear-algebra GUI
│   ├── numerics/                    #   Newton / RK4 / FFT
│   ├── mllab/                       #   ML learning lab
│   └── settings/                    #   API keys, keybinds, curriculum
│
├── commands/                        # palette + registry + bootstrap + templates + practice
├── keybinds/                        # editor + defaults + runtime
├── solvers/                         # backend registry + adapters
│   └── pyodide/                     #   loader + sympy + matrix (symbolic ops bridge)
├── graphers/                        # 2D + 3D backends
├── ml/                              # regression, optimizers, PCA, distributions
├── ai/                              # providers, chat, proxyStream, tools, OCR, BYOK
├── share/                           # url, pdf (MathLive → html-to-image), latex, markdown
├── collab/                          # Yjs session + custom Excalidraw scene binding
├── onboarding/                      # welcome seeds + tour + spotlight
├── state/                           # store, slices, selectors, types
├── components/
│   ├── common/                      # the design system primitives
│   └── ...
├── hooks/
├── vendor/                          # selectively forked excalidraw-app + jsxgraph CSS
└── utils/                           # lazy, cx, geom, text

api/                                 # edge functions (CF + Vercel; one file, two exports)
  ├── hello.ts · wolfram.ts · ai-proxy.ts
public/
  ├── math-templates.excalidrawlib   # regenerated by scripts/emit-library.mjs
  └── manifest, icons, robots
scripts/
  ├── check-bundle.mjs · check-contrast.mjs · emit-library.mjs
  └── build-cf-functions.mjs
docs/                                # this folder
```

## Optional dependencies

`@tensorflow/tfjs` lives in `optionalDependencies` — it's only loaded when the user opens the ML Lab → Train mode. Self-hosters who don't need autograd training can `npm install --omit=optional` to skip its install entirely. Lazy import is the only consumer (`src/panels/mllab/ml/tfjsTrain.ts`).

## Cross-cutting rules

- **No file > ~200 lines.** CI flags files > 250.
- **No `any`.** Strict TS with `noUncheckedIndexedAccess`.
- **One panel = one folder.**
- **One AI provider = one file.**
- **No bespoke utilities for things Radix / Tailwind already do.**
- **Main entry stays under 800 KB gzipped** before lazy chunks.

See [`contributing.md`](./contributing.md) for the full guard rails.
