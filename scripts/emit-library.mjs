// One-off generator for `public/math-templates.excalidrawlib`.
//
// Loads `src/panels/canvas/templates.ts` via a small esbuild bundle
// (so .ts works in Node), runs each `build()`, and emits an
// `.excalidrawlib` JSON Excalidraw users can import from the native
// Library panel.
//
// We don't call Excalidraw's own `convertToExcalidrawElements` here —
// that helper requires a browser `window`. Instead we hand-roll a
// minimal converter that mirrors the public element schema. Output
// validates against Excalidraw's import path; if Excalidraw bumps
// schema we re-run this once.
//
// Run after changing src/panels/canvas/templates.ts:
//   node scripts/emit-library.mjs

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { build } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EDITOR_SRC = join(ROOT, 'apps', 'editor', 'src');

// 1. Bundle templates.ts so we can import it from Node.
const result = await build({
  entryPoints: [join(EDITOR_SRC, 'panels', 'canvas', 'templates.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  external: [],
  write: false,
  target: 'es2022',
});
const bundled = result.outputFiles[0].text;
const mod = await import(`data:text/javascript;base64,${Buffer.from(bundled).toString('base64')}`);
const { TEMPLATES } = mod;

// 2. Minimal element factory — produces an Excalidraw-shaped element
//    from each skeleton, filling in the schema fields the import path
//    expects.
let seedCounter = 1;
function nextId() { return `tmpl-${Math.random().toString(36).slice(2, 11)}`; }
function defaults(type) {
  return {
    id: nextId(),
    type,
    angle: 0,
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: type === 'rectangle' ? { type: 3 } : null,
    seed: seedCounter++,
    versionNonce: 0,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
    customData: null,
    version: 1,
  };
}

function makeElement(sk) {
  const base = {
    ...defaults(sk.type),
    x: sk.x ?? 0,
    y: sk.y ?? 0,
    width: sk.width ?? 0,
    height: sk.height ?? 0,
  };
  if (sk.strokeWidth != null) base.strokeWidth = sk.strokeWidth;
  if (sk.type === 'text') {
    Object.assign(base, {
      text: sk.text ?? '',
      fontSize: sk.fontSize ?? 16,
      fontFamily: 5,            // 5 = system-ui in Excalidraw's enum
      textAlign: 'left',
      verticalAlign: 'top',
      containerId: null,
      originalText: sk.text ?? '',
      autoResize: true,
      lineHeight: 1.25,
      baseline: 12,
    });
    base.width = (sk.text?.length ?? 4) * (sk.fontSize ?? 16) * 0.6;
    base.height = (sk.fontSize ?? 16) + 4;
  }
  if (sk.type === 'arrow' || sk.type === 'line') {
    base.points = [[0, 0], [base.width, base.height]];
    base.lastCommittedPoint = null;
    base.startBinding = null;
    base.endBinding = null;
    base.startArrowhead = null;
    base.endArrowhead = sk.type === 'arrow' ? 'arrow' : null;
    base.elbowed = false;
  }
  return base;
}

// 3. Build the library JSON.
const libraryItems = TEMPLATES.map((t) => ({
  id: t.id,
  status: 'published',
  name: t.name,
  created: 1715731200000,
  elements: t.build({ x: 0, y: 0 }).map(makeElement),
}));

const library = {
  type: 'excalidrawlib',
  version: 2,
  source: 'math-notebook',
  libraryItems,
};

const outDir = join(ROOT, 'apps', 'editor', 'public');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'math-templates.excalidrawlib');
writeFileSync(outPath, JSON.stringify(library, null, 2));
console.log(`[emit-library] wrote ${TEMPLATES.length} templates → ${outPath}`);
