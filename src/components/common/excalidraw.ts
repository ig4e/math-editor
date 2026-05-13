// Re-exports of Excalidraw's first-party UI primitives so panel code
// can use them directly with the same styling Excalidraw uses for its
// own chrome. Mirroring the canvas's design language inside the side
// panels is the cheapest way to make the whole app feel cohesive.
//
// Import these alongside (or instead of) our common/Button etc. when
// you want pixel-for-pixel parity with Excalidraw's UI — e.g. a
// "ghost" icon button next to Excalidraw's own zoom controls.
//
// Excalidraw's Button uses `onSelect` instead of `onClick`. The rest
// of the ButtonHTMLAttributes are forwarded.

export {
  Button as XButton,
  Sidebar as XSidebar,
  Footer as XFooter,
  MainMenu as XMainMenu,
  WelcomeScreen as XWelcomeScreen,
  LiveCollaborationTrigger as XLiveCollaborationTrigger,
  Stats as XStats,
} from '@excalidraw/excalidraw';
