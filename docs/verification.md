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

## Close-out smoke checks (A1–H1)

These cover the follow-up items that closed every original deferral. The build pipeline gates `lint` + `check:contrast` automatically; the rest are manual walks.

| Tag | Smoke check |
|---|---|
| **A1** MathLive fonts offline | After build, `dist/fonts/*.woff2` is present. Throttle DevTools to "Offline" after one warm load — math glyphs render correctly. |
| **A2** ESLint + contrast CI | `npm run lint` returns 0 errors. Inserting a raw `<button>` in `src/panels/**` fails lint. `npm run check:contrast` prints OK for every curated pair in both themes. |
| **B1** Selection-floating toolbar | Marquee-select a math block on the canvas → toolbar appears above with Solve / Graph / Ask AI. Clicking Solve opens the Solver and runs against that block. |
| **B2** Template library | `Cmd+K` → "Insert template…" opens the picker. Pick Venn 2-set → ellipses + labels land on canvas as one undo step. `public/math-templates.excalidrawlib` imports cleanly into Excalidraw's native Library panel. |
| **B3** Tour spotlight | Run the Tour. Step 2 (Plot things) dims the page except the Graph 2D panel; step 4 (BYOK) slides the spotlight to the Settings panel. |
| **B4** Tablet mode | Toggle Settings → Appearance → Tablet / stylus mode → every interactive surface grows to ≥ 44 px. Auto-on for `pointer: coarse` devices. |
| **C1** PDF math glyphs | Export a sheet with `\frac{1}{2}` and `\int x\,dx` → PDF renders true math glyphs, not monospace LaTeX source. |
| **C2** Notes Python blocks | In Notes, write a ```python``` block with `print(1+1)` → Run → "2" appears below. Second run is instant. |
| **D1** AI proxy | With `ENABLE_AI_PROXY=1` + `MISTRAL_API_KEY` + `AI_PROXY_ALLOWED_ORIGINS` set on Cloudflare / Vercel, Mistral chat works without browser-CORS errors. Toggle Settings → API keys → "Use server-side proxy" to route any provider through `/api/ai-proxy`. |
| **E1** Matrix symbolic | Enter `[[1,2],[3,4]]`, flip Symbolic mode, click eigvals → exact eigenvalues with surds. Click char-poly → polynomial in λ. Pyodide downloads once with a toast, future calls instant. |
| **F1** Collab scene sync | Two browser tabs same room → draw a circle in A → appears in B within ~300 ms; move it in B → A updates; delete in either → removed from both. |
| **G1** TFJS train | ML Lab → Train (TFJS) → load CSV → click Train → loss curve updates each epoch. Pin weights drops them as a math block on canvas. Bundle: `vendor-tfjs` chunk is lazy and ~300 KB gz. |
| **G2** Descent trajectory pin | DescentMode → run a 2D descent → "Pin trajectory" → image of the loss surface lands on canvas with a chain of arrows over the trajectory; the final arrow is red. |
| **H1** Practice generator | Set curriculum to "AP Calc BC" → `Cmd+Shift+P` → enter topic "integration by parts" → 5 math blocks appear stacked on the active sheet. |

## How to run

```bash
npm run typecheck   # fast — must be clean
npm run build       # full build — must be clean
npm run preview     # serves dist/ at :4173 for the smoke walk
```

The deploy smoke (P0) additionally requires a Cloudflare and a Vercel deploy. See [`deploy-cloudflare.md`](./deploy-cloudflare.md) / [`deploy-vercel.md`](./deploy-vercel.md).

## CI gates

The GitHub Actions workflow enforces, in this order:

- `npm run typecheck` clean.
- `npm run lint` clean — flat ESLint config; `no-restricted-syntax` blocks raw `<button>` outside `components/common/`.
- `npm run check:contrast` clean — WCAG AA on every curated `--color-*` pair.
- `npm test` clean — 34/34 vitest + jsdom.
- `npm run build:cf` clean — full typecheck + bundle gate (`scripts/check-bundle.mjs` keeps main entry under 800 KB gz) + Cloudflare functions emit.

If any gate fails, the deploy job doesn't run.
