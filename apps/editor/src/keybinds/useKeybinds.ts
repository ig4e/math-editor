// Keybind runtime — binds every command's resolved combo via tinykeys.
// Re-mounts when the resolved map changes (so a user-edited binding
// takes effect instantly without a reload).
//
// Tinykeys uses platform-aware `$mod` syntax natively — Cmd on Mac,
// Ctrl elsewhere. No further normalization needed.

import { useEffect } from 'react';
import { tinykeys } from 'tinykeys';
import { useStore } from '../state/store';
import { subscribeCommands } from '../commands/commands';
import { resolveBindings, STATIC_BINDS } from './defaults';
import { useCommand } from '../commands/useCommand';

/** Mount once at the workspace root. */
export function useKeybinds(): void {
  const { runCommand } = useCommand();
  const overrides = useStore((s) => s.keybindOverrides);

  useEffect(() => {
    // Recompute bindings whenever overrides OR the command registry change.
    let unbind: (() => void) | null = null;

    const apply = () => {
      unbind?.();
      const resolved = resolveBindings(overrides);

      // Build the tinykeys bindings dictionary: combo → handler.
      const dict: Record<string, (e: KeyboardEvent) => void> = {};
      for (const [cmdId, combo] of resolved) {
        // Tinykeys treats the literal combo string as a key — last-write-wins
        // on conflicts (the editor surfaces those with a warning).
        dict[combo] = (e) => {
          e.preventDefault();
          void runCommand(cmdId);
        };
      }
      for (const [combo, cmdId] of Object.entries(STATIC_BINDS)) {
        dict[combo] = (e) => {
          e.preventDefault();
          void runCommand(cmdId);
        };
      }

      unbind = tinykeys(window, dict);
    };

    apply();
    const unsub = subscribeCommands(apply);

    return () => {
      unbind?.();
      unsub();
    };
  }, [overrides, runCommand]);
}
