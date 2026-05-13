// React hook that builds a CommandContext and exposes `runCommand(id)`.
// Commands themselves are framework-agnostic; this hook is the bridge
// between the registry and the React tree.

import { useCallback, useMemo } from 'react';
import { useStore } from '../state/store';
import { getCommand, type Command, type CommandContext } from './commands';

export interface UseCommandResult {
  runCommand(id: string): Promise<void>;
  /** Build a CommandContext on demand — useful inside event handlers. */
  buildContext(): CommandContext;
}

export function useCommand(): UseCommandResult {
  // We grab refs to store actions through getState() each call so we don't
  // re-subscribe on every store change. selectedMathBlockCount, on the other
  // hand, IS a value the registry's `when` predicates care about — read it
  // off state when building the context.
  const openPanel  = useStore((s) => s.openPanel);
  const closePanel = useStore((s) => s.closePanel);
  const focusPanel = useStore((s) => s.focusPanel);
  const resetLayout = useStore((s) => s.resetLayout);

  const buildContext = useCallback((): CommandContext => {
    const state = useStore.getState();
    const selectedMathBlockCount = state.selectedIds.filter((id) => {
      const sheet = state.sheets[state.activeSheetId];
      if (!sheet) return false;
      return sheet.blocks.some((b) => b.id === id && b.type === 'math');
    }).length;

    return {
      getState: () => useStore.getState(),
      selectedMathBlockCount,
      workspace: {
        openPanel,
        closePanel,
        focusPanel,
        resetLayout,
      },
    };
  }, [openPanel, closePanel, focusPanel, resetLayout]);

  const runCommand = useCallback(
    async (id: string) => {
      const cmd = getCommand(id);
      if (!cmd) {
        console.warn(`[command] unknown id "${id}"`);
        return;
      }
      const ctx = buildContext();
      if (cmd.when && !cmd.when(ctx)) {
        console.info(`[command] "${id}" guarded by when()`);
        return;
      }
      try {
        await cmd.run(ctx);
      } catch (err) {
        console.error(`[command] "${id}" threw`, err);
        useStore.getState().toast(`Command failed: ${cmd.label}`, 'error');
      }
    },
    [buildContext],
  );

  return useMemo(() => ({ runCommand, buildContext }), [runCommand, buildContext]);
}

/** Re-export so consumers can introspect the registry through one import. */
export type { Command, CommandContext };
