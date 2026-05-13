// State persist contract — slice values survive a store rehydration.
// Uses fake-indexeddb (from the test setup) so the IDB-backed Zustand
// persist middleware actually round-trips.

import { describe, it, expect } from 'vitest';
import { useStore } from '../store';

describe('persisted state', () => {
  it('active sidebar tab is persisted', () => {
    useStore.getState().setActiveSidebarTab('solver');
    expect(useStore.getState().activeSidebarTab).toBe('solver');
    useStore.getState().resetLayout();
    expect(useStore.getState().activeSidebarTab).toBeNull();
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
