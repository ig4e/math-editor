// Reflects the persisted theme onto <html data-theme=…>. The inline
// pre-paint script in index.html sets the initial value to avoid a flash;
// this hook keeps it updated when the user toggles.

import { useEffect } from 'react';
import { useStore } from '../state/store';

export function useThemeSync() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
}
