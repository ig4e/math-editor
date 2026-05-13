import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'ai',
  title: 'AI chat',
  icon: 'sparkles',
  component: lazyPanel(() => import('./AIPanel')),
  defaultLocation: 'right',
  description: 'Chat with your AI provider; tools that drive the workspace.',
  stub: true,
});
