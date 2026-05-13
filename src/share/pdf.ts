// Sheet → PDF. Uses jsPDF lazily (the lib + its STIX-math font come in
// at ~120 KB gz). MathLive's `convertLatexToMarkup` produces HTML/SVG
// which we rasterise via `html-to-image` (already a dep) before
// embedding as a PNG.
//
// Fallback path: if MathLive markup or html-to-image rasterisation
// fails (an edge-case LaTeX construct, font not yet warmed up), we
// degrade to the original monospace LaTeX source.

import type { Sheet } from '../state/types';
import { convertLatexToMarkup } from 'mathlive';
import { toPng } from 'html-to-image';

interface SheetPDFOpts {
  filename?: string;
}

/** Render one math block's LaTeX to a PNG dataURL. Best-effort —
 *  returns null on failure so the caller can fall back to text. */
async function rasterMath(latex: string): Promise<{ dataURL: string; width: number; height: number } | null> {
  try {
    const markup = convertLatexToMarkup(latex);
    const host = document.createElement('div');
    // Offscreen but in the document so MathLive's CSS variables resolve
    // against the document root.
    host.style.cssText = 'position:absolute;left:-99999px;top:0;background:white;color:#111;padding:8px;font-size:20px;';
    host.innerHTML = markup;
    document.body.appendChild(host);
    // One frame so layout settles for measurement.
    await new Promise(requestAnimationFrame);
    const rect = host.getBoundingClientRect();
    const width = Math.max(40, Math.ceil(rect.width));
    const height = Math.max(20, Math.ceil(rect.height));
    const dataURL = await toPng(host, { pixelRatio: 2, width, height, backgroundColor: '#ffffff' });
    host.remove();
    return { dataURL, width, height };
  } catch (err) {
    console.warn('[pdf] math rasterise failed, falling back to LaTeX text:', err);
    return null;
  }
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
      const png = await rasterMath(b.latex);
      if (png) {
        // Scale to fit CONTENT_W if needed — MathLive renders at 20pt so
        // most lines are well under the page width. Convert px → pt @ 72
        // dpi (1 pt ≈ 1.33 px). At pixelRatio=2 the dataURL is 2x; the
        // measured rect is css-px (1x).
        const ptW = Math.min(CONTENT_W, b.latex.length > 0 ? png.width * 0.75 : 200);
        const scale = ptW / png.width;
        const ptH = png.height * scale;
        ensureRoom(ptH + 12);
        doc.addImage(png.dataURL, 'PNG', MARGIN, y, ptW, ptH);
        y += ptH + 4;
      } else {
        // Fallback: monospace LaTeX source.
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
      }
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
