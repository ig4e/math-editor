// Scatter point cloud — Points geometry from a flat (x, y, z) list.

import { useMemo } from 'react';
import * as THREE from 'three';
import type { Points3DSpec } from '../../graphers/spec';

interface Props {
  spec: Points3DSpec;
}

export function PointCloud({ spec }: Props) {
  const geometry = useMemo(() => {
    const arr = new Float32Array(spec.points.length * 3);
    let p = 0;
    for (const [x, y, z] of spec.points) {
      arr[p++] = x;
      arr[p++] = y;
      arr[p++] = z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return geo;
  }, [spec.points]);

  return (
    <points geometry={geometry}>
      <pointsMaterial color={spec.color ?? '#ef4444'} size={0.12} />
    </points>
  );
}
