// Mount point for the JSXGraph board. The board mutates its container
// DOM imperatively, so we hand it a bare div and never re-render its
// children from React. The parent panel calls `board.dispose()` on
// unmount and re-creates the board when the spec set changes meaningfully.

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { GrapherInput, GrapherInstance, PlotSpec } from '../../graphers';
import { getGrapher } from '../../graphers';
import '../../graphers/all';

export interface JSXBoardHandle {
  snapshot(): Promise<{ dataURL: string; width: number; height: number } | null>;
}

interface Props {
  specs: readonly PlotSpec[];
  variables: Record<string, number>;
  grid: boolean;
  equalScale: boolean;
}

export const JSXBoard = forwardRef<JSXBoardHandle, Props>(function JSXBoard(
  { specs, variables, grid, equalScale }, ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<GrapherInstance | null>(null);

  // Disposed via `instanceRef.current?.dispose()` on every recreate so
  // we don't leak boards.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    const grapher = getGrapher('jsxgraph2d');
    if (!grapher) {
      console.warn('[graph] jsxgraph2d not registered');
      return;
    }
    const input: GrapherInput = { specs, variables, grid, equalScale };
    void grapher.create(container, input).then((instance) => {
      if (disposed) {
        instance.dispose();
        return;
      }
      instanceRef.current?.dispose();
      instanceRef.current = instance;
    });
    return () => {
      disposed = true;
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, [specs, variables, grid, equalScale]);

  useImperativeHandle(ref, () => ({
    async snapshot() {
      return (await instanceRef.current?.snapshotToDataURL()) ?? null;
    },
  }));

  return (
    <div
      ref={containerRef}
      data-testid="jxgbox"
      className="jxgbox h-full w-full min-h-[280px] bg-canvas"
    />
  );
});
