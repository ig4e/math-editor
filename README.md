# Math Notebook

A best-in-class **math notebook** that runs in the browser. Free for end
users, offline-first, bring-your-own-key for AI. Built on Excalidraw,
MathLive, the Cortex Compute Engine, JSXGraph, three.js, Pyodide, and
the Vercel AI SDK.

A dockable workspace where every feature is a tab: canvas, solver,
variables, 2D + 3D graphing, AI chat, notes, reference, inspector,
matrix, numerics, ML lab, settings.

> v1 was a vanilla-JS single-page whiteboard on `main`. **v2 is the
> branch you want**: 50 commits ahead of `main`, every roadmap phase
> shipped, every previously-deferred item closed. See
> [`docs/transformation-complete.md`](./docs/transformation-complete.md)
> for the full audit trail.

## Highlights

- **Canvas** — Excalidraw as the universal visual layer. Math blocks
  live as anchors so lasso / marquee / move / align all work natively
  on a mix of math and shapes. Selection-floating toolbar surfaces
  Solve / Solve system / Graph / Ask AI directly above the selection.
- **Solver + Variables** — compute-engine + mathsteps with step-by-step
  rewrites; the Variables panel detects every `name = number` in your
  sheet and exposes a live slider. System solve draws bound arrows from
  sources to result.
- **Graph 2D (JSXGraph)** — `f(x)`, parametric, implicit, intersections,
  roots, extrema. Sliders from Variables bind to the board.
- **Graph 3D (three.js + @react-three/fiber + drei)** — surfaces,
  parametric surfaces, parametric curves, vector fields, point clouds.
  Pin a snapshot to the canvas.
- **AI + BYOK** — Anthropic, OpenAI, Google, xAI, Mistral, Groq + a
  generic OpenAI-compatible adapter for DeepSeek / Qwen / Moonshot /
  Zhipu / Ollama / LM Studio / vLLM / OpenRouter / Together / Fireworks.
  Keys live in IndexedDB encrypted with WebCrypto AES-GCM. Optional
  server-side proxy mode for keys-never-leave-server deployments and
  for Mistral (no browser CORS).
- **Notes** — markdown with `python` fenced code blocks that run
  against Pyodide inline, output captured below.
- **Reference + Inspector** — searchable formula sheet; MathJSON AST
  viewer for any selected block.
- **Sharing + exports** — share-link (gzipped sheet baked into the URL
  hash, no server), Markdown, LaTeX, PDF with rendered math glyphs.
- **Pyodide + SymPy** — lazy 10 MB Python kernel cached in IDB after
  first use. Drives `∫ x sin(x) dx`-style symbolic step solving and the
  Matrix panel's Symbolic mode (eigvals / LU / QR / char-poly with
  exact surds + step trace).
- **Wolfram** — edge-function CORS proxy + AI tool + a free
  "open in Wolfram Alpha" command that needs no key.
- **Realtime collab** — Yjs over y-webrtc. Sync covers math/text blocks
  AND the full Excalidraw scene (custom binding). Peer cursors live in
  the canvas footer.
- **Handwriting OCR** — lasso a sketch, "Convert to math", a vision LLM
  transcribes to LaTeX.
- **Matrix panel** — det / inverse / transpose / rank / RREF (with
  steps) / eigenvalues / LU / QR. Symbolic toggle routes through
  Pyodide-SymPy for exact results.
- **Numerics panel** — Newton's, Bisection, Secant, Euler, RK4,
  Trapezoid, Simpson, FFT, Gradient descent. Iteration tables +
  convergence chart.
- **ML Lab** — Regression / Gradient descent / Distributions /
  Activations / PCA / Neural net forward pass / Train (TFJS, lazy,
  optional dependency). Pin descent trajectories as a chain of arrows
  over the loss surface.
- **Curriculum-aware** — AP Calc AB/BC, IB SL/HL, A-Level Further
  Maths, US Common Core HS, GRE Math, custom. Drives the Reference
  filter, the AI system prompt, and the practice generator command.
- **Command palette + keybinds** — `Cmd+K` finds every action;
  Settings → Keybinds rebinds anything, with platform-aware defaults
  and conflict detection.

## Quick start

```sh
npm install
npm run dev
```

Opens at <http://localhost:5173>. No keys or env vars required — math
editing, solving, graphing, sharing, PDF / Markdown / LaTeX export, and
realtime collab all work out of the box. AI features stay disabled
until you paste a key in **Settings → API keys**.

## Other scripts

```sh
npm run typecheck     # tsc -b --noEmit
npm run lint          # eslint flat config
npm run check:contrast # WCAG AA gate over the @theme tokens
npm test              # vitest + jsdom (34 tests)
npm run build         # full prod build + bundle gate
npm run build:cf      # build + emit functions/api for Cloudflare
npm run preview       # serve dist/ at :4173
```

The CI pipeline gates `typecheck → lint → check:contrast → test → build`
before any deploy job runs.

## Architecture, in one sentence

Every long-lived concern is either **state** (one Zustand store with
seven slices, persisted to IndexedDB), a **registry record** (Panel /
Command / Keybind), or a **backend** (Solver / Grapher / AI provider).
Adding a feature means adding to one of those — never wiring a new prop
tree.

The app shell IS Excalidraw. `<AppShell>` mounts a full-window
`<Excalidraw>` and threads every panel through its native `<Sidebar>`;
math + text blocks live as scene-native `embeddable` elements; the
math toolbar lives inside Excalidraw's `<Footer>`; the hamburger menu
extends `<MainMenu>`. There is no separate layout library.

