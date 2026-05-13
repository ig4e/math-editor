# Roadmap — Math Notebook v2 transformation

This is the master plan. It records every decision, the architecture we're targeting, and the 18 phases we'll ship against. Other docs in this directory drill into specific subjects; this one is the spine.

## Context

We're transforming a working-but-modest math whiteboard (React + TS + Vite + Tailwind + MathLive + compute-engine) into a **best-in-class math notebook** that competes with OneNote Math, Apple Notes Math Notes, Notability + Mathpix, and Mathnium — while staying **open-source, free for users, offline-first, and BYOK for AI**.

The strategy is to lean hard on OSS engines instead of building our own:

- **Excalidraw** replaces our hand-rolled drawing layer (selection, undo, marquee, all shape tools — free).
- **JSXGraph** powers a Desmos-like graph view (only MIT/LGPL library with implicit + parametric + f(x)).
- **mathsteps** complements compute-engine for human-readable derivation steps.
- **Pyodide + SymPy** is lazy-loaded for advanced symbolics (linear algebra steps, integrals, etc.).
- **Vercel AI SDK** provides a unified BYOK layer for OpenAI, Anthropic, Google, xAI, Mistral, Groq, DeepSeek, Qwen, Moonshot, Zhipu — anything OpenAI-compatible falls in automatically.
- **flexlayout-react** turns the app into a VS Code / JupyterLab-style dockable workspace where every feature is a tab.
- **cmdk + tinykeys** give us a Linear-style command palette and rebindable keys.

The app must:

- Run free for end users. Paid services are **opt-in BYOK only**.
- Work offline (PWA + service worker). AI and Wolfram gracefully degrade with no connection.
- Deploy to **both Cloudflare Pages and Vercel** from the same repo, with edge functions for the few things that need a backend (Wolfram CORS proxy, optional server-side AI key holding).
- Keep code slim — every file under ~200 lines, heavy modules lazy-loaded, single source of truth, no rolled-our-own where an OSS library exists.

## Final library picks

| Concern | Pick | License | Notes |
|---|---|---|---|
| Workspace shell | `flexlayout-react` ^0.7 | MIT | dockable panels, drag, popout, presets |
| Command palette | `cmdk` ^1.0 | MIT | Vercel / Linear-style; tiny |
| Keybindings | `tinykeys` ^3.0 | MIT | 1 KB; we own the registry |
| Canvas engine | `@excalidraw/excalidraw` ^0.18 | MIT | React 19 supported |
| Math editor | `mathlive` ^0.105 | MIT | existing |
| CAS core | `@cortex-js/compute-engine` ^0.35 | MIT | existing |
| Step-by-step solver | `mathsteps` ^0.2 | MIT | Google fork of Socratic |
| 2D grapher | `jsxgraph` ^1.7 | MIT/LGPL | implicit + parametric + intersections |
| 3D grapher | `three` + `@react-three/fiber` + `@react-three/drei` | MIT | surfaces, vector fields, trajectories, orbit controls |
| Lightweight numeric ops | `mathjs` + `ml-matrix` + `ml-pca` + `simple-statistics` | Apache-2.0 / MIT | small ML primitives without TFJS |
| Optional in-browser ML | `@tensorflow/tfjs` (lazy) | Apache-2.0 | only loaded if user opens ML training tools |
| Python kernel (lazy) | `pyodide` ^0.27 | MPL-2.0 | SymPy, NumPy, SciPy, scikit-learn in browser |
| AI SDK | `ai` (Vercel AI SDK) + `@ai-sdk/{openai,anthropic,google,xai,mistral,groq}` | Apache-2.0 | OpenAI-compat adapter covers DeepSeek / Qwen / Moonshot / Zhipu |
| Realtime collab | `yjs` + `y-webrtc` | MIT | peer-to-peer; no server |
| PWA | `vite-plugin-pwa` (workbox) | MIT | precache + IDB for big assets |
| Dialogs / tooltips / menus | Radix UI | MIT | existing |
| State | Zustand + immer + persist | MIT | existing; persist storage moves to IDB |
| Styling | Tailwind v4 | MIT | existing |

**Removed**: `perfect-freehand` (Excalidraw replaces), our `recognizer.ts`, `shapeGeom.ts`, the strokes / shapes / links slices, and the pen / eraser / link hooks.

## Phases

Phases are sequenced so the app is always demoable. Each phase ends with `npm run typecheck && npm run build` green and a smoke check against [`verification.md`](./verification.md). No time estimates — phases ship when they pass verification.

### Phase 0 — Infra & deploy

