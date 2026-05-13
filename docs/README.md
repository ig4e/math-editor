# Math Notebook — docs

Welcome. This directory is the source of truth for **how the app is built, not just what it does**. It is written into the repo as the project itself is built, so the first commit of any phase that ships a new contract also lands its doc here.

If you're reading this for the first time, take the docs in this order:

1. [`roadmap.md`](./roadmap.md) — the phased plan we're executing against. Every later doc is a slice of this one.
2. [`architecture.md`](./architecture.md) — the high-level shape of the codebase: state, panels, command + keybind registries, solver / grapher / AI provider backends.
3. [`ui-design-system.md`](./ui-design-system.md) — the design tokens, primitive components, and panel chrome conventions every panel obeys.
4. [`excalidraw-integration.md`](./excalidraw-integration.md) — how Excalidraw is the universal visual layer: anchors, bound arrows, programmatic injection, templates.

## End-user guides

- [`keybindings.md`](./keybindings.md) — default shortcuts + how to rebind.
- [`ai-byok.md`](./ai-byok.md) — bring-your-own-key AI: providers, key safety, OpenAI-compatible adapter for Chinese labs.
- [`offline-mode.md`](./offline-mode.md) — what works without a network, how Pyodide caches.

## Self-hosting

- [`deploy-cloudflare.md`](./deploy-cloudflare.md) — Cloudflare Pages step-by-step.
- [`deploy-vercel.md`](./deploy-vercel.md) — Vercel step-by-step.

## Contributing

- [`contributing.md`](./contributing.md) — code style, file budget, the "everything goes through a registry" rules.
- [`adding-a-panel.md`](./adding-a-panel.md) — registering a new dockable panel in three lines.
- [`adding-an-ai-provider.md`](./adding-an-ai-provider.md) — wiring a new LLM provider.
- [`adding-a-solver-backend.md`](./adding-a-solver-backend.md) — wiring a new math solver / CAS.
- [`verification.md`](./verification.md) — the per-phase smoke checks we run before a phase is "done".

## Live progress docs

- [`phase-1-progress.md`](./phase-1-progress.md) — Phase 1 execution plan & sub-commit checklist.
- [`phase-2-progress.md`](./phase-2-progress.md) — Phase 2 sub-commit checklist + canvas folder map.

## Where the source code lives

A quick map (see [`architecture.md`](./architecture.md) for the full layout):

| Concern | Path |
|---|---|
| Workspace shell + dockable panels | `src/workspace/` |
| Individual panels (one folder each) | `src/panels/<name>/` |
| Command registry + palette (Cmd+K) | `src/commands/` |
| Keybind registry + editor | `src/keybinds/` |
| Solver backends | `src/solvers/` |
| Graphers (2D, 3D) | `src/graphers/` |
| ML primitives | `src/ml/` |
| AI providers + BYOK | `src/ai/` |
| Sharing + exports | `src/share/` |
| Zustand state | `src/state/` |
| Shared UI primitives | `src/components/common/` |
| Edge functions (Cloudflare + Vercel) | `api/` |
