// Sanity coverage for the SVG-export block renderer. Asserts that the
// emitted SVG fragment is shaped how staticSvgScene expects (an
// SVGElement at the right namespace) and contains the actual block
// content (MathML for math, the raw text for text-block) so the
// exported SVG is self-contained.

import { describe, it, expect } from 'vitest';
import { renderBlockToSvg } from '../blockToSvg';
import type {
  ExcalidrawMathElement,
  ExcalidrawTextBlockElement,
} from '@excalidraw/excalidraw/element/types';

function baseElement(extra: Record<string, unknown>) {
  return {
    id: 'el-1',
    x: 0,
    y: 0,
    width: 240,
    height: 80,
    angle: 0 as never,
    strokeColor: '#000',
    backgroundColor: 'transparent',
    fillStyle: 'solid' as const,
    strokeWidth: 1,
    strokeStyle: 'solid' as const,
    roughness: 0,
    opacity: 100,
    groupIds: [] as never,
    frameId: null,
    roundness: null,
    seed: 1,
    versionNonce: 0,
    isDeleted: false,
    boundElements: null,
    updated: 0,
    link: null,
    locked: false,
    customData: undefined,
    version: 1,
    index: 'a0' as never,
    ...extra,
  };
}

describe('renderBlockToSvg', () => {
  it('returns null for empty math (no rect content)', () => {
    const el = baseElement({
      type: 'math',
      blockId: 'el-1',
      latex: '',
      fontSize: 18,
    }) as unknown as ExcalidrawMathElement;
    expect(renderBlockToSvg(el)).toBeNull();
  });

  it('returns null for empty text-block', () => {
    const el = baseElement({
      type: 'text-block',
      blockId: 'el-1',
      text: '',
      fontSize: 14,
    }) as unknown as ExcalidrawTextBlockElement;
    expect(renderBlockToSvg(el)).toBeNull();
  });

  it('renders math as MathML inside a <foreignObject>', () => {
    const el = baseElement({
      type: 'math',
      blockId: 'el-1',
      latex: 'x^2 + 1',
      fontSize: 18,
    }) as unknown as ExcalidrawMathElement;
    const node = renderBlockToSvg(el);
    expect(node).not.toBeNull();
    expect(node?.tagName.toLowerCase()).toBe('foreignobject');
    // KaTeX produces a <math> root for `output: 'mathml'`. The
    // renderer extracts it and embeds inside the foreignObject; the
    // text content should mention the integer literal in the LaTeX.
    expect(node?.innerHTML).toMatch(/<math/);
    expect(node?.textContent ?? '').toContain('2');
  });

  it('renders text-block content verbatim', () => {
    const el = baseElement({
      type: 'text-block',
      blockId: 'el-1',
      text: 'Step 1: integrate by parts.',
      fontSize: 14,
    }) as unknown as ExcalidrawTextBlockElement;
    const node = renderBlockToSvg(el);
    expect(node).not.toBeNull();
    expect(node?.tagName.toLowerCase()).toBe('foreignobject');
    expect(node?.textContent).toContain('integrate by parts');
  });
});
