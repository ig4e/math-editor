import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'solver',
  title: 'Solver',
  icon: 'eval',
  component: lazyPanel(() => import('./SolverPanel')),
  defaultLocation: 'right',
  description: 'Step-by-step solve, simplify, system solve.',
  stub: true,
});
