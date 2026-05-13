# Deferred & stubbed

Per the directive "don't skip on phases or sub phases", we drove every
planned phase to completion. This doc is the honest accounting of what
**isn't** in `v2` but the roadmap mentioned. Some items are clearly
follow-ups (logged here and in `transformation-complete.md`), others are
stubs that work for the happy path but don't yet match the maximalist
roadmap description.

Format: roadmap item → what shipped → gap.

## P2 — Excalidraw integration

- **Selection-floating toolbar** ("Solve / Graph / Ask AI" overlay when a mix of math blocks + shapes is selected) → the same actions exist as commands + panel buttons; **no floating bar overlay yet**.
- **Math-diagram templates library** (number line, unit circle, Venn, MLP schematic published as an Excalidraw Library JSON) → **not shipped**. The `inject.ts` API to drop pre-built elements onto the canvas IS there; the curated template content isn't.

## P6 — AI + BYOK

- **Server-side AI proxy** (`api/ai-proxy` edge function for users who don't want keys in the browser) → **not shipped**. Browser-direct path works for Anthropic / OpenAI / Google / xAI / Groq / OpenAI-compat. Mistral is marked `supportsBrowser: false` since it requires CORS that mistral.ai doesn't enable; the proxy would be its escape hatch.

## P8 — Sharing + exports

- **PDF math-glyph rendering**. Current PDF export prints equations as monospace LaTeX source. The plan called for MathLive's `convertLatexToMarkup` → image embed. Deferred to a polish round; the KaTeX → PNG pipeline is the simpler path.

## P9 — Pyodide + SymPy

- **Notes panel Python code block** (run Python against the same Pyodide instance from inside Notes) → **not shipped**. The Notes panel only does markdown today. The Pyodide kernel is wired and reachable via the solver registry; the Notes integration is the missing seam.

## P10 — Wolfram

Fully shipped (edge function + solver backend + AI tool + open-in command). No gaps.

## P11 — Realtime collab

- **Excalidraw scene sync** over Yjs → **not shipped** (math-block sync + awareness IS). `y-excalidraw` has React 19 compatibility issues; writing our own deep binding is its own work item. Math blocks, names, and the live peer indicator all sync correctly.

## P12 — Handwriting OCR

Fully shipped. No gaps.

## P13 — Matrix panel

- **Step-by-step for non-RREF ops** (eigenvalues / LU / QR / characteristic polynomial). RREF emits a per-row-operation step trace; the others currently return only the final result. The plan envisioned routing those through Pyodide-SymPy for symbolic steps. Pyodide is reachable (P9); the matrix panel doesn't yet call into it.
- **Characteristic polynomial as a distinct op** → not exposed; eigenvalues op gives the equivalent endpoint numerically.

## P14 — Numerics panel

Fully shipped. No gaps.

## P15 — ML learning lab

- **`@tensorflow/tfjs` deep-dive** for in-browser model training → **not wired**. The plan flagged it as an optional lazy add-on. The Neural-net forward-pass mode does the visualisation; live training with autograd needs TFJS, which we deliberately kept off the dep list to keep the bundle slim.
- **"Pin to canvas" for descent paths as bound arrows** on a 3D loss-surface snapshot → simpler "pin the final point" is what ships. The full trajectory-as-bound-arrows is a polish item.

## P16 — Curriculum-aware mode

- **Practice generator** command (generate problems at the chosen curriculum level via the AI provider) → **not shipped**. The curriculum drives the Reference filter + AI system prompt today; a dedicated "generate practice" command is the missing piece.

## P17 — Polish

- **Spotlight / highlight pass** in the tour (visually highlight the target panel as the step advances) → not shipped. The tour is a 5-step Dialog walkthrough; no panel-level highlight yet.
- **Tablet/stylus auto-bigger toolbar** in pointer-coarse mode → relies on Excalidraw's native palm rejection + our existing 28/32/40-pt button heights. No explicit "tablet mode" toggle yet.
- **Color-contrast CI gate** for design tokens (the build-time assertion docs mention) → not wired.
- **ESLint `no-restricted-syntax: ['button']` rule** enforcing "primitives only outside common/" → not configured. The rule is described in `contributing.md` as the enforcement mechanism; the code currently follows the convention by convention, not by lint.

## Cross-cutting

- **MathLive fonts bundled offline**. We currently set `MathfieldElement.fontsDirectory` to a jsdelivr CDN URL in `src/main.tsx`. The plan called for shipping the fonts in `public/` so the app renders math offline without a font fetch. The PWA precaches the rest of the assets; this one external dep means math glyphs degrade to fallback fonts when offline before a first warm load.
- **Color-contrast script + ESLint primitive enforcement** — see P17 above.

## Where it's all logged

Every item above is also called out in the per-phase commit messages on `v2` and in [`transformation-complete.md`](./transformation-complete.md). If you pull `v2` and want to keep going, the items here are roughly in priority order top-to-bottom.
