// Vitest setup — runs before each test file. Wires up the in-memory
// IndexedDB shim, polyfills DOM API gaps in jsdom, resets registries
// between tests.

import 'fake-indexeddb/auto';

// Reset every registry between test files so test order doesn't leak.
import { afterEach } from 'vitest';
import { __resetPanelRegistry } from '../workspace/PanelRegistry';
import { __resetCommandRegistry } from '../commands/commands';

afterEach(() => {
  __resetPanelRegistry();
  __resetCommandRegistry();
});

// jsdom doesn't ship matchMedia; useThemeSync queries it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
