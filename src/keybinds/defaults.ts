// Default keybindings. tinykeys syntax — `$mod` resolves to Cmd on Mac
// and Ctrl elsewhere automatically. Maps command IDs to combo strings.
//
// Users override individual bindings via Settings → Keybinds; overrides
// are stored in `keysSlice.keybindOverrides` and overlaid on this table
// at resolution time (see keybinds/useKeybinds.ts).
//
// Adding a keybind: declare it on the Command record itself
// (`defaultShortcut: '$mod+G'`). This file becomes the union of every
// command's `defaultShortcut` field at registry-build time. To force a
// bind without owning a command (rare — Excalidraw-native shortcuts),
// add it to STATIC_BINDS below.

import { getAllCommands } from '../commands/commands';

/**
 * Bindings that aren't tied to a Command in our registry (yet) —
 * panel-internal shortcuts, Excalidraw escape hatches, etc.
 *
 * Format: { 'combo': 'commandId' | (() => void) }
 * Currently empty; populated as later phases ship.
 */
export const STATIC_BINDS: Record<string, string> = {};

/** Resolve defaults + overrides into the final combo map. */
export function resolveBindings(
  overrides: Record<string, string>,
): Map<string, string> {
  // commandId → combo
  const out = new Map<string, string>();

  for (const cmd of getAllCommands()) {
    if (cmd.defaultShortcut) out.set(cmd.id, cmd.defaultShortcut);
  }
  for (const [cmdId, combo] of Object.entries(overrides)) {
    out.set(cmdId, combo);
  }
  return out;
}

/** Inverse — for conflict detection in the keybind editor. */
export function findConflicts(
  bindings: Map<string, string>,
): Map<string, string[]> {
  const byCombo = new Map<string, string[]>();
  for (const [cmdId, combo] of bindings) {
    const arr = byCombo.get(combo) ?? [];
    arr.push(cmdId);
    byCombo.set(combo, arr);
  }
  const conflicts = new Map<string, string[]>();
  for (const [combo, ids] of byCombo) {
    if (ids.length > 1) conflicts.set(combo, ids);
  }
  return conflicts;
}

/** Pretty-print a tinykeys combo for the UI ("$mod+Enter" → "⌘ Enter"). */
export function formatCombo(combo: string): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  return combo
    .split('+')
    .map((part) => {
      switch (part) {
        case '$mod': return isMac ? '⌘' : 'Ctrl';
        case 'Control': return isMac ? '⌃' : 'Ctrl';
        case 'Meta': return isMac ? '⌘' : 'Win';
        case 'Shift': return '⇧';
        case 'Alt': return isMac ? '⌥' : 'Alt';
        case 'ArrowUp': return '↑';
        case 'ArrowDown': return '↓';
        case 'ArrowLeft': return '←';
        case 'ArrowRight': return '→';
        case ' ': return 'Space';
        default: return part;
      }
    })
    .join(isMac ? ' ' : '+');
}
