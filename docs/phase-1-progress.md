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
| P1d | Workspace shell + Settings panel + 12 panel stubs + App.tsx swap | ✅ committed | `390f346` |
| P1e | Foundation contract tests | ✅ committed | `e28ca4b` — Vitest + jsdom + fake-indexeddb; 20 tests across 5 files |

## Phase 1 verification gates (from `verification.md`)

- [x] Typecheck clean
- [x] Build clean (main entry 107 KB gz vs 300 KB Phase 1 budget)
- [x] `Cmd+K` opens palette (wired in CommandPalette.tsx via window keydown)
- [x] Every command in the registry runs (useCommand hook + Command.run dispatch)
- [x] Keybind editor accepts a new shortcut and persists (KeybindsSection record mode + setKeybindOverride + IDB)
- [x] Theme toggle persists (prefsSlice + IDB)
- [x] Resizing a panel persists (workspaceSlice + onModelChange → setLayout)

The Phase 1 foundation is **shippable**. Phase 2 (canvas) is next.

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
