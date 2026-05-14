// blockToSvg — the editor's renderer for math + text-block content
// in SVG export. Passed as `renderBlockToSvg` into Excalidraw's
// exportToSvg; staticSvgScene appends the returned fragment inside
// the block's frame group.
//
// Math: KaTeX → MathML. The resulting `<math>` element renders
// natively in every recent browser (Firefox + Chromium 109+ + Safari
// 16.4+) with no extra CSS or fonts. That keeps the SVG self-
// contained — copy-paste into any modern viewer and the math shows
// up. We wrap the MathML in a <foreignObject> so the rest of the
// SVG layout stays consistent with text-block.
//
// Text-block: a <foreignObject> wrapping the text in a styled <div>.
// Same wrapping behaviour as the HTML overlay; respects line breaks.

import katex from 'katex';
import type {
  ExcalidrawBlockElement,
  ExcalidrawMathElement,
  ExcalidrawTextBlockElement,
} from '@excalidraw/excalidraw/element/types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XHTML_NS = 'http://www.w3.org/1999/xhtml';
const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

/**
 * Build the SVG fragment to render inside a block's framed rect.
 * Coordinates are local to the block (the parent group already
 * applies translate + rotate). Returns null when there's nothing to
 * draw (empty latex / text), so the frame renders alone.
 */
export function renderBlockToSvg(
  element: ExcalidrawBlockElement,
): SVGElement | null {
  if (element.type === 'math') {
    return renderMathBlock(element);
  }
  return renderTextBlock(element);
}

function renderMathBlock(el: ExcalidrawMathElement): SVGElement | null {
  if (!el.latex.trim()) return null;

  // KaTeX → MathML. `output: 'mathml'` returns `<math …>…</math>` as
  // a string; we parse it into a DOM node and embed inside the
  // foreignObject. Browsers render MathML natively so the SVG stays
  // self-contained.
  let mathString: string;
  try {
    mathString = katex.renderToString(el.latex, {
      displayMode: true,
      throwOnError: false,
      output: 'mathml',
      strict: 'ignore',
    });
  } catch {
    mathString = '';
  }

  const fo = document.createElementNS(SVG_NS, 'foreignObject');
  fo.setAttribute('x', '0');
  fo.setAttribute('y', '0');
  fo.setAttribute('width', `${el.width}`);
  fo.setAttribute('height', `${el.height}`);

  const wrapper = document.createElementNS(XHTML_NS, 'div');
  wrapper.setAttribute('xmlns', XHTML_NS);
  wrapper.setAttribute(
    'style',
    [
      'width: 100%',
      'height: 100%',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'padding: 4px 8px',
      'box-sizing: border-box',
      `font-size: ${el.fontSize}px`,
      `color: ${el.strokeColor && el.strokeColor !== 'transparent' ? el.strokeColor : '#000'}`,
      'overflow: hidden',
    ].join('; '),
  );

  if (mathString) {
    // KaTeX wraps the <math> in a <span class="katex"><span class="katex-mathml">…</span></span>.
    // We only want the inner <math>; pull it out so we don't depend on KaTeX CSS for the <span> wrappers.
    const parsed = new DOMParser().parseFromString(
      `<root xmlns="${XHTML_NS}">${mathString}</root>`,
      'application/xml',
    );
    const math = parsed.getElementsByTagNameNS(MATHML_NS, 'math')[0];
    if (math) {
      wrapper.appendChild(document.importNode(math, true));
    } else {
      // KaTeX returned something unexpected; fall back to raw LaTeX.
      wrapper.textContent = el.latex;
    }
  } else {
    wrapper.textContent = el.latex;
  }
  fo.appendChild(wrapper);
  return fo;
}

function renderTextBlock(el: ExcalidrawTextBlockElement): SVGElement | null {
  if (!el.text.trim()) return null;

  const fo = document.createElementNS(SVG_NS, 'foreignObject');
  fo.setAttribute('x', '0');
  fo.setAttribute('y', '0');
  fo.setAttribute('width', `${el.width}`);
  fo.setAttribute('height', `${el.height}`);

  const wrapper = document.createElementNS(XHTML_NS, 'div');
  wrapper.setAttribute('xmlns', XHTML_NS);
  wrapper.setAttribute(
    'style',
    [
      'width: 100%',
      'height: 100%',
      'padding: 4px 8px',
      'box-sizing: border-box',
      `font-size: ${el.fontSize}px`,
      `color: ${el.strokeColor && el.strokeColor !== 'transparent' ? el.strokeColor : '#000'}`,
      'white-space: pre-wrap',
      'overflow: hidden',
      'font-family: system-ui, sans-serif',
    ].join('; '),
  );
  wrapper.textContent = el.text;
  fo.appendChild(wrapper);
  return fo;
}

