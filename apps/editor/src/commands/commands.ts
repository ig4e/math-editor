// Command registry — every keyboard-able / palette-able action in the app
// registers here as a `Command` record. Three readers consume this list:
//
//   1) commands/CommandPalette.tsx — cmdk-based searchable launcher
//   2) keybinds/useKeybinds.ts     — binds defaultShortcuts via tinykeys
//   3) panels/settings/Keybinds.tsx — table view + rebinder
//
// Commands register via side-effect imports rooted in
// `src/commands/index.ts`. Phase 1 ships the foundation commands
// (open panel, toggle theme, reset layout); later phases append theirs.

import type { IconName } from '../components/Icons';

export type CommandCategory = 'Math' | 'View' | 'File' | 'AI' | 'Help' | 'Edit';

export interface CommandContext {
  /** Lazy import of `state/store` to avoid a registry → store cycle. */
  getState(): import('../state/store').Store;

  /** Number of math blocks currently selected (used by `when` predicates). */
  selectedMathBlockCount: number;

  /** Workspace actions. Wired in workspace/useWorkspace.ts. */
  workspace: {
    openPanel(id: string): void;
    closePanel(id: string): void;
    focusPanel(id: string): void;
    resetLayout(): void;
  };
}

export interface Command {
  /** Stable ID — used in keybind overrides + command palette analytics. */
  id: string;

  /** Display label in the palette + keybind editor. */
  label: string;

  /** Optional one-line description; shown under the label in the palette. */
  description?: string;

  category: CommandCategory;

  /** From the shared icon set. Optional — palette will fall back to category. */
  icon?: IconName;

  /** Default shortcut in tinykeys syntax (`$mod` = Cmd on Mac, Ctrl elsewhere). */
  defaultShortcut?: string;

  /** Run the command. May be sync or async. */
  run(ctx: CommandContext): void | Promise<void>;

  /** Optional contextual predicate — return false to hide / disable. */
  when?(ctx: CommandContext): boolean;
}

const registry = new Map<string, Command>();
const listeners = new Set<() => void>();

export function registerCommand(cmd: Command): void {
  registry.set(cmd.id, cmd);
  for (const l of listeners) l();
}

export function registerCommands(cmds: readonly Command[]): void {
  for (const c of cmds) registry.set(c.id, c);
  for (const l of listeners) l();
}

export function getCommand(id: string): Command | undefined {
  return registry.get(id);
}

export function getAllCommands(): readonly Command[] {
  return [...registry.values()];
}

export function subscribeCommands(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function __resetCommandRegistry(): void {
  registry.clear();
  for (const l of listeners) l();
}