```
src/
├── workspace/      AppShell (Excalidraw root) + PanelRegistry
├── panels/         11 sidebar tabs — solver, variables, graph,
│                   graph3d, ai, notes, reference, inspector,
│                   matrix, numerics, mllab, settings — plus
│                   panels/canvas/ which holds canvas helpers
│                   (TopRight, Footer, MainMenu, BlockEmbed, etc.)
├── commands/       palette + registry + bootstrap + templates + practice
├── keybinds/       editor + defaults + tinykeys runtime
├── solvers/        registry + computeEngine + mathsteps + wolfram
│   └── pyodide/    loader + sympy + matrix (symbolic ops bridge)
├── graphers/       2D (JSXGraph) + 3D (three + R3F) backends
├── ml/             regression, optimizers, descent, pca, distributions
├── ai/             providers + chat + proxyStream + tools + OCR + BYOK
├── share/          url + markdown + latex + pdf (MathLive → image)
├── collab/         Yjs session + Excalidraw scene binding
├── onboarding/     welcome seeds + tour + spotlight
├── state/          store + slices + IDB persist
├── components/     common/ (18 design-system primitives) + Toaster + ConfirmDialog + Icons
├── hooks/
├── vendor/         selectively forked excalidraw-app + jsxgraph CSS
└── utils/

api/                edge functions (Cloudflare + Vercel; one file, two exports)
  ├── hello.ts · wolfram.ts · ai-proxy.ts
public/             manifest + math-templates.excalidrawlib + fonts (MathLive)
scripts/            check-bundle, check-contrast, emit-library, build-cf-functions
docs/               17 markdown files documenting every layer
```

Drill-down: [`docs/architecture.md`](./docs/architecture.md).

## Deploying

Cloudflare Pages and Vercel from the same repo, same `api/*.ts` files,
same `dist/`. Pick either or run both.

- [`docs/deploy-cloudflare.md`](./docs/deploy-cloudflare.md)
- [`docs/deploy-vercel.md`](./docs/deploy-vercel.md)

Default secrets:

| Var | When needed |
|---|---|
| `WOLFRAM_APPID` | Wolfram features |
| `ENABLE_AI_PROXY=1` + `AI_PROXY_ALLOWED_ORIGINS` + at least one `*_API_KEY` | server-side AI proxy mode (and the only path for Mistral) |

No vars are required for a fully-working deploy — AI runs from the
browser via BYOK and Wolfram features stay disabled until the AppID is
set.

## Offline

The PWA precaches every chunk + MathLive's woff2 fonts. Sheets persist
to IndexedDB. Pyodide downloads 10 MB on first use and caches forever.
AI chat / Wolfram / OCR detect offline and surface in-panel banners.

Details: [`docs/offline-mode.md`](./docs/offline-mode.md).

## Bring your own AI key

Paste a key in **Settings → API keys**, verify with a one-click ping,
pick a default model. Keys are encrypted at rest with WebCrypto AES-GCM
and never leave the browser unless you opt in to the server-side proxy.
Full provider matrix + OpenAI-compatible escape hatch in
[`docs/ai-byok.md`](./docs/ai-byok.md).

## Realtime collab

Cmd+K → "Start collab session". A `#room=<id>` URL is copied to your
clipboard; anyone you share it with joins the same Yjs document over
y-webrtc. Math blocks, text blocks, AND the Excalidraw scene sync
peer-to-peer. No server beyond the public signaling.

## Tech stack

| Concern | Library |
|---|---|
| App shell | `@excalidraw/excalidraw`'s native `<Sidebar>` + `<Footer>` + `<MainMenu>` (no extra layout lib) |
| Command palette / keybinds | `cmdk` + `tinykeys` |
| Canvas | `@excalidraw/excalidraw` (+ a selective fork of `excalidraw-app`) |
| Math editor + CAS | `mathlive` + `@cortex-js/compute-engine` + `mathsteps` |
| Graphing | `jsxgraph` (2D), `three` + `@react-three/fiber` + `@react-three/drei` (3D) |
| Numerics + ML primitives | `ml-matrix`, `ml-pca`, `simple-statistics` |
| Optional in-browser autograd | `@tensorflow/tfjs` (lazy, optional) |
| Python kernel | `pyodide` (lazy) |
| AI | `ai` (Vercel AI SDK) + `@ai-sdk/{anthropic,openai,google,xai,mistral,groq}` |
| State | `zustand` + `immer` + `zundo` (undo) + `idb-keyval` (persist) |
| Realtime collab | `yjs` + `y-webrtc` |
| Styling | `tailwindcss` (v4) |
| Dialogs / popovers | Radix UI primitives |
| PWA | `vite-plugin-pwa` |
| Build | `vite` (v6), TypeScript 5.7, React 19 |

## Contributing

[`docs/contributing.md`](./docs/contributing.md) — file budget,
"everything goes through a registry" rules, the `no-restricted-syntax`
lint rule that blocks raw `<button>` outside `components/common/`, the
contrast gate, commit conventions.

Adding things:

- [`docs/adding-a-panel.md`](./docs/adding-a-panel.md)
- [`docs/adding-an-ai-provider.md`](./docs/adding-an-ai-provider.md)
- [`docs/adding-a-solver-backend.md`](./docs/adding-a-solver-backend.md)

## License

Do whatever you want with it. Third-party libraries keep their own
licenses; see [`NOTICE`](./NOTICE) for the selectively-forked
Excalidraw attribution.
