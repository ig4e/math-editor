// Bootstrap commands — the always-present "open this panel / reset / etc."
// commands every Phase 1+ user can run from Cmd+K. Later phases append
// their own commands to the same registry via their own register.ts
// side-effect imports (mirrored to `commands/index.ts`).

import { registerCommands, type Command } from './commands';
import { getAllPanels } from '../workspace/PanelRegistry';
import { solve } from '../solvers';
import '../solvers/all';
import { detectAll } from '../panels/variables/parser';
import type { MathBlock } from '../state/types';

const bootstrap: Command[] = [
  // ---------- Math ----------
  {
    id: 'math.solve',
    label: 'Solve selected',
    category: 'Math',
    icon: 'eval',
    defaultShortcut: '$mod+Enter',
    when: (ctx) => ctx.selectedMathBlockCount >= 1,
    run: async (ctx) => {
      const state = ctx.getState();
      const sheet = state.sheets[state.activeSheetId];
      if (!sheet) return;
      const selectedBlocks = state.selectedIds
        .map((id) => sheet.blocks.find((b) => b.id === id))
        .filter((b): b is MathBlock => !!b && b.type === 'math');
      if (selectedBlocks.length === 0) {
        state.toast('Select a math block first', 'warn');
        return;
      }
      const firstSel = selectedBlocks[0];
      if (!firstSel) return;
      const variables = Object.fromEntries(
        detectAll(sheet.blocks.filter((b): b is MathBlock => b.type === 'math'))
          .map((d) => [d.name, d.value]),
      );
      ctx.workspace.openPanel('solver');
      const r = await solve(
        { source: firstSel.latex, capability: 'solve', variables },
        { requireSteps: state.showSteps },
      );
      if (r.ok && r.latex) {
        state.toast(`${firstSel.latex} → ${r.latex}`, 'success');
      } else {
        state.toast(r.error ?? 'Solve failed', 'error');
      }
    },
  },
  {
    id: 'math.simplify',
    label: 'Simplify selected',
    category: 'Math',
    icon: 'fx',
    defaultShortcut: '$mod+Shift+S',
    when: (ctx) => ctx.selectedMathBlockCount >= 1,
    run: (ctx) => { ctx.workspace.openPanel('solver'); },
  },
  {
    id: 'math.solveSystem',
    label: 'Solve as system',
    category: 'Math',
    icon: 'link',
    defaultShortcut: '$mod+Shift+Enter',
    when: (ctx) => ctx.selectedMathBlockCount >= 2,
    run: (ctx) => { ctx.workspace.openPanel('solver'); },
  },
  {
    id: 'prefs.toggleSteps',
    label: 'Toggle step-by-step',
    category: 'Math',
    icon: 'steps',
    run: (ctx) => {
      const s = ctx.getState();
      s.setShowSteps(!s.showSteps);
      s.toast(`Step-by-step ${!s.showSteps ? 'on' : 'off'}`, 'info');
    },
  },

  // ---------- View ----------
  {
    id: 'view.commandPalette',
    label: 'Show command palette',
    category: 'View',
    icon: 'search',
    defaultShortcut: '$mod+K',
    // The palette itself listens for this binding directly via its open
    // state; we still register it so it appears in the keybind editor.
    run: () => { /* handled by CommandPalette open-state subscription */ },
  },
  {
    id: 'view.resetLayout',
    label: 'Reset workspace layout',
    category: 'View',
    icon: 'layout',
    defaultShortcut: '$mod+Alt+0',
    run: (ctx) => {
      ctx.workspace.resetLayout();
      ctx.getState().toast('Layout reset to default', 'info');
    },
  },
  {
    id: 'view.toggleTheme',
    label: 'Toggle theme',
    category: 'View',
    icon: 'sun',
    defaultShortcut: '$mod+Shift+T',
    run: (ctx) => {
      const s = ctx.getState();
      s.setTheme(s.theme === 'dark' ? 'light' : 'dark');
    },
  },

  // ---------- File ----------
  {
    id: 'file.newSheet',
    label: 'New sheet',
    category: 'File',
    icon: 'plus',
    defaultShortcut: '$mod+Alt+N',
    run: (ctx) => {
      ctx.getState().addSheet();
    },
  },
  {
    id: 'file.nextSheet',
    label: 'Next sheet',
    category: 'File',
    defaultShortcut: '$mod+]',
    run: (ctx) => {
      const s = ctx.getState();
      const idx = s.sheetOrder.indexOf(s.activeSheetId);
      const next = s.sheetOrder[(idx + 1) % s.sheetOrder.length];
      if (next) s.setActiveSheet(next);
    },
  },
  {
    id: 'file.previousSheet',
    label: 'Previous sheet',
    category: 'File',
    defaultShortcut: '$mod+[',
    run: (ctx) => {
      const s = ctx.getState();
      const idx = s.sheetOrder.indexOf(s.activeSheetId);
      const len = s.sheetOrder.length;
      const prev = s.sheetOrder[(idx - 1 + len) % len];
      if (prev) s.setActiveSheet(prev);
    },
  },
  {
    id: 'file.copyShareLink',
    label: 'Copy share link (active sheet)',
    category: 'File',
    icon: 'link',
    defaultShortcut: '$mod+Shift+C',
    run: async (ctx) => {
      const { encodeActiveSheet, buildShareURL } = await import('../share/url');
      const url = buildShareURL(encodeActiveSheet());
      try {
        await navigator.clipboard.writeText(url);
        ctx.getState().toast('Share link copied', 'success');
      } catch {
        ctx.getState().toast(`Share link: ${url.slice(0, 80)}…`, 'info');
      }
    },
  },
  {
    id: 'file.copyWorkspaceShareLink',
    label: 'Copy share link (whole workspace)',
    category: 'File',
    icon: 'link',
    run: async (ctx) => {
      const { encodeWorkspace, buildShareURL } = await import('../share/url');
      const url = buildShareURL(encodeWorkspace());
      try {
        await navigator.clipboard.writeText(url);
        ctx.getState().toast('Workspace link copied', 'success');
      } catch {
        ctx.getState().toast(`Link: ${url.slice(0, 80)}…`, 'info');
      }
    },
  },
  {
    id: 'file.exportMarkdown',
    label: 'Export sheet as Markdown',
    category: 'File',
    icon: 'note',
    run: async (ctx) => {
      const s = ctx.getState();
      const sheet = s.sheets[s.activeSheetId];
      if (!sheet) return;
      const { sheetToMarkdown } = await import('../share/markdown');
      const { downloadBlob } = await import('../share/pdf');
      const blob = new Blob([sheetToMarkdown(sheet)], { type: 'text/markdown' });
      downloadBlob(blob, `${sanitize(sheet.name)}.md`);
      s.toast('Markdown exported', 'success');
    },
  },
  {
    id: 'file.exportLatex',
    label: 'Export sheet as LaTeX',
    category: 'File',
    icon: 'fx',
    run: async (ctx) => {
      const s = ctx.getState();
      const sheet = s.sheets[s.activeSheetId];
      if (!sheet) return;
      const { sheetToLatex } = await import('../share/latex');
      const { downloadBlob } = await import('../share/pdf');
      const blob = new Blob([sheetToLatex(sheet)], { type: 'application/x-tex' });
      downloadBlob(blob, `${sanitize(sheet.name)}.tex`);
      s.toast('LaTeX exported', 'success');
    },
  },
  {
    id: 'file.exportPDF',
    label: 'Export sheet as PDF',
    category: 'File',
    icon: 'download',
    defaultShortcut: '$mod+Shift+E',
    run: async (ctx) => {
      const s = ctx.getState();
      const sheet = s.sheets[s.activeSheetId];
      if (!sheet) return;
      s.toast('Generating PDF…', 'info');
      const { sheetToPDF, downloadBlob } = await import('../share/pdf');
      const blob = await sheetToPDF(sheet);
      downloadBlob(blob, `${sanitize(sheet.name)}.pdf`);
      s.toast('PDF exported', 'success');
    },
  },
  {
    id: 'collab.startSession',
    label: 'Start collab session',
    category: 'View',
    icon: 'link',
    run: async (ctx) => {
      const { startCollab, generateRoomId, buildRoomURL } = await import('../collab/session');
      const roomId = generateRoomId();
      startCollab({
        roomId,
        user: {
          name: prompt('Your name?') ?? 'Anonymous',
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`,
        },
      });
      const url = buildRoomURL(roomId);
      try {
        await navigator.clipboard.writeText(url);
        ctx.getState().toast('Room link copied — share it', 'success');
      } catch {
        ctx.getState().toast(`Room: ${url}`, 'info');
      }
    },
  },
  {
    id: 'collab.endSession',
    label: 'End collab session',
    category: 'View',
    icon: 'close',
    run: async (ctx) => {
      const { destroyCollab } = await import('../collab/session');
      destroyCollab();
      ctx.getState().toast('Collab session ended', 'info');
    },
  },
  {
    id: 'math.ocrSelection',
    label: 'Convert sketched selection to math',
    category: 'Math',
    icon: 'wand',
    defaultShortcut: '$mod+Shift+M',
    run: async (ctx) => {
      const s = ctx.getState();
      const { getExcalidrawAPI } = await import('../panels/canvas/inject');
      const api = getExcalidrawAPI();
      if (!api) { s.toast('Canvas not ready', 'warn'); return; }
      s.toast('Reading selection…', 'info');
      const { snapshotSelection } = await import('../panels/canvas/snapshotSelection');
      const snap = await snapshotSelection(api);
      if (!snap) { s.toast('Select something to convert first', 'warn'); return; }
      const { transcribeImageToLatex } = await import('../ai/ocr');
      const result = await transcribeImageToLatex(snap.dataURL);
      if (!result.ok || !result.latex) {
        s.toast(result.reason ?? 'OCR failed', 'error');
        return;
      }
      s.addMathBlock({ x: 220, y: 220, latex: result.latex });
      s.toast(`Converted via ${result.via ?? 'AI'}`, 'success');
    },
  },
  {
    id: 'math.openInWolfram',
    label: 'Open selection in Wolfram Alpha',
    category: 'Math',
    icon: 'sparkles',
    when: (ctx) => ctx.selectedMathBlockCount >= 1,
    run: (ctx) => {
      const state = ctx.getState();
      const sheet = state.sheets[state.activeSheetId];
      if (!sheet) return;
      const block = state.selectedIds
        .map((id) => sheet.blocks.find((b) => b.id === id))
        .find((b) => b?.type === 'math');
      if (!block || block.type !== 'math') return;
      const stripped = block.latex.replace(/\\/g, '').trim();
      window.open(`https://www.wolframalpha.com/input?i=${encodeURIComponent(stripped)}`, '_blank', 'noopener');
    },
  },
  {
    id: 'file.exportWorkspace',
    label: 'Export workspace (JSON)',
    category: 'File',
    icon: 'download',
    run: async (ctx) => {
      const s = ctx.getState();
      const payload = JSON.stringify({
        v: 1,
        sheets: s.sheets,
        sheetOrder: s.sheetOrder,
        activeSheetId: s.activeSheetId,
      }, null, 2);
      const { downloadBlob } = await import('../share/pdf');
      downloadBlob(new Blob([payload], { type: 'application/json' }), 'math-notebook.json');
      s.toast('Workspace exported', 'success');
    },
  },

  // ---------- Help ----------
  {
    id: 'help.tour',
    label: 'Take the tour',
    category: 'Help',
    icon: 'sparkles',
    run: async () => {
      const { openTour } = await import('../onboarding/Tour');
      openTour();
    },
  },
  {
    id: 'help.keybindings',
    label: 'Show keyboard shortcuts',
    category: 'Help',
    icon: 'keyboard',
    defaultShortcut: '$mod+/',
    run: (ctx) => {
      ctx.workspace.openPanel('settings');
      // The settings panel reads `?section=keybinds` from the URL hash on
      // mount — easiest cross-panel coupling without a dedicated bus.
      if (typeof window !== 'undefined') {
        window.location.hash = 'keybinds';
      }
    },
  },
  {
    id: 'help.resetCache',
    label: 'Reset app cache (force-reload from server)',
    description: 'Unregisters the service worker, deletes every cache, and reloads. Use this if the app shows a stale screen after a deploy.',
    category: 'Help',
    icon: 'refresh',
    run: async (ctx) => {
      const { askConfirm } = await import('../components/ConfirmDialog');
      const ok = await askConfirm({
        title: 'Reset app cache?',
        message: 'Unregisters the service worker, deletes every cache, and reloads the page from the server. Your sheets are saved in IndexedDB and will not be affected.',
        confirmLabel: 'Reset and reload',
      });
      if (!ok) return;
      const { resetServiceWorkerAndCaches } = await import('../pwa');
      ctx.getState().toast('Clearing cache…', 'info');
      await resetServiceWorkerAndCaches();
    },
  },
  {
    id: 'file.exportSVG',
    label: 'Export sheet as SVG',
    description: 'Saves the whole canvas (math blocks + drawings) as a single vector SVG file.',
    category: 'File',
    icon: 'download',
    run: async (ctx) => {
      const { getExcalidrawAPI } = await import('../panels/canvas/inject');
      const api = getExcalidrawAPI();
      if (!api) { ctx.getState().toast('Canvas not ready', 'warn'); return; }
      const { exportToSvg } = await import('@excalidraw/excalidraw');
      const { renderBlockToSvg } = await import('../panels/canvas/blockToSvg');
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();
      const svg = await exportToSvg({
        elements,
        appState: { ...appState, exportBackground: true, exportWithDarkMode: true, exportEmbedScene: false },
        files,
        renderEmbeddables: false,
        // Render math + text-block content (MathML for math, plain
        // text for text-block) inside each block's framed rect. The
        // resulting SVG is self-contained — no KaTeX CSS / fonts
        // needed.
        renderBlockToSvg,
      });
      const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
      const { downloadBlob } = await import('../share/pdf');
      const s = ctx.getState();
      const sheet = s.sheets[s.activeSheetId];
      downloadBlob(blob, `${sanitize(sheet?.name ?? 'sheet')}.svg`);
      s.toast('SVG exported', 'success');
    },
  },
  {
    id: 'file.exportPNG',
    label: 'Export sheet as PNG',
    description: 'Rasterises the whole canvas (math blocks + drawings) as a high-resolution PNG.',
    category: 'File',
    icon: 'image',
    run: async (ctx) => {
      const { getExcalidrawAPI } = await import('../panels/canvas/inject');
      const api = getExcalidrawAPI();
      if (!api) { ctx.getState().toast('Canvas not ready', 'warn'); return; }
      const { exportToBlob } = await import('@excalidraw/excalidraw');
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();
      const blob = await exportToBlob({
        elements,
        appState: { ...appState, exportBackground: true, exportWithDarkMode: true, exportEmbedScene: false },
        files,
        mimeType: 'image/png',
        quality: 1,
      });
      const { downloadBlob } = await import('../share/pdf');
      const s = ctx.getState();
      const sheet = s.sheets[s.activeSheetId];
      downloadBlob(blob, `${sanitize(sheet?.name ?? 'sheet')}.png`);
      s.toast('PNG exported', 'success');
    },
  },
];

/**
 * Builds dynamic "Open <Panel>" commands from every registered panel.
 * Called once on workspace mount + on any registry change.
 */
export function syncPanelOpenCommands(): void {
  const dynamic: Command[] = getAllPanels().map((panel) => ({
    id: `view.open.${panel.id}`,
    label: `Open ${panel.title}`,
    description: panel.description,
    category: 'View',
    icon: panel.icon,
    run: (ctx) => {
      ctx.workspace.openPanel(panel.id);
      ctx.workspace.focusPanel(panel.id);
    },
  }));
  registerCommands(dynamic);
}

export function registerBootstrapCommands(): void {
  registerCommands(bootstrap);
  syncPanelOpenCommands();
}

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'untitled';
}
