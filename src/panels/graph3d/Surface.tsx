// Surface mesh — z = f(x, y) sampled on a (samples × samples) grid.
// The BufferGeometry is rebuilt when expression or variables change.

import { useMemo } from 'react';
import * as THREE from 'three';
import { compileMulti } from '../../graphers/compileMulti';
import type { Surface3DSpec } from '../../graphers/spec';

interface Props {
  spec: Surface3DSpec;
  variables: Record<string, number>;
  range: number; // half-extent on each axis
  samples: number;
}

export function Surface({ spec, variables, range, samples }: Props) {
  const { geometry, color } = useMemo(() => {
    const f = compileMulti(spec.expression);
    const xVar = spec.xVar ?? 'x';
    const yVar = spec.yVar ?? 'y';

    const step = (2 * range) / samples;
    const positions = new Float32Array((samples + 1) * (samples + 1) * 3);
    let p = 0;
    let zMin = Infinity, zMax = -Infinity;
    for (let i = 0; i <= samples; i++) {
      const x = -range + i * step;
      for (let j = 0; j <= samples; j++) {
        const y = -range + j * step;
        const z = f({ ...variables, [xVar]: x, [yVar]: y });
        const safeZ = Number.isFinite(z) ? z : 0;
        positions[p++] = x;
        positions[p++] = safeZ;
        positions[p++] = y;
        if (safeZ < zMin) zMin = safeZ;
        if (safeZ > zMax) zMax = safeZ;
      }
    }

    const indices: number[] = [];
    const stride = samples + 1;
    for (let i = 0; i < samples; i++) {
      for (let j = 0; j < samples; j++) {
        const a = i * stride + j;
        const b = a + 1;
        const c = a + stride;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return { geometry: geo, color: spec.color ?? '#6366f1', zRange: zMax - zMin };
  }, [spec.expression, spec.color, spec.xVar, spec.yVar, variables, range, samples]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} side={THREE.DoubleSide} flatShading={false} />
    </mesh>
  );
}
