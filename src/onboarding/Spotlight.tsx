// Tour spotlight overlay. Renders a full-viewport dim except for a
// rectangular cutout over a target element (`[data-tour-target="<id>"]`).
// The cutout animates between targets so the eye follows the focus.
//
// Mounted as a sibling of <Dialog> inside Tour.tsx; pointer-events are
// off so the user can interact with the dialog and (subtly) the spot.

import { useEffect, useState } from 'react';

interface Rect { x: number; y: number; w: number; h: number }

interface Props {
  /** data-tour-target attribute value of the panel to highlight. */
  target?: string;
  /** Padding around the target rect, in px. Default 8. */
  padding?: number;
}

export function Spotlight({ target, padding = 8 }: Props) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!target) { setRect(null); return; }
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour-target="${target}"]`);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ x: r.x - padding, y: r.y - padding, w: r.width + padding * 2, h: r.height + padding * 2 });
    };
    measure();
    window.addEventListener('resize', measure);
    // Re-measure after a tick so flexlayout has settled its DOM.
    const t = window.setTimeout(measure, 80);
    return () => {
      window.removeEventListener('resize', measure);
      window.clearTimeout(t);
    };
  }, [target, padding]);

  if (!target) return null;

  // Use SVG with a mask so we can render a single dark rect and punch
  // a transparent hole. Animating x/y/width/height on the inner rect
  // gives us free Lerp via CSS.
  const vw = typeof window === 'undefined' ? 1920 : window.innerWidth;
  const vh = typeof window === 'undefined' ? 1080 : window.innerHeight;
  // If we don't yet have a rect, render the full overlay so the page
  // already dims before the target's first measure resolves.
  const r = rect ?? { x: vw / 2, y: vh / 2, w: 0, h: 0 };

  return (
    <svg
      className="fixed inset-0 z-[150] pointer-events-none"
      width={vw}
      height={vh}
      aria-hidden="true"
      style={{ transition: 'opacity 120ms ease-out' }}
    >
      <defs>
        <mask id="spotlight-mask">
          <rect x={0} y={0} width={vw} height={vh} fill="white" />
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            rx={10}
            ry={10}
            fill="black"
            style={{ transition: 'all 200ms ease-out' }}
          />
        </mask>
      </defs>
      <rect x={0} y={0} width={vw} height={vh} fill="rgba(0,0,0,0.45)" mask="url(#spotlight-mask)" />
      {/* Glow ring around the cutout. */}
      <rect
        x={r.x}
        y={r.y}
        width={r.w}
        height={r.h}
        rx={10}
        ry={10}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        style={{ transition: 'all 200ms ease-out', filter: 'drop-shadow(0 0 6px var(--color-accent))' }}
      />
    </svg>
  );
}
