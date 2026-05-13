// MathLive's bundled woff2 fonts are emitted into `dist/fonts/` by the
// `mathliveFontsPlugin` in vite.config.ts. We point fontsDirectory at the
// served path so the app renders math offline. PWA precaches *.woff2.
import { MathfieldElement } from 'mathlive';
MathfieldElement.fontsDirectory = '/fonts';
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
