// Color-contrast CI gate. Parses `src/index.css`, extracts every
// `--color-*` declaration. The app is currently dark-only — the
// `@theme { ... }` block holds the dark tokens. A `[data-theme="dark"]`
// override block, if present, is layered on top. The script reports
// each curated pair against the resulting effective token map.
//
// We curate the pair list because exhaustive O(n²) checks flag
// unused combinations as false positives.
//
// Exit 1 on any pair under threshold. Exit 0 otherwise.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cssPath = join(__dirname, '..', 'src', 'index.css');
const css = readFileSync(cssPath, 'utf8');

// ---- 1. extract tokens per scope ----------------------------------------

/** @typedef {{ [name: string]: string }} TokenMap */
/** @typedef {{ light: TokenMap; dark: TokenMap }} Scopes */

/** @returns {Scopes} */
function parseScopes(source) {
  // The base tokens live inside `@theme { ... }`.
  const baseMatch = source.match(/@theme\s*\{([\s\S]*?)\n\}/);
  // Dark overrides (if any) inside `[data-theme="dark"] { ... }`.
  const darkMatch = source.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);
  const parseBlock = (block) => {
    const map = {};
    const re = /--color-([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]+|[\w()\s,.%-]+);/g;
    let m;
    while ((m = re.exec(block)) !== null) {
      const name = m[1];
      const val = m[2].trim();
      if (!val.startsWith('#')) continue;
      map[name] = val;
    }
    return map;
  };
  const base = baseMatch ? parseBlock(baseMatch[1]) : {};
  const darkOverride = darkMatch ? parseBlock(darkMatch[1]) : {};
  return {
    // "Effective dark" = base layered with the dark override map. With
    // the app dark-only, base IS the dark palette.
    dark: { ...base, ...darkOverride },
  };
}

// ---- 2. WCAG relative-luminance + contrast-ratio ------------------------

/** @param {string} hex */
function hexToRgb(hex) {
  // strip optional alpha (#rrggbbaa) — we ignore alpha for ratio
  const h = hex.replace('#', '').slice(0, 6);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [r, g, b];
}
function chan(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance([r, g, b]) {
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}
function ratio(fg, bg) {
  const L1 = luminance(hexToRgb(fg));
  const L2 = luminance(hexToRgb(bg));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

// ---- 3. curated pair list -----------------------------------------------

/** @type {{ fg: string; bg: string; min?: number; label?: string }[]} */
const PAIRS = [
  // Body text — strict AA.
  { fg: 'fg', bg: 'app' },
  { fg: 'fg', bg: 'surface' },
  { fg: 'fg', bg: 'surface-2' },
  // Secondary text — strict AA at the size we use (14px).
  { fg: 'fg-2', bg: 'surface' },
  { fg: 'fg-2', bg: 'surface-2' },
  // Muted text — large/metadata only, allow AA-large 3.0.
  { fg: 'fg-muted', bg: 'surface', min: 3.0 },
  { fg: 'fg-muted', bg: 'surface-2', min: 3.0 },
  // Status colors over surface.
  { fg: 'danger', bg: 'surface', min: 3.0 },
  { fg: 'success', bg: 'surface', min: 3.0 },
  { fg: 'warning', bg: 'surface', min: 3.0 },
  // Accent badge contrast.
  { fg: 'accent', bg: 'accent-bg', min: 3.0 },
];

// ---- 4. run + report ----------------------------------------------------

const scopes = parseScopes(css);
let failures = 0;

for (const scopeName of /** @type {const} */ (['dark'])) {
  const map = scopes[scopeName];
  for (const { fg, bg, min = 4.5 } of PAIRS) {
    const fgHex = map[fg];
    const bgHex = map[bg];
    if (!fgHex || !bgHex) {
      console.error(`[contrast] missing token in ${scopeName}: ${!fgHex ? '--color-' + fg : '--color-' + bg}`);
      failures++;
      continue;
    }
    const r = ratio(fgHex, bgHex);
    const ok = r >= min;
    const tag = ok ? 'OK ' : 'FAIL';
    const line = `[contrast] ${tag} ${scopeName.padEnd(5)} ${fg.padEnd(10)} on ${bg.padEnd(10)} ratio=${r.toFixed(2)} (min ${min})`;
    if (ok) console.log(line); else { console.error(line); failures++; }
  }
}

if (failures > 0) {
  console.error(`\n[contrast] ${failures} failures`);
  process.exit(1);
}
console.log('\n[contrast] OK');
