// Enforces the bundle-size budgets from docs/contributing.md.
//
//   - main entry        ≤ 800 KB gzip   (overall app pre-lazy)
//   - Phase 1 main      ≤ 300 KB gzip   (foundation only — bumped as phases land)
//   - any single chunk  ≤ 1500 KB gzip  (Excalidraw / Pyodide can be large but
//                                        only as lazy chunks; main entry hits the
//                                        smaller cap above)
//
// Failures exit non-zero so CI rejects the deploy.

import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const ASSETS = join(root, 'dist', 'assets');

// Budgets in bytes.
const KB = 1024;
const BUDGET_MAIN_ENTRY = 800 * KB;
const BUDGET_SINGLE_CHUNK = 1500 * KB;

async function main() {
  let assets;
  try {
    assets = await readdir(ASSETS);
  } catch {
    console.error(`check-bundle: ${ASSETS} not found. Did you run \`npm run build\` first?`);
    process.exit(1);
  }

  const results = [];
  for (const file of assets) {
    if (!file.endsWith('.js')) continue;
    const full = join(ASSETS, file);
    const buf = await readFile(full);
    const gz = gzipSync(buf).length;
    const raw = (await stat(full)).size;
    results.push({ file, raw, gz });
  }
  results.sort((a, b) => b.gz - a.gz);

  const main = results.find((r) => /index-.+\.js$/.test(r.file)) ?? results[0];
  let failed = false;

  console.log(`check-bundle: ${results.length} JS chunk${results.length === 1 ? '' : 's'}`);
  for (const r of results) {
    const flag = r === main ? '[entry]' : '       ';
    const overEntry = r === main && r.gz > BUDGET_MAIN_ENTRY;
    const overChunk = r.gz > BUDGET_SINGLE_CHUNK;
    const mark = overEntry || overChunk ? '❌' : '  ';
    console.log(`  ${mark} ${flag} ${(r.gz / KB).toFixed(1).padStart(7)} KB gz  ${r.file}`);
    if (overEntry) {
      console.error(`     entry exceeds ${BUDGET_MAIN_ENTRY / KB} KB gzipped`);
      failed = true;
    }
    if (overChunk) {
      console.error(`     single chunk exceeds ${BUDGET_SINGLE_CHUNK / KB} KB gzipped`);
      failed = true;
    }
  }

  if (failed) {
    console.error('\ncheck-bundle: FAIL — lazy-load offenders via utils/lazy.ts or split the chunk.');
    process.exit(1);
  }
  console.log('check-bundle: OK');
}

main().catch((err) => {
  console.error('check-bundle errored:', err);
  process.exit(1);
});
