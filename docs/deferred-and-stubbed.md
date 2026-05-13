# Deferred & stubbed — CLOSED

Per the directive "don't skip on phases or sub phases", v2 first
shipped all 17 phases, then a follow-up audit closed every gap this
doc previously tracked. **As of the commits below, nothing on the
v2 roadmap is deferred.**

If you're looking for the gap-by-gap implementation, the commit log
on `v2` from `36c3d36` onward is the audit trail.

| Item | What was missing | Resolving commit |
|---|---|---|
| P2 selection-floating toolbar | Solve / Graph / Ask AI overlay when math blocks are selected on the canvas | `cd0925e` (B1) |
| P2 math-diagram templates library | 11 curated templates + Insert template command + .excalidrawlib | `7376ff4` (B2) |
| P6 server-side AI proxy | `api/ai-proxy.ts` edge function + client toggle + Mistral CORS escape hatch | `c478aee` (D1) |
| P8 PDF math-glyph rendering | Equations rendered as glyphs via MathLive + html-to-image, not monospace LaTeX | `5da7a01` (C1) |
| P9 Python code blocks in Notes | Run-button on `python` fenced blocks; stdout / stderr captured via Pyodide | `32292c9` (C2) |
| P11 Excalidraw scene sync over Yjs | Custom Y.Map binding (avoids y-excalidraw / React 19 issue) | `083e386` (F1) |
| P13 Matrix step-by-step for eig / LU / QR | Pyodide-SymPy bridge with full step traces | `35939ec` (E1) |
| P13 Characteristic polynomial op | New symbolic-only `charpoly` op in Matrix panel | `35939ec` (E1) |
| P15 TFJS deep-dive | New Train mode with live autograd training + loss-curve chart | `df27d02` (G1) |
| P15 Descent path as bound arrows on 3D snap | "Pin trajectory" rasterises the loss surface and chains injectArrow per step | `e9f8d6c` (G2) |
| P16 Practice generator command | `curriculum.generatePractice` → AI → math blocks on canvas | `249a977` (H1) |
| P17 Tour spotlight | SVG-mask overlay with per-step `data-tour-target` highlighting | `801a3a7` (B3) |
| P17 Tablet / stylus mode toggle | `prefs.tabletMode` + CSS rule for 44 px tap targets | `18277ec` (B4) |
| P17 Color-contrast CI | `scripts/check-contrast.mjs` + CI step | `5fdacab` (A2) |
| P17 ESLint `no-button` rule | `eslint.config.mjs` flat config + CI step | `5fdacab` (A2) |
| Cross-cutting: MathLive fonts bundled offline | Vite plugin emits woff2 into dist/fonts; main.tsx fontsDirectory='/fonts' | `36c3d36` (A1) |

## What's still genuinely "future work" (and never was in v2's scope)

The roadmap's `out-of-scope` section in `docs/roadmap.md` lists items
intentionally not in v2 — native mobile apps, cloud sync beyond Yjs,
plugin marketplace, pen handwriting without AI, a CAS we wrote
ourselves. Those remain outside the project's stated boundaries.

## Where it's all logged

Every item above has a focused commit on `v2` with a detailed body.
Pulling `v2` and running `git log --oneline 36c3d36^..` walks the
trail.
