// Barrel export for every primitive in the design system. Single import
// from anywhere in the app: `import { Button, Card } from '@/common'`.

export { Button } from './Button';
export type { ButtonVariant, ButtonSize } from './Button';
export { IconButton } from './IconButton';
export type { IconButtonSize } from './IconButton';
export { Input } from './Input';
export { Select } from './Select';
export type { SelectItem } from './Select';
export { Switch } from './Switch';
export { Slider } from './Slider';
export { Tabs } from './Tabs';
export type { TabItem } from './Tabs';
export { Dialog } from './Dialog';
export { Sheet } from './Sheet';
export { Card } from './Card';
export { Field } from './Field';
export { EmptyState } from './EmptyState';
export { Banner } from './Banner';
export type { BannerKind } from './Banner';
export { SkeletonRow, SkeletonCard, Spinner } from './Skeleton';
export { PanelHeader, PanelRibbon, PanelStatus } from './PanelHeader';
export { Kbd } from './Kbd';
export { Tooltip, TooltipProvider } from './Tooltip';

// Excalidraw re-exports — use these in panel code when you want
// pixel-for-pixel parity with the canvas's own chrome.
export {
  XButton, XSidebar, XFooter, XMainMenu, XWelcomeScreen,
  XLiveCollaborationTrigger, XStats,
} from './excalidraw';
