// Side-effect import: registers the <math-field> custom element.
import 'mathlive';

import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');
createRoot(root).render(<App />);
