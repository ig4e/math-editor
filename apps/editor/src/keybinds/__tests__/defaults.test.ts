// Keybind resolution contract — defaults + overrides → final map;
// conflicts surface; formatCombo respects platform.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerCommand, __resetCommandRegistry,
} from '../../commands/commands';
import { resolveBindings, findConflicts, formatCombo } from '../defaults';

beforeEach(() => {
  __resetCommandRegistry();
});

describe('keybind defaults', () => {
  it('emits one binding per command with a defaultShortcut', () => {
    registerCommand({ id: 'a', label: 'A', category: 'View', defaultShortcut: '$mod+K', run: () => {} });
    registerCommand({ id: 'b', label: 'B', category: 'View', defaultShortcut: '$mod+J', run: () => {} });
    registerCommand({ id: 'c', label: 'C', category: 'View', run: () => {} }); // no shortcut

    const map = resolveBindings({});
    expect(map.size).toBe(2);
    expect(map.get('a')).toBe('$mod+K');
    expect(map.get('b')).toBe('$mod+J');
  });

  it('overlays user overrides on top of defaults', () => {
    registerCommand({ id: 'cmd', label: 'Cmd', category: 'View', defaultShortcut: '$mod+K', run: () => {} });
    const map = resolveBindings({ cmd: '$mod+Shift+P' });
    expect(map.get('cmd')).toBe('$mod+Shift+P');
  });

  it('detects conflicting combos', () => {
    registerCommand({ id: 'a', label: 'A', category: 'View', defaultShortcut: '$mod+K', run: () => {} });
    registerCommand({ id: 'b', label: 'B', category: 'View', defaultShortcut: '$mod+K', run: () => {} });
    const conflicts = findConflicts(resolveBindings({}));
    expect(conflicts.get('$mod+K')?.sort()).toEqual(['a', 'b']);
  });

  it('formatCombo replaces $mod and modifier names', () => {
    const out = formatCombo('$mod+Shift+Enter');
    // We don't assert exact platform output (jsdom navigator may vary);
    // just assert $mod is substituted and Shift is symbolised.
    expect(out).not.toContain('$mod');
    expect(out).toMatch(/⇧|Shift/);
  });
});
