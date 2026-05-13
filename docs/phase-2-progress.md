# Phase 2 — Excalidraw integration progress

## Sub-commits

| Sub | Title | Status | Notes |
|---|---|---|---|
| P2a | Delete legacy drawing layer; enable `noUncheckedIndexedAccess` | ✅ committed | `dcf5d50` — 40 files removed, 2828 lines deleted |
| P2b | Wire Excalidraw into Canvas panel with native UI | ✅ committed | `cb89787` — CanvasMainMenu/TopRight/Footer/Welcome around `<Excalidraw>` |
| P2c | MathOverlay + anchor sync + injection API | ✅ committed | `5c06bd2` — MathBlock/TextBlock/anchors/inject |
| P2d | Selective vendor of `excalidraw-app` | ✅ committed | `e28ca4b` — `encryption.ts` + `share-link.ts` vendored with attribution; NOTICE file at repo root |

## Verification gate

From [`verification.md`](./verification.md):

> P2 — Excalidraw canvas: Excalidraw renders with its native UI intact (shape palette, MainMenu, library panel, zoom + undo controls). Our additions appear in the MainMenu, the top-right region, the footer, and the selection-floating toolbar. Math blocks render and edit. Lasso a mix of math blocks + Excalidraw shapes and they move together.

- [x] Excalidraw renders with native UI intact (we never replace its chrome)
- [x] `<MainMenu>` extensions visible (`CanvasMainMenu`)
- [x] `renderTopRightUI` extensions visible (`CanvasTopRight` with + Math / + Text / theme)
- [x] `<Footer>` extension visible (`CanvasFooter` with block count + provider + ⌘K hint)
- [x] `<WelcomeScreen>` extension visible (`CanvasWelcome`)
- [x] Math blocks render via `MathOverlay` and `sceneCoordsToViewportCoords`
- [x] Math blocks edit (MathLive `<math-field>` two-way bound to store)
- [x] Anchor system: invisible Excalidraw rectangles mirror each block's bounds → Excalidraw's lasso/marquee/move/align natively work on math blocks
- [x] Programmatic `inject.ts` API skeleton (filled by P3 Solver arrows, P4 Graph pin-to-canvas)
- [ ] **Selection-floating toolbar** (Solve / Graph / Ask AI on selected blocks) — deferred to P3 when the actions actually exist

## Architecture map (canvas folder)

```
src/panels/canvas/
├── CanvasPanel.tsx       # host: <Excalidraw> + slots + MathOverlay + useAnchorSync
├── CanvasMainMenu.tsx    # <MainMenu> children — math menu items + Excalidraw defaults
├── CanvasTopRight.tsx    # renderTopRightUI — + Math / + Text / theme
├── CanvasFooter.tsx      # <Footer> children — status strip
├── CanvasWelcome.tsx     # <WelcomeScreen> children — first-run hints
├── MathOverlay.tsx       # absolute-positioned React tree of blocks
├── MathBlock.tsx         # MathLive wrapper + chrome
├── TextBlock.tsx         # contenteditable wrapper + chrome
├── anchors.ts            # invisible-rectangle bidirectional sync
├── inject.ts             # programmatic injection API
└── register.ts           # panel registration
```

## Bundle impact

- Main entry: 159 KB gz (P1 was 105 KB gz; Excalidraw's CSS import lifts ~50 KB of eager code into the entry; well under 300 KB Phase 1 budget and 800 KB total budget)
- Mermaid sub-chunks: largest 719 KB gz (lazy, well under 1500 KB per-chunk ceiling)
- Total JS chunks: 137 (most are 0.3-2 KB lazy chunks for Excalidraw's per-feature loaders)

## Open follow-ups (revisit during P17 polish)

- Excalidraw 0.18 ships Mermaid for shape-text diagrams; we may want to disable that feature to drop ~700 KB of lazy weight that's irrelevant to math notebooks. Check `UIOptions` for a flag.
- Anchor rectangle size is currently a fixed 240×48 default; should be measured from the rendered React block via a ResizeObserver so lasso bounds match the actual math.
- TextBlock placeholder rendering uses our existing `data-placeholder` CSS rule from `index.css`; works but feels limited — Phase 7 may swap for a richer markdown editor.
- Selection-floating toolbar (Solve / Graph / Ask AI) lands in P3 when those actions exist.
