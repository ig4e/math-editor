# Phase 2 — Excalidraw integration progress

Closed. Canvas mounts Excalidraw with its full native UI extended via documented slots; math blocks live as overlay components anchored to invisible rectangles so lasso/marquee/move all work natively.

## Sub-commits

| Sub | Title | Status | Commit |
|---|---|---|---|
| P2a | Delete legacy drawing layer; enable `noUncheckedIndexedAccess` | ✅ | `dcf5d50` — 40 files removed, 2828 lines deleted |
| P2b | Wire Excalidraw into Canvas panel with native UI | ✅ | `cb89787` |
| P2c | MathOverlay + anchor sync + injection API | ✅ | `5c06bd2` |
| P2d | Selective vendor of `excalidraw-app` | ✅ | `e28ca4b` — `encryption.ts` + `share-link.ts` + NOTICE |

## Verification gates — met

- [x] Excalidraw renders with native UI intact
- [x] `<MainMenu>` / `renderTopRightUI` / `<Footer>` / `<WelcomeScreen>` extensions visible
- [x] Math blocks render and edit via MathOverlay
- [x] Anchor system lets lasso a mix of math blocks + Excalidraw shapes move together
- [x] `inject.ts` API: arrows / bound arrows / text / image / shapes

## Deferred / stubbed — CLOSED

Both P2 deferrals shipped in the follow-up commit sequence:

- **Selection-floating toolbar** — `cd0925e` (B1). `src/panels/canvas/SelectionToolbar.tsx` reads `appState.selectedElementIds`, finds math-block anchors, and overlays Solve / Graph / Ask AI actions at the selection bbox.
- **Math-diagram templates library** — `7376ff4` (B2). 11 templates in `src/panels/canvas/templates.ts`, picker dialog, command `canvas.insertTemplate`, and the published `public/math-templates.excalidrawlib` regenerable via `node scripts/emit-library.mjs`.

See [`deferred-and-stubbed.md`](./deferred-and-stubbed.md) for the full audit trail.

## Architecture map

```
src/panels/canvas/
├── CanvasPanel.tsx       host: <Excalidraw> + slots + MathOverlay + useAnchorSync
├── CanvasMainMenu.tsx    MainMenu children — math menu items + Excalidraw defaults
├── CanvasTopRight.tsx    renderTopRightUI — + Math / + Text / theme
├── CanvasFooter.tsx      Footer children — status strip + CollabStatus (added in P11)
├── CanvasWelcome.tsx     WelcomeScreen children — first-run hints
├── MathOverlay.tsx       absolute-positioned React tree of blocks
├── MathBlock.tsx         MathLive wrapper + chrome
├── TextBlock.tsx         contenteditable wrapper + chrome
├── anchors.ts            invisible-rectangle bidirectional sync
├── inject.ts             injectArrow / injectBoundArrow / injectText / injectImage / injectShapes
├── snapshotSelection.ts  exportToCanvas wrapper used by OCR (P12)
└── register.ts           panel registration
```

## Bundle at end of P2

- Main entry: 159 KB gz
- Excalidraw mermaid sub-chunks: largest 719 KB gz (lazy)
- Total JS chunks: 137

## Open polish items

- Excalidraw 0.18 ships Mermaid for shape-text — ~700 KB of lazy chunks irrelevant to math. Check `UIOptions` for a flag to disable.
- Anchor rectangle size is a fixed 240×48 default; should be measured from the rendered React block via a ResizeObserver so lasso bounds match the actual math.
- TextBlock uses contenteditable with the `data-placeholder` CSS rule. Phase 7 added the richer markdown editor in the Notes panel, but blocks themselves are still plaintext.
