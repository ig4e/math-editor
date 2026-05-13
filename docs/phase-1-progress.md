# Phase 1 — execution plan & progress

This doc tracks the sub-commit plan and live progress through Phase 1 (Foundation). Once Phase 1 lands, this file gets a "completed" marker; Phase 2 onward each get their own progress doc the same way.

## Strategy

Phase 1 ships as **five sub-commits** on the `v2` branch — each one independently green (`npm run typecheck && npm run build`), each one a coherent slice of the foundation. Reviewing five 100-300 line commits beats reviewing one 2000-line commit.

### Decision (May 2026): selective fork of excalidraw-app

Phase 2's Excalidraw integration was expanded from "use the NPM library" to also include a **selective fork** of the `excalidraw-app` source (the excalidraw.com webapp). We pick the UX components we'd otherwise rebuild (share dialog, encryption helpers, welcome screen patterns, main-menu layout, mobile responsive bits) and vendor them with attribution. We still use `@excalidraw/excalidraw` as the canvas engine. The flexlayout workspace stays as the dock host; vendored Excalidraw bits supply the chrome inside the Canvas panel. See [`excalidraw-integration.md`](./excalidraw-integration.md) for the vendor inventory.

## Sub-commits

| Sub | Title | Status | Notes |
|---|---|---|---|
| P1a | State foundation: slices + IDB persist + icons | ✅ committed | `8e8444e` |
| P1b | Three registries: Panel + Command + Keybind | ✅ committed | `7703065` |
| P1c | Design-system primitives in `components/common/` | ✅ committed | `c5c4287` |
| P1d | Workspace shell + Settings panel skeleton + panel stubs + App.tsx swap | 🚧 in progress | flexlayout host done; panel stubs + Settings + Keybind editor + App swap next |
| P1e | Foundation contract tests + bundle-budget update | ⏳ pending | asserts registry contracts, theme persist, layout persist |

## Phase 1 verification gates (from `verification.md`)

- [x] Typecheck clean
- [x] Build clean
- [x] Bundle: main entry under 300 KB gz, total under 800 KB gz
- [ ] `Cmd+K` opens palette (works at code level; tested in dev once P1d lands)
- [ ] Every command in the registry runs
- [ ] Keybind editor accepts a new shortcut and persists across reload
- [ ] Theme toggle persists across reload
- [ ] Resizing a panel persists across reload

## P1d sub-checklist (live)

- [x] `workspace/Workspace.tsx` — flexlayout host with persisted layout + registry factory
- [x] `workspace/layout.defaults.ts` — initial Canvas + Solver/Variables/Graph layout
- [x] `workspace/useWorkspace.ts` — imperative controller (openPanel / closePanel / focusPanel / resetLayout)
- [ ] Panel stubs: canvas / solver / variables / graph2d / graph3d / ai / notes / reference / inspector / matrix / numerics / mllab
- [ ] `panels/settings/SettingsPanel.tsx` (Tabs: Appearance / Keybinds / Layout / API keys / Curriculum / Storage / Privacy)
- [ ] `panels/settings/Appearance.tsx` (theme / themeAuto / fontScale)
- [ ] `panels/settings/Keybinds.tsx` (full editor with record mode, conflict detection, reset, export/import)
- [ ] `panels/settings/Layout.tsx` (preset picker + save / reset)
- [ ] `panels/index.ts` — barrel that imports every panel's `register.ts`
- [ ] `commands/index.ts` — barrel + `registerBootstrapCommands()` call
- [ ] `App.tsx` swap — replace the old Whiteboard layout with `<Workspace />` + `<CommandPalette />` + `<Toaster />` + `<ConfirmDialog />` + `<IconSprite />`
- [ ] `main.tsx` unchanged (still mounts `<App />`)

## P1e sub-checklist (live)

- [ ] Vitest + jsdom installed
- [ ] `src/workspace/__tests__/registries.test.ts` — fake panel registers + appears; fake command registers + fires its keybind
- [ ] `src/state/__tests__/persist.test.ts` — theme toggle persists round-trip; layout persists round-trip
- [ ] `npm run test` script added; CI workflow extended

## Open questions parked

- **flexlayout-react 0.9 theme**: we import `light.css` from the package; dark-mode polish lands in P17.
- **Vendor inventory deferred**: Phase 2 (P2) does the actual `src/vendor/excalidraw-app/` fork. Phase 1 only commits to the direction.

## Backwards-compat note

Greenfield project. Old localStorage entries from prior dev iterations (`math-sheet:v2`) are discarded on first run — the new persist key is `math-notebook:v1`. No migration code.
