// PNG export uses html-to-image, which handles MathLive's shadow DOM
// correctly (the previous hand-rolled <foreignObject> path produced
// blank math boxes because shadow trees don't serialize).

import { toPng } from 'html-to-image';

export async function exportElementToPng(
  el: HTMLElement,
  filename: string,
  options: { backgroundColor?: string } = {},
): Promise<void> {
  // html-to-image needs the element to be visible & sized; the whiteboard
  // viewport meets that. We over-pixel a bit for retina sharpness.
  const dataUrl = await toPng(el, {
    pixelRatio: Math.min(2, window.devicePixelRatio || 1),
    backgroundColor: options.backgroundColor,
    cacheBust: true,
    // Skip elements with `data-export-ignore` so we can hide the pen overlay,
    // resize handles, etc. from the screenshot.
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true;
      return !node.dataset.exportIgnore;
    },
  });
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
