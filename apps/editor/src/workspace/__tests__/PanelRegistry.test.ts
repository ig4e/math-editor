// Panel registry contract — registering a panel makes it findable and
// notifies subscribers. The foundation gate from /docs/verification.md.

import { describe, it, expect, vi } from 'vitest';
import { lazy } from 'react';
import {
  registerPanel, getPanel, getAllPanels, subscribePanels,
  __resetPanelRegistry,
} from '../PanelRegistry';

describe('PanelRegistry', () => {
  it('stores and retrieves a panel by id', () => {
    __resetPanelRegistry();
    registerPanel({
      id: 'test-panel',
      title: 'Test',
      icon: 'cursor',
      component: lazy(async () => ({ default: () => null })),
    });
    const found = getPanel('test-panel');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Test');
  });

  it('lists every registered panel', () => {
    __resetPanelRegistry();
    registerPanel({
      id: 'a', title: 'A', icon: 'cursor',
      component: lazy(async () => ({ default: () => null })),
    });
    registerPanel({
      id: 'b', title: 'B', icon: 'cursor',
      component: lazy(async () => ({ default: () => null })),
    });
    expect(getAllPanels().map((p) => p.id).sort()).toEqual(['a', 'b']);
  });

  it('re-registration overwrites (idempotent for HMR)', () => {
    __resetPanelRegistry();
    registerPanel({
      id: 'p', title: 'First', icon: 'cursor',
      component: lazy(async () => ({ default: () => null })),
    });
    registerPanel({
      id: 'p', title: 'Second', icon: 'cursor',
      component: lazy(async () => ({ default: () => null })),
    });
    expect(getPanel('p')?.title).toBe('Second');
    expect(getAllPanels().length).toBe(1);
  });

  it('notifies subscribers on every registration', () => {
    __resetPanelRegistry();
    const cb = vi.fn();
    const unsub = subscribePanels(cb);
    registerPanel({
      id: 'x', title: 'X', icon: 'cursor',
      component: lazy(async () => ({ default: () => null })),
    });
    expect(cb).toHaveBeenCalled();
    unsub();
  });
});
