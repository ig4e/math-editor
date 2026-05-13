// Sheet → markdown export. Math blocks become `$$…$$` blocks; text
// blocks become paragraphs. The user's notes (P7) get appended at the
// end under a `## Notes` heading.

import type { Sheet } from '../state/types';

export function sheetToMarkdown(sheet: Sheet): string {
  const lines: string[] = [`# ${sheet.name}`, ''];
  for (const b of sheet.blocks) {
    if (b.type === 'math') {
      lines.push('$$', b.latex, '$$', '');
      if (b.note) lines.push(`> ${b.note}`, '');
    } else {
      lines.push(b.text || '', '');
      if (b.note) lines.push(`> ${b.note}`, '');
    }
  }
  if (sheet.notes && sheet.notes.trim()) {
    lines.push('## Notes', '', sheet.notes);
  }
  return lines.join('\n');
}
