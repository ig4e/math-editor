// PCA mode — paste a CSV (one sample per row), run PCA, see the
// projected 2-D scatter with the first two principal axes overlaid.

import { useMemo, useState } from 'react';
import { runPCA } from '../../../ml/pca';
import { Card } from '../../../components/common';

const SAMPLE = `1,2,3
2,3,5
3,5,8
4,4,7
6,7,11
7,9,15
8,8,16
9,11,18`;

export function PCAMode() {
  const [csv, setCsv] = useState(SAMPLE);

  const rows = useMemo(() => {
    return csv.trim().split(/\n+/).map((line) =>
      line.split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n)),
    ).filter((r) => r.length > 0);
  }, [csv]);

  const pca = useMemo(() => {
    if (rows.length < 2) return null;
    const w = rows[0]?.length ?? 0;
    if (rows.some((r) => r.length !== w)) return null;
    if (w < 2) return null;
    try { return runPCA(rows, 2); } catch { return null; }
  }, [rows]);

  return (
    <div className="flex flex-col gap-3">
      <Card title={`Samples (${rows.length})`}>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.currentTarget.value)}
          rows={6}
          className="w-full font-mono text-xs p-2 rounded bg-surface-2 text-fg outline-none border border-border"
        />
      </Card>
      {pca && (
        <Card title="Projection (PC1 vs PC2)" tone="accent">
          <Scatter pca={pca} />
          <div className="mt-2 text-xs text-fg-muted">
            explained variance: {pca.explained.map((v) => `${(v * 100).toFixed(1)}%`).join(' / ')}
          </div>
        </Card>
      )}
    </div>
  );
}

function Scatter({ pca }: { pca: { projected: number[][]; explained: number[] } }) {
  const xs = pca.projected.map((p) => p[0] ?? 0);
  const ys = pca.projected.map((p) => p[1] ?? 0);
  const xMin = Math.min(...xs) - 0.5, xMax = Math.max(...xs) + 0.5;
  const yMin = Math.min(...ys) - 0.5, yMax = Math.max(...ys) + 0.5;
  const W = 600, H = 320;
  const sx = (x: number) => 10 + ((x - xMin) / (xMax - xMin)) * (W - 20);
  const sy = (y: number) => H - 10 - ((y - yMin) / (yMax - yMin)) * (H - 20);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-80" preserveAspectRatio="none">
      <line x1="10" y1={H / 2} x2={W - 10} y2={H / 2} stroke="var(--color-border)" />
      <line x1={W / 2} y1="10" x2={W / 2} y2={H - 10} stroke="var(--color-border)" />
      {pca.projected.map((p, i) => (
        <circle key={i} cx={sx(p[0] ?? 0)} cy={sy(p[1] ?? 0)} r="3.5" fill="var(--color-accent)" />
      ))}
    </svg>
  );
}
