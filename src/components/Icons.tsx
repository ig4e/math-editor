// A single SVG sprite of feather-style icons. Components reference these
// via <Icon name="…" />. Stroke icons inherit currentColor.

export type IconName =
  | 'plus' | 'fx' | 'text' | 'cursor' | 'pen' | 'eraser'
  | 'highlight' | 'eval' | 'zoom-in' | 'zoom-out' | 'home'
  | 'download' | 'folder' | 'image' | 'trash' | 'note'
  | 'copy' | 'close' | 'sun' | 'moon' | 'check' | 'warn'
  | 'info' | 'x-square' | 'resize' | 'help';

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
