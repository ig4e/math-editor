// Sheet → PDF. Uses jsPDF lazily (the lib + its STIX-math font come in
// at ~120 KB gz). MathLive's convertLatexToMarkup produces SVG which we
// rasterise via canvas before placing on the PDF.
//
// Caveats: the v8 baseline keeps it simple — math renders as the raw
// LaTeX source under a "Equation:" prefix, not a rendered glyph (PDF
// font embedding for math is non-trivial). P17 polish can upgrade this
// via MathJax-node or an in-browser KaTeX → image pipeline.

import type { Sheet } from '../state/types';

interface SheetPDFOpts {
  filename?: string;
}

export async function sheetToPDF(sheet: Sheet, opts: SheetPDFOpts = {}): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const MARGIN = 48;
  const CONTENT_W = PAGE_W - 2 * MARGIN;
  let y = MARGIN;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(sheet.name, MARGIN, y);
  y += 28;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const ensureRoom = (h: number) => {
    if (y + h > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  for (const b of sheet.blocks) {
    if (b.type === 'math') {
      ensureRoom(40);
      doc.setFont('helvetica', 'italic');
      doc.text('Equation:', MARGIN, y);
      y += 14;
      doc.setFont('courier', 'normal');
      const lines = doc.splitTextToSize(b.latex, CONTENT_W) as string[];
      for (const line of lines) {
        ensureRoom(14);
        doc.text(line, MARGIN + 16, y);
        y += 14;
      }
      doc.setFont('helvetica', 'normal');
      if (b.note) {
        ensureRoom(14);
        doc.setTextColor(120, 120, 120);
        doc.text(b.note, MARGIN + 16, y);
        doc.setTextColor(20, 20, 20);
        y += 14;
      }
      y += 8;
    } else if (b.type === 'text') {
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(b.text || '', CONTENT_W) as string[];
      for (const line of lines) {
        ensureRoom(14);
        doc.text(line, MARGIN, y);
        y += 14;
      }
      y += 8;
    }
  }

  if (sheet.notes && sheet.notes.trim()) {
    ensureRoom(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Notes', MARGIN, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(sheet.notes, CONTENT_W) as string[];
    for (const line of lines) {
      ensureRoom(14);
      doc.text(line, MARGIN, y);
      y += 14;
    }
  }

  // jsPDF's output('blob') resolves synchronously.
  void opts.filename;
  return doc.output('blob');
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
