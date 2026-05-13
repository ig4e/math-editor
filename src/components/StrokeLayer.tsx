// Renders all strokes for the active sheet as an SVG layer.
// Coordinates are *multiplied by zoom on render*, so a stroke that's
// 200px wide at zoom=1 becomes 400px at zoom=2 — and it renders as a fresh
// SVG path, not a rasterized bitmap, so it stays crisp at any zoom.

import { useMemo } from 'react';
import { useStore } from '../state/store';
import { pointsToPath } from '../utils/geom';

export function StrokeLayer() {
  const strokes = useStore((s) => s.sheets[s.activeSheetId].strokes);
  const zoom    = useStore((s) => s.sheets[s.activeSheetId].view.zoom);

  // Memoize the rendered paths against zoom so we don't rebuild d-strings
  // for the same data on every pan.
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
    <svg className="stroke-layer" aria-hidden>
      {paths}
    </svg>
  );
}
