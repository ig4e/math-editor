// Vector field — (P, Q, R)(x, y, z) sampled at evenly-spaced lattice
// points. Each sample is rendered as a small line with a cone head.

import { useMemo } from 'react';
import * as THREE from 'three';
import { compileMulti } from '../../graphers/compileMulti';
import type { VectorField3DSpec } from '../../graphers/spec';

interface Props {
  spec: VectorField3DSpec;
  variables: Record<string, number>;
  range: number;
}

export function VectorField({ spec, variables, range }: Props) {
  const arrows = useMemo(() => {
    const fp = compileMulti(spec.pExpression);
    const fq = compileMulti(spec.qExpression);
    const fr = compileMulti(spec.rExpression);
    const density = spec.density ?? 6;
    const step = (2 * range) / density;
    const out: { origin: THREE.Vector3; dir: THREE.Vector3; len: number }[] = [];
    for (let i = 0; i <= density; i++) {
      for (let j = 0; j <= density; j++) {
        for (let k = 0; k <= density; k++) {
          const x = -range + i * step;
          const y = -range + j * step;
          const z = -range + k * step;
          const vars = { ...variables, x, y, z };
          const dx = safe(fp(vars));
          const dy = safe(fq(vars));
          const dz = safe(fr(vars));
          const len = Math.hypot(dx, dy, dz);
          if (len < 1e-6) continue;
          out.push({
            origin: new THREE.Vector3(x, y, z),
            dir: new THREE.Vector3(dx, dy, dz).normalize(),
            len: Math.min(len, step * 0.9),
          });
        }
      }
    }
    return out;
  }, [spec, variables, range]);

  const color = spec.color ?? '#8b5cf6';

  return (
    <group>
      {arrows.map((a, i) => (
        <ArrowSegment key={i} origin={a.origin} dir={a.dir} length={a.len} color={color} />
      ))}
    </group>
  );
}

function ArrowSegment({
  origin, dir, length, color,
}: { origin: THREE.Vector3; dir: THREE.Vector3; length: number; color: string }) {
  // Three.js ArrowHelper would do this but it doesn't compose well with R3F.
  // Build cylinder body + cone head.
  const end = origin.clone().addScaledVector(dir, length);
  const mid = origin.clone().addScaledVector(dir, length / 2);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  return (
    <group>
      <mesh position={mid} quaternion={quat}>
        <cylinderGeometry args={[length * 0.02, length * 0.02, length * 0.8, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={end} quaternion={quat}>
        <coneGeometry args={[length * 0.06, length * 0.18, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}
