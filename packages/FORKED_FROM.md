# Forked from Excalidraw

The three packages here — `excalidraw`, `math`, `utils` — are a flat copy of
the corresponding source directories from the upstream Excalidraw repo.

## Snapshot

| Field | Value |
|-------|-------|
| Upstream repo | https://github.com/excalidraw/excalidraw |
| Tag | `v0.18.1` |
| SHA | `a2ec2889babf7d2295469c6d90ebe77fae57df84` |
| Last upstream commit | 2026-04-20  `fix: backport mermaid xss fix to 0.18.1` |
| Ingested on this branch | `fork-excalidraw` |

## What we changed from upstream

We're diverging — this repo is the source of truth from here on out. The
modifications applied during ingest (Stage A.2) are mechanical only:

- Each package's `package.json` rewritten:
  - `main` / `module` / `types` point at source (`./index.tsx`, `./index.ts`)
    instead of `./dist/prod/...`. Vite compiles the source directly; we don't
    ship the multi-stage esbuild → dist build that upstream uses for npm.
  - Removed `gen:types`, `build:esm`, and the references to
    `scripts/buildPackage.js` / `scripts/buildMath.js` / `scripts/buildUtils.js`.
    Those upstream scripts target a published-package layout that doesn't
    apply inside this workspace.
  - Inter-package deps swapped to `workspace:*`.
  - Re-declared the transitive runtime deps that the published
    `@excalidraw/excalidraw@0.18.1` previously bundled inside its dist
    (jotai, roughjs, points-on-curve, pica, pako, image-blob-reduce, etc.)
    so consumers see them on the dependency graph.

Stage B and Stage C will start patching source files. Don't try to re-sync
from upstream after that point with a naïve overwrite — cherry-pick instead.

## Re-syncing from upstream (later)

```bash
git clone --depth 50 https://github.com/excalidraw/excalidraw.git /tmp/excalidraw-upstream
# Pick a tag / SHA, then diff against our snapshot:
diff -ruN <upstream-pkg> packages/<pkg>
```

Carry over fixes by hand. Don't blanket-overwrite the directory or you lose
our Stage B/C edits.