- Cloudflare Pages config (`wrangler.toml`, `_routes.json`).
- Vercel config (`vercel.json`).
- GitHub Actions: one workflow, matrix jobs for Cloudflare + Vercel.
- `api/` skeleton with shared core + thin adapters (one file exports both a Cloudflare `onRequest` and a Vercel `default` handler).
- `vite-plugin-pwa` installed; manifest + service worker registered.
- Bundle-size check script fails the build if the main chunk exceeds budget (default 800 KB gzip pre-lazy).

### Phase 1 — Foundation (the spine every later phase plugs into)

**Phase 1 is foundation-only.** It does not deliver any user-visible feature beyond the workspace shell — but every subsequent phase becomes a small, focused add because of what we put here.

The foundation comprises **eight concerns**; nothing in Phase 1 ships until all eight are solid:

1. **State store** — Zustand + immer + persist, slice-composed, with the `AppSlice<T>` typed mutator pattern locked in. Persist storage uses **IndexedDB** from day one (via `idb-keyval`) so we never hit the 5 MB localStorage ceiling. Fresh persist key — greenfield project, no migrations.
2. **Panel registry contract** — `workspace/PanelRegistry.ts` defines a `Panel` interface; every later phase adds a panel by registering one record. No bespoke wiring per panel. See [`adding-a-panel.md`](./adding-a-panel.md).
3. **Command registry** — `commands/commands.ts` is a single array of `Command` records. `CommandPalette.tsx` (cmdk-based) reads from the registry. Recently used floats to top.
4. **Keybind runtime** — `keybinds/useKeybinds.ts` binds every registered command via `tinykeys`. Bindings come from `keybinds/defaults.ts` overlaid with the user's `keysSlice` overrides. Platform-aware (Cmd vs Ctrl). Conflict detection. See [`keybindings.md`](./keybindings.md).
5. **Common UI primitives** — `components/common/` ships **all** the styled wrappers before any feature uses them. Once Phase 1 lands, no other file may roll its own button / input / dialog. See [`ui-design-system.md`](./ui-design-system.md).
6. **Lazy-load helper** — `utils/lazy.ts` exposes a single `lazyPanel(loader)` that wraps `React.lazy` + a consistent `<SkeletonCard>` fallback. Every heavy import goes through this — no ad-hoc dynamic imports.
7. **Toast + dialog plumbing** — `Toaster.tsx` wired at the root; `ConfirmDialog.tsx` exposes an imperative `askConfirm()` so no phase ever uses `alert/confirm/prompt`.
8. **Workspace shell** — `workspace/Workspace.tsx` mounts a `<flexlayout-react Layout>` driven by `workspaceSlice.layout` (persisted JSON). Default layout: Canvas in center; all other panels start as registered-but-unmounted stubs that render `<EmptyState>`s describing what's coming.

**Settings panel skeleton** is mounted with sections wired in: Appearance (theme works), Keybinds (full editor works), Layout (works); API Keys / Curriculum / Storage are UI shells filled by later phases.

**Foundation tests** assert the contracts: registering a fake panel makes it appear; registering a fake command makes it appear in the palette and respond to its keybind; theme persists across reload; resizing a panel persists across reload.

**Bundle budget for Phase 1**: main entry under **300 KB gzipped**. The 800 KB total budget accommodates Excalidraw landing lazily in Phase 2.

### Phase 2 — Excalidraw integration (selective fork + extend)

**Excalidraw is the visual foundation.** We don't just embed the library — we also **selectively fork** UI components, helpers, and patterns from the `excalidraw-app` source (the excalidraw.com webapp) so we don't rebuild solved-UX-problems from scratch. The forked code is vendored under `src/vendor/excalidraw-app/` with attribution to the upstream MIT license. Our flexlayout workspace still owns the panel docking; the forked Excalidraw bits supply the canvas chrome, sidebars, library browser, share dialog, and welcome screen patterns. See [`excalidraw-integration.md`](./excalidraw-integration.md) for the full surface and the vendor inventory.

