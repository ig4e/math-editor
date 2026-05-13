// Command registry contract — registering a command makes it findable;
// re-registration overwrites; subscribers fire on every change.

import { describe, it, expect, vi } from 'vitest';
import {
  registerCommand, registerCommands, getCommand, getAllCommands,
  subscribeCommands, __resetCommandRegistry,
  type CommandContext,
} from '../commands';

function makeCtx(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    getState: () => ({} as never),
    selectedMathBlockCount: 0,
    workspace: {
      openPanel: () => {},
      closePanel: () => {},
      focusPanel: () => {},
      resetLayout: () => {},
    },
    ...overrides,
  };
}

describe('Command registry', () => {
  it('registers and retrieves a command', () => {
    __resetCommandRegistry();
    const run = vi.fn();
    registerCommand({
      id: 'test.cmd',
      label: 'Test',
      category: 'View',
      run,
    });
    expect(getCommand('test.cmd')?.label).toBe('Test');
  });

  it('registerCommands batches', () => {
    __resetCommandRegistry();
    registerCommands([
      { id: 'a', label: 'A', category: 'View', run: () => {} },
      { id: 'b', label: 'B', category: 'View', run: () => {} },
    ]);
    expect(getAllCommands().map((c) => c.id).sort()).toEqual(['a', 'b']);
  });

  it('fires subscribers on registration', () => {
    __resetCommandRegistry();
    const cb = vi.fn();
    const unsub = subscribeCommands(cb);
    registerCommand({ id: 'x', label: 'X', category: 'View', run: () => {} });
    expect(cb).toHaveBeenCalled();
    unsub();
  });

  it('honors when() predicates', () => {
    __resetCommandRegistry();
    const run = vi.fn();
    registerCommand({
      id: 'g',
      label: 'Guarded',
      category: 'View',
      when: (ctx) => ctx.selectedMathBlockCount >= 2,
      run,
    });
    const cmd = getCommand('g')!;
    const allow = makeCtx({ selectedMathBlockCount: 3 });
    const deny = makeCtx({ selectedMathBlockCount: 1 });
    expect(cmd.when?.(allow)).toBe(true);
    expect(cmd.when?.(deny)).toBe(false);
  });
});
