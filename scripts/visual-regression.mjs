/**
 * Visual regression comparison script.
 * Compares e2e/baselines/ against e2e/current/ using pixelmatch.
 * Writes diff images to e2e/diffs/ and exits non-zero if any screen exceeds threshold.
 *
 * Usage: node scripts/visual-regression.mjs
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import path from 'path';

const THRESHOLD = 0.01; // 1% pixel difference allowed
const BASELINE_DIR = 'e2e/baselines';
const CURRENT_DIR = 'e2e/current';
const DIFF_DIR = 'e2e/diffs';
const SCREENS = ['login', 'herbarium', 'discover', 'map', 'profile'];

await mkdir(DIFF_DIR, { recursive: true });

let failed = 0;

for (const name of SCREENS) {
  const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
  const currentPath = path.join(CURRENT_DIR, `${name}.png`);

  if (!existsSync(baselinePath)) {
    console.log(`⚠  ${name}: no baseline found — skipping`);
    continue;
  }
  if (!existsSync(currentPath)) {
    console.error(`✗  ${name}: current screenshot missing`);
    failed++;
    continue;
  }

  const [baseData, currData] = await Promise.all([
    readFile(baselinePath),
    readFile(currentPath),
  ]);

  const base = PNG.sync.read(baseData);
  const curr = PNG.sync.read(currData);
  const { width, height } = base;
  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(base.data, curr.data, diff.data, width, height, {
    threshold: THRESHOLD,
    includeAA: false,
  });
  const ratio = mismatched / (width * height);

  if (ratio > THRESHOLD) {
    const diffPath = path.join(DIFF_DIR, `${name}.png`);
    await writeFile(diffPath, PNG.sync.write(diff));
    console.error(`✗  ${name}: ${(ratio * 100).toFixed(2)}% pixels differ (diff saved to ${diffPath})`);
    failed++;
  } else {
    console.log(`✓  ${name}: OK (${mismatched} px / ${(ratio * 100).toFixed(3)}%)`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} screen(s) failed visual regression.`);
  process.exit(1);
}
console.log('\nAll visual regression checks passed.');
