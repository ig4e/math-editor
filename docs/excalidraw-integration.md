# Excalidraw integration

Excalidraw is not just a doodle layer. It's the **universal visual scaffold** for the entire app. Every panel can drop visuals onto the canvas, and every connection between things is a real Excalidraw element. That's what makes the app feel unified instead of "a bunch of panels".

## Principle: extend Excalidraw's UI, don't replace it

Excalidraw's own UI is the canvas chrome. We don't build a competing shape toolbar, a competing menu, or a competing footer. The user's muscle memory from any other Excalidraw app should carry over.

We **extend** Excalidraw via its documented slots:

| Slot | What we put there |
|---|---|
| `<MainMenu>` children | New sheet, Insert template…, Open AI chat, Open Graph, Open Settings, Keyboard shortcuts |
| `renderTopRightUI` | "+ Math" block, "+ Text" block, theme toggle, sheet share |
| `<Footer>` children | known-variable count, active AI provider, "Cmd+K" hint |
| `<WelcomeScreen>` children | first-run welcome on empty sheets (uses Excalidraw's WelcomeScreen primitives) |
| `renderCustomStats` | compact panel showing the selected expression's symbolic structure (deep link to Inspector) |
| Selection floating toolbar | "Solve / Solve system / Graph / Ask AI" alongside Excalidraw's native style controls |

Native UI we leave **untouched**:

- Top-center shape tool palette (selection, lasso, freedraw, line, arrow, rectangle, ellipse, diamond, text, image, eraser).
- Bottom-left zoom controls + undo / redo.
- Right-side library panel (we ship our math-diagram templates as a public Excalidraw Library that lands here).

## Math blocks as Excalidraw anchors

The trick that makes "lasso + move a mix of math blocks and shapes" feel native:

For every math block, we maintain an **invisible Excalidraw placeholder rectangle** with:

```ts
customData = {
  kind: 'mathBlockAnchor',
  blockId,
  role?: 'source' | 'derived' | 'system-member',
}
```

- Block position changes update the anchor.
- Anchor moves (Excalidraw selection-drag, marquee-select, keyboard nudge, alignment commands) update the block position.

Excalidraw's bound-arrow machinery then "just works" on math blocks: arrows we draw between blocks bind to their anchors, so dragging a block makes its arrows follow — Excalidraw's job, free.

The `role` field also lets us reconstruct the **derivation graph** for export: a sheet exports as not just math but the actual visual relationships between equations.

## Programmatic injection — `panels/canvas/inject.ts`

Every panel that produces a visual output uses `convertToExcalidrawElements()` to inject elements into the active scene. The shared helper:

```ts
injectArrow({ from, to, label?, color?, dashed?, bindToBlocks? })
injectText({ at, text, color?, size? })
injectImage({ at, dataURL, w, h })   // used by "Pin to canvas"
injectShapes(elementsArray)          // raw escape hatch
injectBoundArrow({ fromAnchorId, toAnchorId, label? })
```

Each call wraps `convertToExcalidrawElements` + `excalidrawAPI.updateScene({ captureUpdate: 'capture' })` so the injection lands as a **single undo step** — Excalidraw's Ctrl+Z reverts our programmatic insertions cleanly.

## Where each panel pushes to the canvas

| Panel | What it injects |
|---|---|
| Solver | Arrows from each source block to the result block. Step cards as text alongside. |
| Graph 2D / 3D | "Pin to canvas" snapshots an SVG / PNG of the plot as an image element. Variable labels as text. |
| Matrix | Operation results pinned. Transformation arrows ("R₂ → R₂ − 2 R₁"). |
| Numerics | Iteration trajectories as polylines / freedraw on top of a graph image; iteration markers as small circles. |
| ML Lab | Gradient-descent paths as bound arrows tracing the optimizer's route on a 2D/3D loss-surface snapshot. |
| AI | "Pin to canvas" → text element. "Insert as block" → math block. "Apply transformation" → rewrite block in place. `inject_shapes` tool draws geometric diagrams. |
| Variables | Optional text annotation near each detected definition. |

## Lasso-to-AI / lasso-to-graph

When the user selects a group of elements (math blocks + drawings + arrows), our selection-floating toolbar surfaces:

- **Ask AI about selection** — sends a rendered PNG of the selection + plain-text math context to the AI panel.
- **Graph these** — picks math blocks in the selection and plots them.
- **Solve as system** — selected math blocks → system solve.

## Math-diagram templates

`panels/canvas/templates/` ships a curated set of one-click drop-ins, each defined as a serialized Excalidraw element list:

- Number line (labeled)
- Coordinate plane (1×1, 5×5, 10×10)
- Unit circle (with key angles)
- Venn diagram (2-set, 3-set)
- Function machine (input → box → output)
- Truth table frame
- Tree diagram skeleton
- Bar / line / scatter chart frames
- Right triangle (a, b, c labels)
- Circle with chords / tangents / secants
- ML diagrams: perceptron, MLP layers schematic, computation graph node

Invocation: Cmd+K → "Insert template…", or drag from the Excalidraw Library panel. Templates auto-place near the cursor and select the new elements.

## Shape tools through our toolbar

Our toolbar's drawing-tool group is a single small component that maps directly to `excalidrawAPI.setActiveTool({ type })`:

```
selection · lasso · freedraw · line · arrow ·
rectangle · ellipse · diamond · text · image · eraser
```

No re-implementation. The active tool is whatever Excalidraw says it is.

## Grid + snap

Excalidraw 0.18 ships alignment guides and grid mode. We enable grid at 20-unit pitch by default, with a toggle in our `Toolbar/CanvasOptions.tsx`.

## Persistence

Per-sheet `excalidrawSnapshot` (elements + appState + files) is stored via `serializeAsJSON` and rehydrated with `restoreElements / restoreAppState / restoreFiles`. The snapshot lives in `scenesSlice`, persisted to IDB.

No backwards-compatibility code: greenfield project, fresh persist key. Anything from old localStorage is discarded on first run.

## Theme

`<Excalidraw theme>` is bound to `prefsSlice.theme`. Toggling the app theme flips Excalidraw's theme in lockstep.
