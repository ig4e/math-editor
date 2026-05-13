// Smoke test for every math-diagram template: each one builds to at
// least one Excalidraw element when round-tripped through
// convertToExcalidrawElements (the same code path the picker uses).

import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../templates';

// The vitest setup stubs @excalidraw/excalidraw, so we assert against
// the skeleton element list directly rather than the converted output.
// The end-to-end conversion is exercised by the build that ships the
// generated math-templates.excalidrawlib and by the manual smoke gate.

describe('math-diagram templates', () => {
  it('registers a unique id per template', () => {
    const ids = new Set(TEMPLATES.map((t) => t.id));
    expect(ids.size).toBe(TEMPLATES.length);
  });

  it('ships at least 10 templates across all five categories', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(10);
    const cats = new Set(TEMPLATES.map((t) => t.category));
    expect(cats.has('numeracy')).toBe(true);
    expect(cats.has('geometry')).toBe(true);
    expect(cats.has('sets')).toBe(true);
    expect(cats.has('logic')).toBe(true);
    expect(cats.has('ml')).toBe(true);
  });

  for (const t of TEMPLATES) {
    it(`template "${t.id}" produces a non-empty skeleton`, () => {
      const skeleton = t.build({ x: 0, y: 0 });
      expect(skeleton.length).toBeGreaterThan(0);
      // Every skeleton element has a recognised primitive type.
      const KINDS = new Set(['line', 'arrow', 'rectangle', 'ellipse', 'diamond', 'text', 'image', 'freedraw', 'frame']);
      for (const el of skeleton) {
        expect(KINDS.has(el.type as string)).toBe(true);
      }
    });
  }

  it('skeletons translate with the origin', () => {
    // Same template at two origins should be 100 px apart for any
    // positional field that's tracked across builds (we check `x`).
    const a = TEMPLATES[0]!.build({ x: 0,   y: 0 });
    const b = TEMPLATES[0]!.build({ x: 100, y: 0 });
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      const ax = (a[i] as { x?: number }).x ?? 0;
      const bx = (b[i] as { x?: number }).x ?? 0;
      expect(bx - ax).toBe(100);
    }
  });
});