- Delete the hand-rolled drawing layer: `MarksLayer.tsx`, `recognizer.ts`, `shapeGeom.ts`, `slices/{strokes,shapes,links}.ts`, the pen / eraser / link tools and hooks.
- **Vendor selectively from excalidraw-app**: `App.tsx` skeleton (sans collab/jotai/firebase), `share/ShareDialog`, `share-link.ts` compression helpers, `data/encryption.ts`, `AppFooter`, `AppMainMenu`, `AppWelcomeScreen`, `CommandPalette` cues, mobile responsive patterns. Each vendored file keeps its upstream header and license note; we adapt it to our Zustand store and design tokens.
- `panels/canvas/CanvasPanel.tsx` hosts `<Excalidraw>` with its native shape palette, zoom + undo / redo, and library panel all visible — wrapped in the vendored AppFooter / AppMainMenu / AppWelcomeScreen so the chrome feels like Excalidraw, not a half-finished imitation.
- Extend via `<MainMenu>`, `renderTopRightUI`, `<Footer>`, `<WelcomeScreen>`, `renderCustomStats`, and a custom selection-floating toolbar.
- `excalidrawAPI` captured in `scenesSlice`. `onChange` debounces (250 ms) into `scenesSlice.updateScene`.
- `MathOverlay.tsx` renders math blocks positioned via `sceneCoordsToViewportCoords`.
- `anchors.ts` — every math block has an invisible Excalidraw placeholder rectangle with `customData = { kind: 'mathBlockAnchor', blockId }`. Lasso a mix of blocks + shapes and they move together natively.
- `inject.ts` — programmatic API for other panels: `injectArrow`, `injectText`, `injectImage`, `injectShapes`, `injectBoundArrow`.
- `templates/` — math-diagram templates (number line, unit circle, Venn, function machine, MLP layer schematic, etc.) shipped as an Excalidraw Library.
- Theme synced via Excalidraw's `theme` prop. Persistence via `serializeAsJSON` + `restoreElements/restoreAppState/restoreFiles`.
- No backwards-compatibility code — greenfield, fresh persist key.

### Phase 3 — Solver + Variables panels

- `solvers/index.ts` runner with a backend registry. `computeEngine.ts` and `mathsteps.ts` register on import. `mathsteps` lazy-loaded only when `showSteps` is on. See [`adding-a-solver-backend.md`](./adding-a-solver-backend.md).
- `panels/solver/SolverPanel.tsx` shows selected block(s), with Simplify / Solve / Solve system buttons and a step list (MathLive read-only fields).
- `panels/variables/VariablesPanel.tsx` lists detected `name = number` definitions with drag-to-edit numeric sliders that update the source block instantly.
- System solve creates Excalidraw arrows from sources to result.

### Phase 4 — Graph 2D panel

- `graphers/jsxgraph2d.ts` lazy-loads JSXGraph; exposes `plot(spec)` returning a React element.
- `panels/graph/GraphPanel.tsx` watches the canvas selection + the variables panel.
- Ribbon: zoom-to-fit, axes lock, grid toggle, "Pin to canvas".
- Slider variables bound to the JSXGraph board.

### Phase 5 — Graph 3D panel

- `three`, `@react-three/fiber`, `@react-three/drei` (all lazy-loaded).
- `graphers/three3d.ts` mirrors the 2D `plot(spec)` API: `surface | parametric-surface | vector-field | curve | points | mesh`.
- `panels/graph3d/Graph3DPanel.tsx` hosts the canvas with OrbitControls, labeled axes, grid floor.
- Live sliders from the Variables panel control parameters.
- "Pin to canvas" rasterizes the WebGL frame.

### Phase 6 — AI panel + BYOK

- `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/xai`, `@ai-sdk/mistral`, `@ai-sdk/groq`.
- `ai/providers.ts` registers each first-party provider + one generic `openai-compat` adapter (covers DeepSeek / Qwen / Moonshot / Zhipu). See [`adding-an-ai-provider.md`](./adding-an-ai-provider.md).
- `panels/settings/APIKeys.tsx`: paste, mask, "verify" ping, per-provider model dropdown.
- Keys encrypted at rest with WebCrypto AES-GCM; salt in IDB. See [`ai-byok.md`](./ai-byok.md).
- `panels/ai/AIPanel.tsx`: streaming chat (`streamText`), sheet context auto-attached, tool-use (`solve`, `graph`, `simplify`, `ocr_image`, `insert_block`).
- "Insert as block" and "Pin to canvas" on every AI message.

### Phase 7 — Notes, Reference, Inspector

- `panels/notes/NotesPanel.tsx`: markdown editor.
- `panels/reference/ReferencePanel.tsx`: formulas, constants, identities (static JSON, filterable).
- `panels/inspector/InspectorPanel.tsx`: collapsible MathJSON AST tree.

### Phase 8 — Sharing + exports

- `share/url.ts`: gzip + base64 sheet JSON; URL hash. "Copy share link" command.
- `share/pdf.ts`: via `pdf-lib` or `jsPDF` + MathLive's `convertLatexToMarkup`. Lazy.
- `share/latex.ts` + `share/markdown.ts`: render a sheet as `.tex` or `.md`.

### Phase 9 — Pyodide + SymPy

- `solvers/pyodide/loader.ts`: dynamic import on first use, "loading Python… (10 MB, cached after)" toast.
- `solvers/pyodide/sympy.ts`: bridges `step_solve(latex)` to SymPy's `manualintegrate / solveset / simplify`.
- Optional: Python code blocks in the Notes panel.

