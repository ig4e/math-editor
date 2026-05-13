// 3D curve — (x(t), y(t), z(t)) sampled along t.

import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { compileMulti } from '../../graphers/compileMulti';
import type { Curve3DSpec } from '../../graphers/spec';

interface Props {
  spec: Curve3DSpec;
  variables: Record<string, number>;
  samples: number;
}

export function Curve({ spec, variables, samples }: Props) {
  const points = useMemo(() => {
    const fx = compileMulti(spec.xExpression);
    const fy = compileMulti(spec.yExpression);
    const fz = compileMulti(spec.zExpression);
    const param = spec.parameter ?? 't';
    const tMin = spec.tMin ?? -10;
    const tMax = spec.tMax ??  10;
    const step = (tMax - tMin) / samples;
    const out: THREE.Vector3[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = tMin + i * step;
      const vars = { ...variables, [param]: t };
      out.push(new THREE.Vector3(safe(fx(vars)), safe(fy(vars)), safe(fz(vars))));
    }
    return out;
  }, [spec, variables, samples]);

  return <Line points={points} color={spec.color ?? '#f59e0b'} lineWidth={2} />;
}

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}
