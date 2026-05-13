// MathLive bundles its fonts at `mathlive/fonts/`, but Vite doesn't copy
// them into the build output. Pointing fontsDirectory at jsdelivr's CDN
// avoids any build-config gymnastics and always matches the installed
// version (pinned via the URL).
import { MathfieldElement } from 'mathlive';
MathfieldElement.fontsDirectory = 'https://cdn.jsdelivr.net/npm/mathlive@0.105.3/fonts';
// No need for keypress sounds — disable so we don't 404 on those too.
MathfieldElement.soundsDirectory = null;

// Side-effect import: registers the <math-field> custom element.
import 'mathlive';

import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { setupPWA } from './pwa';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');
createRoot(root).render(<App />);

// Service-worker registration is a no-op in dev (see src/pwa.ts).
setupPWA();
