# v2 transformation — complete

Every phase in [`roadmap.md`](./roadmap.md) has landed on the `v2`
branch. This doc is the at-a-glance summary; per-phase progress lives in
[`phase-1-progress.md`](./phase-1-progress.md), [`phase-2-progress.md`](./phase-2-progress.md), and the per-commit messages on `v2`.

## Phase outcomes

| Phase | Subject | Status | Notes |
|---|---|---|---|
| docs | /docs/ scaffold | ✅ | 15 files |
| P0 | Dual deploy + PWA + bundle budget | ✅ | CF + Vercel from `api/`; bundle gate; SW |
| P1 | Foundation (state / 3 registries / primitives / shell) | ✅ | P1a–d + P1e (20 tests) |
| P2 | Excalidraw canvas | ✅ | P2a–c + P2d (vendored encryption + share-link) |
| P3 | Solver + Variables | ✅ | + P3b bound arrows & pin-to-canvas |
| P4 | Graph 2D (JSXGraph) | ✅ | f(x) / parametric / implicit / roots / extrema / intersections |
| P5 | Graph 3D (three.js + R3F) | ✅ | surface / parametric-surface / curve / vector-field / points |
| P6 | AI + BYOK | ✅ | 6 first-party + OpenAI-compat for DeepSeek/Qwen/Moonshot/Zhipu/etc. |
| P7 | Notes / Reference / Inspector | ✅ | markdown notes + formula sheet + MathJSON tree |
| P8 | Sharing + exports | ✅ | share-link, Markdown, LaTeX, PDF, workspace JSON |
| P9 | Pyodide + SymPy | ✅ | lazy 10 MB kernel; SymPy step solver |
| P10 | Wolfram | ✅ | edge function proxy + solver backend + AI tool + free-path open-in |
| P11 | Realtime collab | ✅ | Yjs + y-webrtc; math-block sync + awareness. Excalidraw scene sync = follow-up. |
| P12 | Handwriting OCR | ✅ | vision-LLM transcription of selected sketch |
| P13 | Matrix panel | ✅ | det / inverse / transpose / rank / RREF (with steps) / eigvals / LU / QR |
| P14 | Numerics panel | ✅ | Newton / Bisection / Secant / Euler / RK4 / Trapezoid / Simpson / Grad descent / FFT |
| P15 | ML learning lab | ✅ | Regression / Descent / Distributions / Activations / PCA / Neural net forward pass |
| P16 | Curriculum-aware mode | ✅ | 8 curricula; tunes Reference filter + AI prompt |
| P17 | Polish | ✅ | welcome sheet + 5-step tour + help.tour command |

All 13 follow-up items previously logged in `deferred-and-stubbed.md`
have since shipped. See that doc for the commit-by-commit audit trail.

## Final shape of `src/`

```
src/
├── App.tsx · main.tsx · index.css · sw.ts · pwa.ts · vite-env.d.ts
│
├── workspace/                    flexlayout shell + PanelRegistry
├── panels/                       12 panel folders
│   ├── canvas/                   Excalidraw + MathOverlay + anchors + inject
│   ├── solver/                   step-by-step + Pin-to-canvas
│   ├── variables/                detected defs + live sliders
│   ├── graph/                    JSXGraph 2D
│   ├── graph3d/                  three.js + R3F
│   ├── ai/                       streaming chat + tool use
│   ├── notes/                    markdown + preview
│   ├── reference/                searchable formula sheet
│   ├── inspector/                MathJSON tree
│   ├── matrix/                   linear algebra GUI
│   ├── numerics/                 9 methods + iterate table + chart
│   ├── mllab/                    6-mode learning lab
│   └── settings/                 Appearance / Keybinds / Layout / API keys / Curriculum / Storage / Privacy
│
├── commands/                     palette + registry + bootstrap commands
├── keybinds/                     full rebinder + tinykeys runtime
│
├── solvers/                      registry + computeEngine + mathsteps + wolfram + pyodide/sympy
├── graphers/                     registry + jsxgraph2d + three3d + LaTeX→spec + compileMulti + analysis
├── ml/                           regression / optimizers / descent / pca / distributions / activations
├── ai/                           providers (6 + compat) + byok (WebCrypto) + chat + tools + ocr
├── share/                        url / markdown / latex / pdf / loader
├── collab/                       Yjs session + status indicator
├── onboarding/                   welcome seeds + tour
│
├── state/                        store + 7 slices + IDB persist
├── components/                   common/ (18 primitives) + Toaster + ConfirmDialog + Icons
├── hooks/                        useThemeSync + useToastLifecycle + useActiveMathField
└── utils/                        cx + geom + lazy + mathfield + text

api/                              edge functions (hello + wolfram)
src/vendor/                       jsxgraph CSS + excalidraw-app (encryption + share-link)
docs/                             17 docs files + this summary
```

## Final bundle profile

| Chunk | Size (gz) |
|---|---|
| Main entry | 240 KB |
| Mermaid (Excalidraw lazy) | 720 KB |
| MathLive vendor | 211 KB |
| compute-engine vendor | 160 KB |
| three.js + R3F (lazy) | ~300 KB split across two chunks |
| jsPDF (lazy) | 118 KB |
| Pyodide tarball (IDB-cached) | ~10 MB on first use |
| Per-panel chunks | mostly under 5 KB each |

Per-chunk budget (1500 KB gz) clean. Main-entry budget (800 KB gz) clean with **560 KB to spare**.

## Verification

`docs/verification.md` ↑ every gate has its commit reference. The build,
typecheck, and 20/20 vitest tests are green on every commit. Manual smoke
checks against the verification list are the user's exercise; see the
gates noted in each P-phase commit message.

## Cross-cutting follow-ups closed

All five items previously listed here shipped in the close-out
sequence. The only remaining cross-cutting work is the optional
Excalidraw Mermaid removal (would shed ~720 KB lazy for users who
never paste mermaid syntax into shape text); it's a configuration
flag in Excalidraw 0.18+ and could be a one-line change if it
becomes a real bottleneck.

## What landed in close-out (after the initial 17 phases)

| Commit | Subject |
|---|---|
| `36c3d36` | A1 — MathLive fonts bundled offline (Vite plugin emits `dist/fonts/*.woff2`) |
| `5fdacab` | A2 — ESLint flat config + `no-restricted-syntax` for `<button>` + WCAG contrast script in CI |
| `cd0925e` | B1 — Selection-floating toolbar on canvas |
| `7376ff4` | B2 — 11-template math-diagram library + `.excalidrawlib` + picker dialog |
| `801a3a7` | B3 — Tour spotlight SVG-mask overlay with per-step targets |
| `18277ec` | B4 — Tablet / stylus-mode toggle (44 px tap targets) |
| `5da7a01` | C1 — PDF math glyphs via MathLive + html-to-image |
| `32292c9` | C2 — Python code blocks in Notes panel |
| `c478aee` | D1 — `api/ai-proxy.ts` server-side AI proxy edge function |
| `35939ec` | E1 — Matrix symbolic ops via Pyodide-SymPy + char-poly op |
| `083e386` | F1 — Excalidraw scene sync via custom Yjs binding |
| `df27d02` | G1 — TFJS train mode in ML Lab (lazy `optionalDependencies`) |
| `e9f8d6c` | G2 — Pin descent trajectory as image + chain of arrows |
| `249a977` | H1 — Practice generator command (curriculum + AI → math blocks) |
