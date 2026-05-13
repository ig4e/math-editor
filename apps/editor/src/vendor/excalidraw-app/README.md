# Vendored excalidraw-app modules

This directory holds **selectively-vendored modules adapted from
[excalidraw/excalidraw](https://github.com/excalidraw/excalidraw)** —
specifically the `excalidraw-app/` source tree (the excalidraw.com
webapp, published alongside the npm library).

Excalidraw is **MIT-licensed**; every file here retains a header that
links to the upstream snapshot and to the upstream LICENSE. See the
root [`NOTICE`](../../../NOTICE) file for the full attribution.

## Why vendor instead of importing?

The `@excalidraw/excalidraw` npm package only exposes the React library
+ a curated subset of types and utilities. The polish that makes
excalidraw.com feel like a finished product — share-link compression,
end-to-end encryption helpers, the welcome screen patterns, the
sidebars — lives in `excalidraw-app/` which is **not published**. We
cherry-pick the small modules we need and adapt them to our Zustand
store + Tailwind tokens, leaving behind their Jotai state, Firebase
collab, analytics, and routing.

## Sync policy

Each file lists its upstream snapshot SHA in the header. When upstream
changes a vendored file:

1. Diff `git log` upstream for the file since our snapshot.
2. Decide whether to pull the change (security fix → yes, cosmetic →
   defer until our next sync round).
3. Apply the minimum diff to our copy.
4. Update the snapshot SHA in the file header + this README's table.
5. Commit with a `sync vendor/excalidraw-app/<file>` message.

## Inventory

| File | Upstream | Phase | What we use |
|---|---|---|---|
| `encryption.ts` | `excalidraw-app/data/encryption.ts` | P2d | AES-GCM helpers — used by BYOK key storage (P6) and share-link encryption (P8) and collab room keys (P11). |
| `share-link.ts` | `excalidraw-app/data/index.ts` (compression helpers) | P2d | pako-gzip + base64 round-trip used by `share/url.ts` (P8). |

## What we deliberately don't vendor

- `app-jotai.ts` — we use Zustand.
- `collab/*` — we use Yjs + y-webrtc (P11) instead of their Socket.io collab.
- `firebase/*`, `*analytics*`, `*sentry*` — we don't have those backends.
- Their App.tsx wholesale — too much app-specific routing/concerns. We
  cherry-pick component patterns where useful and adapt to flexlayout.
