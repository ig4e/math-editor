import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'canvas',
  title: 'Canvas',
  icon: 'cursor',
  component: lazyPanel(() => import('./CanvasPanel')),
  defaultLocation: 'center',
  description: 'Drawings, math blocks, diagrams.',
  stub: true,
});
