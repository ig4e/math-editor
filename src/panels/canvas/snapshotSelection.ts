// Render the user's currently-selected Excalidraw elements as a PNG
// data URL. Used by OCR (P12) and the AI "Ask about selection" tool.
//
// Excalidraw ships `exportToCanvas` — we call it with just the selected
// elements + the scene's appState/files, then read the canvas back as a
// PNG dataURL.

import { exportToCanvas } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

export interface SelectionSnapshot {
  dataURL: string;
  width: number;
  height: number;
  selectedIds: readonly string[];
}

export async function snapshotSelection(api: ExcalidrawImperativeAPI): Promise<SelectionSnapshot | null> {
  const elements = api.getSceneElements();
  const appState = api.getAppState();
  const selectedIds = Object.keys(appState.selectedElementIds ?? {});
  if (selectedIds.length === 0) return null;
  const subset = elements.filter((el) => selectedIds.includes(el.id));
  if (subset.length === 0) return null;
  const files = api.getFiles();
  try {
    const canvas = await exportToCanvas({
      elements: subset,
      appState: { ...appState, exportBackground: true, viewBackgroundColor: '#ffffff' },
      files,
      maxWidthOrHeight: 1024,
    });
    return {
      dataURL: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
      selectedIds,
    };
  } catch (e) {
    console.warn('[ocr] export failed', e);
    return null;
  }
}
