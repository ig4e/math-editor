// Global keyboard shortcuts. Ignores keys while the user is typing in
// a math-field, input, textarea, or contenteditable.

import { useEffect } from 'react';
import { useStore } from '../state/store';

interface Bindings {
  addMath: () => void;
  addText: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  help: () => void;
}

export function useKeyboardShortcuts(b: Bindings) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === 'math-field' || tag === 'input' || tag === 'textarea') return;
      if (t?.isContentEditable) return;

      const s = useStore.getState();
      switch (e.key) {
        case 'e': case 'E': b.addMath(); e.preventDefault(); break;
        case 't': case 'T': b.addText(); e.preventDefault(); break;
        case 'v': case 'V': s.setTool('move');   break;
        case 'p': case 'P': s.setTool('pen');    break;
        case 'x': case 'X': s.setTool('eraser'); break;
        case 'l': case 'L': s.setTool('link');   break;
        case '0':           s.resetView();       break;
        case '+': case '=': b.zoomIn();          break;
        case '-':           b.zoomOut();         break;
        case '?':           b.help();            break;
        case 'Delete':
        case 'Backspace':
          for (const id of s.selectedIds) s.deleteBlock(id);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [b]);
}
