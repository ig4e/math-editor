// PCA wrapper around ml-pca. Returns the projected coordinates +
// principal axes for the ML Lab to draw on Graph 2D / 3D.

import { PCA } from 'ml-pca';

export interface PCAResult {
  projected: number[][]; // each row is a sample in PCA space
  components: number[][]; // each row is a principal axis in original space
  explained: number[];   // explained variance ratios
}

export function runPCA(data: readonly (readonly number[])[], k = 2): PCAResult {
  // Force a mutable 2-D copy for ml-pca.
  const rows = data.map((r) => r.slice());
  const pca = new PCA(rows);
  const projected = pca.predict(rows).to2DArray() as number[][];
  const components = pca.getEigenvectors().to2DArray() as number[][];
  const variance = pca.getExplainedVariance();
  // Truncate to first k components.
  return {
    projected: projected.map((row) => row.slice(0, k)),
    components: components.slice(0, k),
    explained: variance.slice(0, k),
  };
}
