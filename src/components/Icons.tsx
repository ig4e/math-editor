// A single SVG sprite of feather-style icons. Components reference these
// via <Icon name="…" />. Stroke icons inherit currentColor.

export type IconName =
  | 'plus' | 'fx' | 'text' | 'cursor' | 'pen' | 'eraser'
  | 'highlight' | 'eval' | 'zoom-in' | 'zoom-out' | 'home'
  | 'download' | 'folder' | 'image' | 'trash' | 'note'
  | 'copy' | 'close' | 'sun' | 'moon' | 'check' | 'warn'
  | 'info' | 'x-square' | 'resize' | 'help'
  | 'wand' | 'link' | 'steps'
  // v2 additions
  | 'settings' | 'keyboard' | 'layout' | 'palette' | 'sparkles'
  | 'search' | 'menu' | 'expand' | 'chevron-down' | 'chevron-up'
  | 'chevron-left' | 'chevron-right' | 'graph' | 'cube' | 'brain'
  | 'matrix' | 'function' | 'book' | 'tag' | 'code' | 'circle'
  | 'square' | 'play' | 'pause' | 'stop' | 'refresh';

export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
        <symbol id="i-cursor" viewBox="0 0 24 24"><path d="M5 3l6 16 2.5-7L20 9.5z"/></symbol>
        <symbol id="i-pen" viewBox="0 0 24 24"><path d="M14.5 4.5l5 5-10 10H4.5v-5z"/><path d="M12.5 6.5l5 5"/></symbol>
        <symbol id="i-eraser" viewBox="0 0 24 24"><path d="M16 4l4 4-11 11H5v-4z"/><path d="M9 9l6 6"/></symbol>
        <symbol id="i-highlight" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M7 14h10" strokeWidth="3.5"/></symbol>
        <symbol id="i-zoom-in" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="M20 20l-4.5-4.5M7.5 10.5h6M10.5 7.5v6"/></symbol>
        <symbol id="i-zoom-out" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="M20 20l-4.5-4.5M7.5 10.5h6"/></symbol>
        <symbol id="i-home" viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></symbol>
        <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 4v12m-5-5l5 5 5-5M4 20h16"/></symbol>
        <symbol id="i-folder" viewBox="0 0 24 24"><path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/></symbol>
        <symbol id="i-image" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="8" cy="9" r="1.5"/></symbol>
        <symbol id="i-trash" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6"/></symbol>
        <symbol id="i-note" viewBox="0 0 24 24"><path d="M12 20h9M4 20v-4l11-11 4 4-11 11z"/></symbol>
        <symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="3" width="13" height="13" rx="2"/><path d="M16 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h3"/></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
        <symbol id="i-fx" viewBox="0 0 24 24"><path d="M5 19V8a3 3 0 0 1 3-3h2M5 12h6M14 9l5 10M14 19l5-10" strokeLinecap="round"/></symbol>
        <symbol id="i-text" viewBox="0 0 24 24"><path d="M5 5h14M12 5v14M9 19h6"/></symbol>
        <symbol id="i-eval" viewBox="0 0 24 24"><path d="M4 9h10M4 15h10"/><path d="M16 8l5 4-5 4z" fill="currentColor" stroke="none"/></symbol>
        <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></symbol>
        <symbol id="i-moon" viewBox="0 0 24 24"><path d="M21 12.5A9 9 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5z"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></symbol>
        <symbol id="i-warn" viewBox="0 0 24 24"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.1" strokeWidth="2.2"/></symbol>
        <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1" strokeWidth="2.2"/></symbol>
        <symbol id="i-x-square" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9l6 6M15 9l-6 6"/></symbol>
        <symbol id="i-resize" viewBox="0 0 24 24"><path d="M20 14v6h-6M14 20l6-6M10 4H4v6M4 4l6 6"/></symbol>
        <symbol id="i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4M12 17v.1" strokeWidth="2"/></symbol>
        <symbol id="i-wand" viewBox="0 0 24 24"><path d="M4 20 L13 11 M14 5l1 2 2 1-2 1-1 2-1-2-2-1 2-1z M19 13l.6 1.4 1.4.6-1.4.6L19 17l-.6-1.4L17 15l1.4-.6z"/></symbol>
        <symbol id="i-link" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5 M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.5-1.5"/></symbol>
        <symbol id="i-steps" viewBox="0 0 24 24"><path d="M4 18h4v-4H4zM10 14h4v-4h-4zM16 10h4V6h-4z"/></symbol>
        <symbol id="i-settings" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></symbol>
        <symbol id="i-keyboard" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12"/></symbol>
        <symbol id="i-layout" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></symbol>
        <symbol id="i-palette" viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2a10 10 0 1 0 0 20c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1-.23-.27-.38-.62-.38-1 0-.83.67-1.5 1.5-1.5h1.77c2.76 0 5-2.24 5-5C21 6.48 16.97 2 12 2z"/></symbol>
        <symbol id="i-sparkles" viewBox="0 0 24 24"><path d="M12 3l1.5 4 4 1.5-4 1.5L12 14l-1.5-4-4-1.5 4-1.5L12 3z"/><path d="M19 14l.8 2 2 .8-2 .8L19 19.6l-.8-2-2-.8 2-.8z"/><path d="M5 16l.6 1.4 1.4.6-1.4.6L5 20l-.6-1.4L3 18l1.4-.6z"/></symbol>
        <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
        <symbol id="i-expand" viewBox="0 0 24 24"><path d="M15 3h6v6M21 3l-7 7M9 21H3v-6M3 21l7-7"/></symbol>
        <symbol id="i-chevron-down" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
        <symbol id="i-chevron-up" viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></symbol>
        <symbol id="i-chevron-left" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></symbol>
        <symbol id="i-chevron-right" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></symbol>
        <symbol id="i-graph" viewBox="0 0 24 24"><path d="M3 21V3M3 21h18M6 17c2-4 4-6 6-6s4 4 6 6"/></symbol>
        <symbol id="i-cube" viewBox="0 0 24 24"><path d="M12 2L4 7v10l8 5 8-5V7l-8-5z"/><path d="M4 7l8 5 8-5M12 12v10"/></symbol>
        <symbol id="i-brain" viewBox="0 0 24 24"><path d="M9 3a3 3 0 0 0-3 3v.5A3 3 0 0 0 3 9.5v3a3 3 0 0 0 1.5 2.6V18a3 3 0 0 0 3 3h0M15 3a3 3 0 0 1 3 3v.5a3 3 0 0 1 3 3v3a3 3 0 0 1-1.5 2.6V18a3 3 0 0 1-3 3h0M12 3v18M9 9h6M9 15h6"/></symbol>
        <symbol id="i-matrix" viewBox="0 0 24 24"><path d="M4 3v18M20 3v18M4 3h2M4 21h2M18 3h2M18 21h2"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/></symbol>
        <symbol id="i-function" viewBox="0 0 24 24"><path d="M8 21V8a4 4 0 0 1 4-4M5 12h6M14 8l5 10M19 8l-5 10"/></symbol>
        <symbol id="i-book" viewBox="0 0 24 24"><path d="M4 5v14a2 2 0 0 0 2 2h14V4H6a2 2 0 0 0-2 2z"/><path d="M8 6v15"/></symbol>
        <symbol id="i-tag" viewBox="0 0 24 24"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></symbol>
        <symbol id="i-code" viewBox="0 0 24 24"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></symbol>
        <symbol id="i-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></symbol>
        <symbol id="i-square" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/></symbol>
        <symbol id="i-play" viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></symbol>
        <symbol id="i-pause" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></symbol>
        <symbol id="i-stop" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="1"/></symbol>
        <symbol id="i-refresh" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 4v4h-4M21 12a9 9 0 0 1-15.5 6.3L3 16M3 20v-4h4"/></symbol>
      </defs>
    </svg>
  );
}

export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return (
    <svg className={`ic ${className}`} aria-hidden>
      <use href={`#i-${name}`} />
    </svg>
  );
}
