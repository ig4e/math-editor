// App is dark-only. We still set the data-theme attribute on <html> so
// third-party components (Excalidraw, Tailwind's dark: variant) flip to
// their dark presentation.

import { useEffect } from 'react';

export function useThemeSync() {
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark';
  }, []);
}
