# Offline mode

Math Notebook is built **PWA-first**. After the first load you can fly the wifi off and keep working.

## What works fully offline

| Feature | Notes |
|---|---|
| All math editing & rendering | MathLive fonts are bundled into the app (not loaded from a CDN). |
| Solve / Simplify / system solve via compute-engine | local CAS — no network. |
| Step-by-step via mathsteps | lazy-loads on first use, then cached. |
| 2D graphing (JSXGraph) | lazy chunk, then cached. |
| 3D graphing (three.js + R3F) | lazy chunk, then cached. |
| Excalidraw canvas | engine + assets precached. |
| Variables panel, Inspector, Reference, Notes | static. |
| Save / load sheets, PDF / LaTeX / Markdown export | local. |
| Share-via-URL | the entire sheet is encoded in the URL hash — no server. |
| Pyodide + SymPy advanced solving | downloads ~10 MB on first use; cached forever after. |

## What needs the network

| Feature | Behavior offline |
|---|---|
| AI chat | shows an in-panel "you're offline" banner. The rest of the app still works. |
| Handwriting OCR | same — needs a vision LLM call. |
| Wolfram Alpha lookups | same — needs the edge-function proxy. |
| Realtime collab (Yjs y-webrtc) | works between peers on the same local network without internet; needs the public signaling server to find peers across the internet. |

## How the offline machinery works

### Service worker — `vite-plugin-pwa`

We use `vite-plugin-pwa` with the `injectManifest` strategy + a small custom service worker.

- **Precache** at install: every chunk in `dist/assets/`, the index HTML, the manifest, MathLive's WOFF2 fonts, Excalidraw's CSS, JSXGraph's bundled CSS, the favicon set.
- **Runtime cache (cache-first)** for any same-origin asset that lands later (e.g. lazy chunks the first time you open the Graph panel).
- **Stale-while-revalidate** for the index HTML in production.

### State storage — IndexedDB

Zustand's persist middleware writes to **IndexedDB** via a thin `idb-keyval` adapter, not `localStorage`. Sheets and Excalidraw scenes can be megabytes without blowing the 5 MB localStorage cap.

Key: `math-notebook:v1`. Migrations are not used yet — when we bump the schema we either keep it back-compatible or bump the key (with a one-time "we changed something fundamental" notice).

### Big lazy assets — Pyodide

Pyodide is ~10 MB. We load it on first use of any feature that needs SymPy (e.g. step-by-step integration, symbolic linear-algebra steps). The first load shows a toast: "Downloading Python… (10 MB, cached after)". Subsequent loads come from IndexedDB instantly.

The Pyodide loader (`solvers/pyodide/loader.ts`) writes the tarball to IDB and rehydrates it on next startup. If IDB is wiped, the next load re-fetches.

### Install prompt

A tasteful "Install Math Notebook" banner appears once when the browser's `beforeinstallprompt` event fires. It's dismissible and can be re-summoned from **Settings → Appearance → Install app**.

iOS / Safari doesn't fire `beforeinstallprompt`; instead, the banner offers instructions to add the app to the home screen via the Share menu.

## Diagnosing offline issues

If something that should work offline isn't:

1. **Settings → Storage** shows the current workspace size and an **Inspect cache** button — it lists which assets the service worker has cached.
2. **Hard reload** while online once: occasionally the precache misses a renamed chunk after a deploy. The reload re-precaches.
3. **Reset service worker** in the same Storage section unregisters the SW and clears its caches; next reload re-installs.

## What we explicitly don't do offline

- **AI fallback to a smaller local model.** Even a small LLM is hundreds of MB; we'd rather you bring a key and degrade explicitly when offline than ship a model.
- **Cloud sync.** All persistence is local + Yjs peer-to-peer. Cross-device sync is on the long-term roadmap; until then, use the share-link round trip or the **Export workspace** zip.
