// Bootstrap commands — the always-present "open this panel / reset / etc."
// commands every Phase 1+ user can run from Cmd+K. Later phases append
// their own commands to the same registry via their own register.ts
// side-effect imports (mirrored to `commands/index.ts`).

import { registerCommands, type Command } from './commands';
import { getAllPanels } from '../workspace/PanelRegistry';

const bootstrap: Command[] = [
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