### Phase 10 — Wolfram integration

- `api/wolfram.ts` edge function. Reads `WOLFRAM_APPID`, forwards to Wolfram Alpha APIs, adds CORS. Same handler shape on CF + Vercel.
- AI tool `ask_wolfram`.
- "Open in Wolfram" command (free path, no key) → `wolframalpha.com/input?i=…`.

### Phase 11 — Realtime collaboration

- `yjs` + `y-webrtc`. Each sheet is a Yjs doc.
- Excalidraw scenes synced via `y-excalidraw` or custom binding.
- Math blocks synced via Yjs maps.
- Cursors in `panels/canvas/Cursors.tsx`. Room ID is the share URL; no signaling server beyond the public y-webrtc one.

### Phase 12 — Handwriting OCR

- `ai/ocr.ts`: takes a PNG of a selection + a vision model → LaTeX.
- Command "Convert selection to math" (Cmd+Shift+M).

### Phase 13 — Matrix panel (symbolic linear algebra)

- `panels/matrix/MatrixPanel.tsx`: spreadsheet-like editor.
- Toolbar: RREF, det, inverse, rank, eigenvalues, characteristic polynomial, LU, QR.
- Each action shows the resulting matrix AND a steps card (compute-engine for closed-form; falls back to SymPy for steps).
- "Drop into sheet" inserts the LaTeX as a math block.

### Phase 14 — Numerics panel

- `panels/numerics/NumericsPanel.tsx`: Newton, Bisection, Secant, Euler, RK4, Trapezoid, Simpson, FFT, Gradient Descent.
- Parameter form + iteration table + mini-chart.
- "Send to graph" overlays the trajectory.

### Phase 15 — ML learning lab

- `panels/mllab/MLLabPanel.tsx`: Regression / Gradient descent / Optimizers / PCA / Distributions / Activations / Neural net forward pass.
- `ml/regression.ts` — `ml-matrix` linear & polynomial fits; `simple-statistics` basic stats.
- `ml/optimizers.ts` — SGD / Momentum / RMSprop / Adam.
- `ml/descent.ts` — gradient-descent paths drawn as trajectories on top of 2D / 3D loss surfaces.
- `ml/pca.ts` — `ml-pca`; projected coords + principal axes.
- `ml/distributions.ts` — normal / binomial / poisson / beta / gamma / chi-squared, with live sliders.
- Activation comparison: sigmoid / tanh / ReLU / Leaky ReLU / GELU / Swish.
- Neural-net forward pass: tiny MLP with weights from the Matrix panel; layer diagram drawn as Excalidraw shapes.
- Optional `@tensorflow/tfjs` lazy-loaded for in-browser training.
- Every output can be "pinned to canvas".

### Phase 16 — Curriculum-aware mode

- `panels/settings/Curriculum.tsx`: AP Calc AB/BC, IB SL/HL, A-Level Further Maths, US Common Core HS, GRE Math, custom.
- Drives the AI system prompt, the Reference panel filter, and the practice-generator level.

### Phase 17 — Polish

- First-run welcome sheet that demos each panel.
- Onboarding tour highlighting Cmd+K, panels, BYOK.
- Tablet / stylus optimizations (palm rejection, bigger tap targets).
- Performance pass — no panel re-renders on unrelated state (`useShallow` + memoized selectors).

### Phase-docs — Living documentation

Every phase that ships a new contract (panel registry, command registry, solver interface, AI provider interface, deploy target) also updates the matching doc in this directory in the same PR.

## Out of scope

- **Native mobile apps** (Capacitor / Tauri). PWA is the mobile target.
- **Server-side accounts / cloud sync** beyond Yjs peer-to-peer.
- **Plugin marketplace** — register-from-URL plugin loading.
- **Pen-input handwriting recognition without AI** (vision LLM covers the common case).
- **Symbolic computation we'd write from scratch** — compute-engine + mathsteps + SymPy already exist.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Excalidraw bundle ~1.5 MB | Lazy-load on canvas panel open; counts toward "lazy budget" |
| Pyodide first-load is 10 MB | Toast + IDB cache; never blocks initial paint |
| BYOK keys live in the browser | WebCrypto AES-GCM; loud privacy note |
| Wolfram CORS | Edge function proxy on both CF + Vercel |
| flexlayout JSON drift | Schema versioned; layout reset if version mismatches |
| AI vendor lock-in | Vercel AI SDK abstracts; OpenAI-compat adapter as a universal escape hatch |
| Sheet bloat (lots of strokes) | IDB storage + per-sheet sharding |
