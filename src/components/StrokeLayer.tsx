// SVG layer for pen strokes. Coordinates are world units multiplied by
// zoom on every render — keeps strokes crisp at any zoom level (fresh
// SVG paths, never rasterized bitmaps).

import { useMemo } from 'react';
import { useActiveSheet } from '../state/selectors';
import { pointsToPath } from '../utils/geom';

export function StrokeLayer() {
  const { strokes, view } = useActiveSheet();
  const { zoom } = view;

  // Memoize the rendered paths against zoom so we don't rebuild d-strings
  // on every pan (which only changes the world wrapper's transform).
  const paths = useMemo(
    () => strokes.map((s) => (
      <path
        key={s.id}
        className="stroke"
        d={pointsToPath(s.points, zoom)}
        stroke={s.color}
        strokeWidth={s.width * zoom}
      />
    )),
    [strokes, zoom],
  );

  return (
    <svg
      aria-hidden
      className="absolute left-0 top-0 w-px h-px pointer-events-none"
      style={{ overflow: 'visible' }}
    >
      {paths}
    </svg>
  );
}
