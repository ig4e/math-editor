// Parametric surface — (x(u,v), y(u,v), z(u,v)) sampled on a u×v grid.

import { useMemo } from 'react';
import * as THREE from 'three';
import { compileMulti } from '../../graphers/compileMulti';
import type { ParametricSurface3DSpec } from '../../graphers/spec';

interface Props {
  spec: ParametricSurface3DSpec;
  variables: Record<string, number>;
  samples: number;
}

export function ParametricSurface({ spec, variables, samples }: Props) {
  const { geometry, color } = useMemo(() => {
    const fx = compileMulti(spec.xExpression);
    const fy = compileMulti(spec.yExpression);
    const fz = compileMulti(spec.zExpression);
    const uVar = spec.uVar ?? 'u';
    const vVar = spec.vVar ?? 'v';
    const uMin = spec.uMin ?? -Math.PI;
    const uMax = spec.uMax ??  Math.PI;
    const vMin = spec.vMin ?? -Math.PI;
    const vMax = spec.vMax ??  Math.PI;

    const dU = (uMax - uMin) / samples;
    const dV = (vMax - vMin) / samples;
    const positions = new Float32Array((samples + 1) * (samples + 1) * 3);
    let p = 0;
    for (let i = 0; i <= samples; i++) {
      const u = uMin + i * dU;
      for (let j = 0; j <= samples; j++) {
        const v = vMin + j * dV;
        const vars = { ...variables, [uVar]: u, [vVar]: v };
        positions[p++] = safe(fx(vars));
        positions[p++] = safe(fy(vars));
        positions[p++] = safe(fz(vars));
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
    return { geometry: geo, color: spec.color ?? '#10b981' };
  }, [spec, variables, samples]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  );
}

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}
