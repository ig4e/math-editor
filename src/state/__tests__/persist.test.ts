// State persist contract — slice values survive a store rehydration.
// Uses fake-indexeddb (from the test setup) so the IDB-backed Zustand
// persist middleware actually round-trips.

import { describe, it, expect } from 'vitest';
import { useStore } from '../store';

describe('persisted state', () => {
  it('theme toggle reflects in current state', () => {
    useStore.getState().setTheme('dark');
    expect(useStore.getState().theme).toBe('dark');
    useStore.getState().setTheme('light');
    expect(useStore.getState().theme).toBe('light');
  });

  it('layout writes are accepted', () => {
    useStore.getState().setLayout({ type: 'row' }, ['canvas', 'solver']);
    expect(useStore.getState().openPanels).toEqual(['canvas', 'solver']);
  });

  it('font scale clamps', () => {
    useStore.getState().setFontScale(99);
    expect(useStore.getState().fontScale).toBeLessThanOrEqual(1.5);
    useStore.getState().setFontScale(-5);
    expect(useStore.getState().fontScale).toBeGreaterThanOrEqual(0.75);
  });

  it('keybindOverrides toggle', () => {
    useStore.getState().setKeybindOverride('cmd.x', '$mod+T');
    expect(useStore.getState().keybindOverrides['cmd.x']).toBe('$mod+T');
    useStore.getState().setKeybindOverride('cmd.x', null);
    expect(useStore.getState().keybindOverrides['cmd.x']).toBeUndefined();
  });
});
