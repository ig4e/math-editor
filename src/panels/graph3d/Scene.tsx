// The R3F scene — axes, grid floor, orbit controls, plus dispatch to the
// per-spec components. Receives only the data it needs so it re-renders
// cleanly when specs / variables / view options change.

import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport, Grid } from '@react-three/drei';
import type { PlotSpec } from '../../graphers/spec';
import { is3DSpec } from '../../graphers/spec';
import { Surface } from './Surface';
import { ParametricSurface } from './ParametricSurface';
import { Curve } from './Curve';
import { VectorField } from './VectorField';
import { PointCloud } from './PointCloud';

interface Props {
  specs: readonly PlotSpec[];
  variables: Record<string, number>;
  range: number;
  samples: number;
  showGrid: boolean;
}

export function Scene({ specs, variables, range, samples, showGrid }: Props) {
  const dim3 = specs.filter(is3DSpec);
  return (
    <Canvas
      camera={{ position: [range * 1.5, range * 1.2, range * 1.8], fov: 50 }}
      gl={{ preserveDrawingBuffer: true }} // needed for canvas.toDataURL()
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[10, 12, 8]} intensity={0.85} />
      <directionalLight position={[-8, -6, -10]} intensity={0.25} />

      {showGrid && (
        <Grid
          args={[range * 4, range * 4]}
          cellSize={range / 5}
          sectionSize={range}
          sectionColor="#6366f1"
          cellColor="#cccccc"
          fadeDistance={range * 6}
          infiniteGrid={false}
          followCamera={false}
        />
      )}

      <Axes range={range} />

      {dim3.map((spec, i) => (
        <PlotByKind key={i} spec={spec} variables={variables} range={range} samples={samples} />
      ))}

      <OrbitControls makeDefault />
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport labelColor="white" />
      </GizmoHelper>
    </Canvas>
  );
}

function PlotByKind({
  spec, variables, range, samples,
}: { spec: PlotSpec; variables: Record<string, number>; range: number; samples: number }) {
  switch (spec.kind) {
    case 'surface3d':
      return <Surface spec={spec} variables={variables} range={range} samples={samples} />;
    case 'parametric-surface3d':
      return <ParametricSurface spec={spec} variables={variables} samples={samples} />;
    case 'curve3d':
      return <Curve spec={spec} variables={variables} samples={samples * 4} />;
    case 'vector-field3d':
      return <VectorField spec={spec} variables={variables} range={range} />;
    case 'points3d':
      return <PointCloud spec={spec} />;
    default:
      return null;
  }
}

function Axes({ range }: { range: number }) {
  const r = range * 1.2;
  return (
    <group>
      <Line color="#ef4444" from={[-r, 0, 0]} to={[r, 0, 0]} />
      <Line color="#10b981" from={[0, -r, 0]} to={[0, r, 0]} />
      <Line color="#3b82f6" from={[0, 0, -r]} to={[0, 0, r]} />
    </group>
  );
}

function Line({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) {
  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array([...from, ...to]), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  );
}
