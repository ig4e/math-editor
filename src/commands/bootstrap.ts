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
