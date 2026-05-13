// Three.js / R3F 3D grapher. Registers a Grapher record that materialises
// into a React subtree (returned in the GrapherInstance.element). Unlike
// the JSXGraph adapter (which mounts imperatively into a div), R3F lives
// inside React's tree — Graph3DPanel embeds it directly.
//
// All Three / R3F / drei imports are lazy: the `create()` function awaits
// the module imports the first time it runs.

import { registerGrapher, type Grapher, type GrapherInstance, type GrapherInput } from './index';

// Stash the lazy-loaded React subtree builder. Real work happens inside
// the React component (see panels/graph3d/Scene.tsx).
const three3d: Grapher = {
  id: 'three3d',
  dimensions: '3d',
  supports: ['surface3d', 'parametric-surface3d', 'curve3d', 'vector-field3d', 'points3d'],
  async create(container: HTMLElement, _input: GrapherInput): Promise<GrapherInstance> {
    // We don't render imperatively; the panel mounts <Graph3DScene specs={...} />.
    // The registry's `element` slot is unused for this grapher; the panel
    // uses the grapher only for the snapshot capability.
    // Container is provided so future grappers can hook in; we ignore it
    // for the React-driven 3D case.
    void container;

    // Lazy import to keep three out of the main bundle.
    await import('@react-three/fiber');

    const snapshot = async () => {
      const canvas = container.querySelector('canvas');
      if (!canvas) return null;
      try {
        const dataURL = canvas.toDataURL('image/png');
        return { dataURL, width: canvas.width, height: canvas.height };
      } catch (e) {
        console.warn('[three3d] snapshot failed', e);
        return null;
      }
    };

    // The grapher record carries the specs across to the panel's scene;
    // the panel reads them via direct subscription instead. We hand back
    // an inert element + a snapshotToDataURL + dispose.
    return {
      element: null,
      snapshotToDataURL: snapshot,
      dispose() { /* React unmount handles teardown */ },
    };
  },
};

registerGrapher(three3d);

// Re-export the specs filter so panels can ask "which entries are 3D?"
export { is3DSpec } from './spec';

// Tag this module as referenced by `input` to silence noUnusedParameters.
export const __unused = (i: GrapherInput) => i;
