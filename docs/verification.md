# Verification

Every phase ends with `npm run typecheck && npm run build` green and a manual smoke check from the list below. A phase isn't "done" until every line in its row passes.

| Phase | Smoke check |
|---|---|
| **P0** Infra | Cloudflare + Vercel deployments both succeed. `/api/wolfram?q=2%2B2` returns 4. PWA installable (the install prompt appears, the SW registers, the app loads from cache offline). |
| **P1** Foundation | `Cmd+K` opens the palette. Every command in the registry runs. The keybind editor accepts a new shortcut and persists it across reload. Theme toggle persists across reload. Resizing a panel persists across reload. |
| **P2** Excalidraw canvas | Excalidraw renders **with its native UI intact** — shape palette, MainMenu, library panel, zoom + undo controls. Our additions appear in the MainMenu, the top-right region, the footer, and the selection-floating toolbar. Math blocks render and edit. Lasso a mix of math blocks + Excalidraw shapes and they move together. |
| **P3** Solver + Variables | Type `x² − 5x + 6 = 0` → `Cmd+Enter` → result block shows `x = 2, x = 3` plus a steps card via mathsteps. System solve draws bound arrows from each source to the result; dragging a source moves its arrow. |
| **P4** Graph 2D | Select `y = x²` → the Graph 2D panel auto-plots. A slider for `a` in `y = ax²` re-plots live. "Pin to canvas" drops an SVG image element. |
| **P5** Graph 3D | Open Graph 3D, plot `z = sin(x)·cos(y)`, orbit the camera. Slider for `a` in `z = a·sin(x)·cos(y)` re-plots live. Pin to canvas works. |
| **P6** AI + BYOK | Paste an Anthropic key in Settings → Verify says "ok" → AI panel streams a response. Tool use lights up the Graph panel when the model picks the `graph` tool. The OpenAI-compatible adapter accepts a DeepSeek key + base URL and works. |
| **P7** Notes / Reference / Inspector | Notes accept markdown. Reference shows formulas, filterable. Inspector shows the MathJSON tree for a selected block. |
| **P8** Sharing + exports | "Copy share link" produces a URL that, opened in an incognito window, restores the sheet exactly. PDF / LaTeX / Markdown export each produce a valid file. |
| **P9** Pyodide + SymPy | Pyodide loads once (with the "Downloading Python…" toast); future loads are instant. SymPy step solve on `∫ x sin(x) dx` returns a step list. |
| **P10** Wolfram | "Ask Wolfram" works against the edge function on both CF and Vercel. The AI `ask_wolfram` tool routes through the same proxy. |
| **P11** Realtime collab | Open the same share link in two browsers → Yjs sync; both see updates and each other's cursors. |
| **P12** Handwriting OCR | Sketch `2x + 3` on the canvas, lasso → "Convert to math" → math block created with `2x + 3`. |
| **P13** Matrix panel | Enter a 3×3, click Eigenvalues → result + steps card. "Drop into sheet" inserts the result as a math block. |
| **P14** Numerics | Newton's method on `f(x) = x² − 2` from `x₀ = 1` converges to √2 in 5 iterations. Iteration table + convergence chart shown. "Send to graph" overlays the trajectory. |
| **P15** ML Lab | Regression on a 5-point dataset draws a fitted line. Gradient descent shows the optimizer path on `z = x² + y²` in Graph 3D. PCA on a sample matrix shows projected points + principal axes in Graph 2D. Sliders on a normal distribution update the curve live. |
| **P16** Curriculum-aware | Pick "AP Calc BC"; the Reference panel filters; the AI's system prompt uses the right notation; the practice generator produces relevant problems. |
| **P17** Polish | Welcome sheet renders on first run. "Tour" command re-runs onboarding. Tablet layout has touch-friendly toolbar; palm rejection works for stylus input. |

## How to run

```bash
npm run typecheck   # fast — must be clean
npm run build       # full build — must be clean
npm run preview     # serves dist/ at :4173 for the smoke walk
```

The deploy smoke (P0) additionally requires a Cloudflare and a Vercel deploy. See [`deploy-cloudflare.md`](./deploy-cloudflare.md) / [`deploy-vercel.md`](./deploy-vercel.md).

## CI gates

The GitHub Actions workflow enforces:

- `npm run typecheck` clean.
- `npm run build` clean.
- `node scripts/check-bundle.mjs` clean — main entry under 800 KB gzipped, Phase 1 budget under 300 KB.
- (Phase 1+) the foundation contract tests pass.

If any gate fails, the deploy job doesn't run.
