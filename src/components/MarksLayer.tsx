// Single SVG layer for everything drawn on the whiteboard:
//   - freehand strokes (smoothed with perfect-freehand for fluid ink)
//   - parametric shapes (from the recognizer)
//   - equation links (lines between block centers)
//
// All coordinates are world units multiplied by zoom on render so every
// element rasterizes crisply at any zoom level.

import { useMemo } from 'react';
import { getStroke } from 'perfect-freehand';
import { useActiveSheet } from '../state/selectors';
import { useStore } from '../state/store';
import type { Shape } from '../state/types';

export function MarksLayer() {
  const { strokes, shapes, links, blocks, view } = useActiveSheet();
  const linkPending = useStore((s) => s.linkPendingFrom);
  const tool        = useStore((s) => s.tool);
  const { zoom } = view;

  // perfect-freehand expects an array of {x,y,pressure?} or [x,y,p?] points
  // and returns the *outline* of the stroke as a polygon — we render that
  // as a filled SVG path. Looks the same as a regular stroked line but
  // tapers naturally at the ends.
  const strokePaths = useMemo(
    () => strokes.map((s) => {
      const outline = getStroke(s.points, {
        size: s.width * 2 * zoom,
        thinning: 0.55,
        smoothing: 0.5,
        streamline: 0.4,
        end:   { taper: 4 * zoom, cap: true },
        start: { taper: 0,        cap: true },
      });
      const d = outlineToPath(outline);
      return <path key={s.id} d={d} fill={s.color} />;
    }),
    [strokes, zoom],
  );

  const shapeNodes = useMemo(
    () => shapes.map((sp) => <ShapeNode key={sp.id} shape={sp} zoom={zoom} />),
    [shapes, zoom],
  );

  const linkNodes = useMemo(() => links.map((l) => {
    const from = blocks.find((b) => b.id === l.fromId);
    const to   = blocks.find((b) => b.id === l.toId);
    if (!from || !to) return null;
    const a = blockCenter(from);
    const b = blockCenter(to);
    return (
      <line
        key={l.id}
        x1={a[0] * zoom} y1={a[1] * zoom}
        x2={b[0] * zoom} y2={b[1] * zoom}
        stroke="var(--color-accent)"
        strokeWidth={Math.max(1.5, 2 * zoom)}
        strokeDasharray={`${6 * zoom} ${4 * zoom}`}
        opacity={0.75}
      />
    );
  }), [links, blocks, zoom]);

  // Visual indicator while a link is in-progress: highlight the source block.
  const pendingHint = useMemo(() => {
    if (tool !== 'link' || !linkPending) return null;
    const b = blocks.find((x) => x.id === linkPending);
    if (!b) return null;
    const [cx, cy] = blockCenter(b);
    return (
      <circle
        cx={cx * zoom}
        cy={cy * zoom}
        r={Math.max(8, 10 * zoom)}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeDasharray="4 4"
      />
    );
  }, [tool, linkPending, blocks, zoom]);

  return (
    <svg
      aria-hidden
      className="absolute left-0 top-0 w-px h-px pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {linkNodes}
      {strokePaths}
      {shapeNodes}
      {pendingHint}
    </svg>
  );
}

function ShapeNode({ shape, zoom }: { shape: Shape; zoom: number }) {
  const stroke = shape.color;
  const width = Math.max(1, shape.width * zoom);
  const z = zoom;
  switch (shape.kind) {
    case 'circle':
      return (
        <circle
          cx={shape.cx * z} cy={shape.cy * z} r={shape.r * z}
          fill="none" stroke={stroke} strokeWidth={width}
        />
      );
    case 'rect':
      return (
        <rect
          x={shape.x * z} y={shape.y * z}
          width={shape.w * z} height={shape.h * z}
          rx={Math.min(8 * z, shape.w * z * 0.05)}
          fill="none" stroke={stroke} strokeWidth={width}
        />
      );
    case 'line':
      return (
        <line
          x1={shape.x1 * z} y1={shape.y1 * z}
          x2={shape.x2 * z} y2={shape.y2 * z}
          stroke={stroke} strokeWidth={width} strokeLinecap="round"
        />
      );
    case 'arrow': {
      const dx = shape.x2 - shape.x1;
      const dy = shape.y2 - shape.y1;
      const len = Math.hypot(dx, dy) || 1;
      const head = Math.min(18, len * 0.25);
      const ux = dx / len, uy = dy / len;
      const px = -uy, py = ux;          // perpendicular
      const baseX = shape.x2 - ux * head;
      const baseY = shape.y2 - uy * head;
      const h1x = baseX + px * head * 0.4;
      const h1y = baseY + py * head * 0.4;
      const h2x = baseX - px * head * 0.4;
      const h2y = baseY - py * head * 0.4;
      return (
        <g stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <line
            x1={shape.x1 * z} y1={shape.y1 * z}
            x2={baseX * z}    y2={baseY * z}
          />
          <polygon
            fill={stroke}
            points={[
              [shape.x2, shape.y2], [h1x, h1y], [h2x, h2y],
            ].map(([x, y]) => `${x * z},${y * z}`).join(' ')}
          />
        </g>
      );
    }
    case 'triangle':
      return (
        <polygon
          fill="none" stroke={stroke} strokeWidth={width} strokeLinejoin="round"
          points={shape.points.map(([x, y]) => `${x * z},${y * z}`).join(' ')}
        />
      );
  }
}

// Approximate a block as a card 180×60 around (block.x, block.y). Used by
// links and the link-pending hint. We aim at the visual center for clean
// arrow geometry even before the block has measured.
function blockCenter(b: { x: number; y: number }): [number, number] {
  return [b.x + 90, b.y + 28];
}

/** perfect-freehand returns outline points; this stitches them into an
 *  SVG `d` attribute (closed path). */
function outlineToPath(points: number[][]): string {
  if (!points.length) return '';
  const [first, ...rest] = points;
  let d = `M ${first[0]} ${first[1]}`;
  for (const [x, y] of rest) d += ` L ${x} ${y}`;
  d += ' Z';
  return d;
}
