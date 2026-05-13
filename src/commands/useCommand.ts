// React hook that builds a CommandContext and exposes `runCommand(id)`.
// Commands themselves are framework-agnostic; this hook is the bridge
// between the registry and the React tree.

import { useCallback, useMemo } from 'react';
import { useStore } from '../state/store';
import { workspaceController } from '../workspace/useWorkspace';
import { getCommand, type Command, type CommandContext } from './commands';

export interface UseCommandResult {
  runCommand(id: string): Promise<void>;
  /** Build a CommandContext on demand — useful inside event handlers. */
  buildContext(): CommandContext;
}

export function useCommand(): UseCommandResult {
  // The workspace controller is module-scoped — it dispatches through
  // the imperative sidebar toggler that AppShell wires at mount.
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
      workspace: workspaceController,
    };
  }, []);

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
