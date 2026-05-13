# Phase 1 — execution plan & progress

Phase 1 (Foundation) is the spine every later phase plugs into. Closed.

## Strategy

Phase 1 shipped as **five sub-commits** on `v2` — each independently green (`npm run typecheck && npm run build`), each a coherent slice.

### Decision (May 2026): selective fork of excalidraw-app

Phase 2's Excalidraw integration was expanded from "use the NPM library" to also include a **selective fork** of `excalidraw-app`. We still use `@excalidraw/excalidraw` as the canvas engine; the vendored bits supply chrome + helpers we'd otherwise rebuild. See [`excalidraw-integration.md`](./excalidraw-integration.md).

## Sub-commits

| Sub | Title | Status | Commit |
|---|---|---|---|
| P1a | State foundation: slices + IDB persist + icons | ✅ | `8e8444e` |
| P1b | Three registries: Panel + Command + Keybind | ✅ | `7703065` |
| P1c | Design-system primitives in `components/common/` | ✅ | `c5c4287` |
| P1d | Workspace shell + Settings panel + 12 panel stubs + App.tsx swap | ✅ | `390f346` |
| P1e | Foundation contract tests | ✅ | `e28ca4b` — Vitest + jsdom + fake-indexeddb; 20 tests across 5 files |

## Verification gates — all met

- [x] Typecheck clean
- [x] Build clean (main entry 240 KB gz vs 800 KB budget; Phase 1 had 107 KB before later phases added eager imports)
- [x] `Cmd+K` opens palette
- [x] Every registered command runs
- [x] Keybind editor accepts a new shortcut and persists
- [x] Theme toggle persists
- [x] Resizing a panel persists

## Deferred / stubbed in Phase 1

Nothing. Phase 1 closed end-to-end. The progress checklists below show every sub-task as shipped.

## P1d checklist

- [x] `workspace/Workspace.tsx` — flexlayout host
- [x] `workspace/layout.defaults.ts` — initial layout
- [x] `workspace/useWorkspace.ts` — imperative controller
- [x] Panel stubs for canvas / solver / variables / graph2d / graph3d / ai / notes / reference / inspector / matrix / numerics / mllab
- [x] Settings panel (Appearance / Keybinds editor / Layout — all real, stubs for API keys / Curriculum / Storage that later phases fill)
- [x] `panels/index.ts` barrel + `commands/index.ts` barrel + `App.tsx` swap

## P1e checklist

- [x] Vitest + jsdom + fake-indexeddb installed
- [x] `src/workspace/__tests__/PanelRegistry.test.ts` (4 tests)
- [x] `src/commands/__tests__/commands.test.ts` (4 tests)
- [x] `src/keybinds/__tests__/defaults.test.ts` (4 tests)
- [x] `src/state/__tests__/persist.test.ts` (4 tests)
- [x] `src/vendor/excalidraw-app/__tests__/encryption.test.ts` (4 tests — added with P2d)
- [x] `npm test` + `npm run test:watch` scripts
- [x] CI workflow gates on `npm test`

## Backwards-compat

Greenfield project. Old `math-sheet:v2` localStorage entries are discarded on first run; persist key is `math-notebook:v1`.
