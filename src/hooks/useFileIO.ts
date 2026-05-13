// Save / Open / PNG / Clear actions. Open + PNG need DOM refs; everything
// else is store-driven.

import { useCallback, type RefObject } from 'react';
import { useStore } from '../state/store';
import { downloadJSON, exportElementToPng } from '../utils/export';

export interface FileIO {
  onSaveFile: () => void;
  onOpenFile: () => void;
  onFileChosen: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onExportPNG: () => Promise<void>;
  onClear: () => void;
}

export function useFileIO(
  viewportRef: RefObject<HTMLDivElement | null>,
  fileInputRef: RefObject<HTMLInputElement | null>,
): FileIO {
  const onSaveFile = useCallback(() => {
    const s = useStore.getState();
    downloadJSON(
      {
        sheets: s.sheets,
        sheetOrder: s.sheetOrder,
        activeSheetId: s.activeSheetId,
      },
      'workspace.mathsheet',
    );
    s.toast('Workspace saved', 'success');
  }, []);

  const onOpenFile = useCallback(() => fileInputRef.current?.click(), [fileInputRef]);

  // React 19 + modern File API — no FileReader callback boilerplate.
  const onFileChosen = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const json = JSON.parse(await f.text());
      useStore.getState().replaceFromJSON(json);
      useStore.getState().toast('Workspace loaded', 'success');
    } catch (err) {
      console.error(err);
      useStore.getState().toast('Invalid file', 'error');
    }
  }, []);

  const onExportPNG = useCallback(async () => {
    const el = viewportRef.current;
    if (!el) return;
    const s = useStore.getState();
    s.toast('Rendering PNG…', 'info');
    try {
      const bg = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-canvas').trim() || '#f4f4ef';
      await exportElementToPng(el, `${s.sheets[s.activeSheetId].name}.png`, {
        backgroundColor: bg,
      });
      s.toast('PNG exported', 'success');
    } catch (err) {
      console.error(err);
      s.toast('PNG export failed', 'error');
    }
  }, [viewportRef]);

  const onClear = useCallback(() => {
    if (!confirm('Clear this sheet?')) return;
    useStore.getState().clearActiveSheet();
  }, []);

  return { onSaveFile, onOpenFile, onFileChosen, onExportPNG, onClear };
}
