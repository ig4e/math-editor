# Contributing

Read [`architecture.md`](./architecture.md) first. This doc covers the rules that keep the codebase shippable.

## Setup

```bash
npm install
npm run dev          # vite dev server
npm run typecheck    # tsc -b --noEmit
npm run build        # full type-check + production build
```

Pre-commit: at minimum, `npm run typecheck && npm run build` must be green.

## Code-style guard rails

- **Every file under ~200 lines.** CI flags files over 250. If a file grows past that, split it — the right split usually emerges as a hook, a small util, or a sub-component.
- **Lazy-load anything > 100 KB gzipped.** Excalidraw, JSXGraph, mathsteps, Pyodide, Three.js, vision models — all behind `lazyPanel()` from `utils/lazy.ts`. No ad-hoc dynamic imports.
- **Single source of truth.** Zustand store. No prop drilling for state. No `Context.Provider` for state (Context is fine for *static* things like the icon registry).
- **No `any`.** Strict TS; `noImplicitAny`, `noUncheckedIndexedAccess` on. If a type is genuinely unknown, type it as `unknown` and narrow.
- **One panel = one folder** under `src/panels/`. Each registers itself via `PanelRegistry`. See [`adding-a-panel.md`](./adding-a-panel.md).
- **One AI provider = one file** under `src/ai/providers/`. See [`adding-an-ai-provider.md`](./adding-an-ai-provider.md).
- **No bespoke utilities for things Radix / Tailwind already do.** No hand-rolled dropdown menus, no `useFocusTrap`, no `useClickOutside` — Radix has them.
- **Main entry under 800 KB gzipped** before lazy chunks. The CI bundle-size check fails the build if this is breached.

## UI rules

- All styled primitives live in `src/components/common/`. **No direct `<button>` outside that folder.** The eslint rule `no-restricted-syntax: ['button']` flags it; the fix is "import Button from common".
- All colors come from the Tailwind `@theme` tokens defined in `src/index.css`. No literal hex outside that file.
- All animations under 200 ms. One easing curve (`ease-out`). `prefers-reduced-motion` disables non-essentials.
- All overlays use Radix's focus-trap + Esc / outside-click. No hand-rolled modal.
- All interactive elements have accessible names (`aria-label` or visible label).

Full design system in [`ui-design-system.md`](./ui-design-system.md).

## State rules

- One Zustand store. Slices compose via the `AppSlice<T>` mutator pattern. Reach for an existing slice before adding a new one.
- Persisted slices only — never persist tool / selection / toast state.
- Undo history covers user-data slices only (`sheets`, `blocks`, `scenes`) via `zundo`'s `temporal` middleware. Don't add UI state to the temporal partializer.

## Registry rules

Three registries — Panel, Command, Keybind — are the **only** places features wire themselves into the app shell. Avoid bespoke wiring: if you're touching `Workspace.tsx` to add a panel or `App.tsx` to bind a key, you're doing it wrong.

## Commits & PRs

- Branch from `main` (or `v2` while we're in the transformation).
- Imperative commit messages ("Add solver panel" not "Added solver panel").
- One topic per PR. A PR that touches a panel, a command, *and* a slice unrelated to the panel is two PRs.
- **Every PR that changes a public contract updates the matching doc in the same PR.** New panel → update `adding-a-panel.md` (if the contract changed). New AI provider → update `ai-byok.md`. New keybind → update `keybindings.md`.

## Testing

- Unit-test the foundation contracts: registering a fake panel makes it appear; registering a fake command makes it appear in the palette; theme persists across reload; layout persists across reload.
- Unit-test math helpers (parsing, variable detection, anchor sync) — they're pure functions, easy and high-value.
- Integration test critical user flows (solve → result block; pin to canvas; share link round-trip) — Playwright.

## Performance

- No panel re-renders on unrelated state changes. Use Zustand's `useShallow` and memoize selectors.
- Heavy lists (variables, AI message history) use virtualized rendering when over ~100 rows.
- Excalidraw `onChange` is debounced (250 ms) before hitting the store.

## Out of scope

The full out-of-scope list lives in [`roadmap.md`](./roadmap.md#out-of-scope). The short version: no native mobile apps (PWA covers it), no server-side accounts (Yjs peer-to-peer only), no plugin marketplace, no CAS we write ourselves.
