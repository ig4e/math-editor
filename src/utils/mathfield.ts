// Helpers for working with the live <math-field> element.

import type { MathfieldElement } from 'mathlive';
import type { ColorName } from '../state/types';

/**
 * Returns the LaTeX of the field's current selection, or '' when nothing
 * is selected. The math-field's `selection` API gives ranges as
 * [start, end] offset pairs; an all-collapsed selection means no caret-
 * range, so we treat it as empty.
 */
export function selectionLatex(mf: MathfieldElement): string {
  const sel = mf.selection;
  if (!sel) return '';
  const collapsed = (sel.ranges as Array<[number, number]>).every(([a, b]) => a === b);
  if (collapsed) return '';
  return mf.getValue(sel, 'latex');
}

/**
 * Wrap the math-field's current selection in \textcolor{name}{…} (or
 * \colorbox{name}{…} when `box=true`). No-op when nothing is selected;
 * returns false in that case so the caller can show a hint.
 */
export function applyColor(
  mf: MathfieldElement,
  colorName: ColorName,
  box = false,
): boolean {
  const sel = selectionLatex(mf);
  if (!sel) return false;
  const cmd = box
    ? `\\colorbox{${colorName}}{${sel}}`
    : `\\textcolor{${colorName}}{${sel}}`;
  mf.insert(cmd, { selectionMode: 'after', focus: true });
  return true;
}
