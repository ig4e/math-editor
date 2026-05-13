// Pyodide lazy loader. The first call triggers the heavy ~10 MB
// download — we show a toast so the user knows what's happening. The
// runtime caches itself in IndexedDB (Pyodide's own cache; we don't
// need to do anything extra to make subsequent loads instant).

import { useStore } from '../../state/store';

interface PyodideAPI {
  runPythonAsync(code: string): Promise<unknown>;
  loadPackage(name: string | string[]): Promise<void>;
  globals: { get(name: string): unknown };
}

let cached: PyodideAPI | null = null;
let inflight: Promise<PyodideAPI> | null = null;

export async function ensurePyodide(): Promise<PyodideAPI> {
  if (cached) return cached;
  if (inflight) return inflight;
  const toast = useStore.getState().toast;
  toast('Downloading Python kernel… (≈10 MB, cached after)', 'info');

  inflight = (async (): Promise<PyodideAPI> => {
    const mod = await import('pyodide');
    const py = await mod.loadPyodide({
      // Pyodide ships its own assets via this URL when no override is set.
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${mod.version}/full/`,
    });
    await py.loadPackage(['sympy']);
    cached = py as unknown as PyodideAPI;
    toast('Python ready', 'success');
    return cached;
  })().catch((e) => {
    inflight = null;
    toast(`Python kernel failed: ${(e as Error).message}`, 'error');
    throw e;
  });
  return inflight;
}

export function isPyodideReady(): boolean {
  return cached !== null;
}
