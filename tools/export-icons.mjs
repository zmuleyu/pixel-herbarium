/**
 * Export App Icon SVG → PNG at all required platform sizes.
 * Usage: node tools/export-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const assetsDir = join(root, 'assets');
const svgPath = join(assetsDir, 'icon.svg');
const svgBuffer = readFileSync(svgPath);

const SIZES = {
  ios: [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024],
  android: [48, 72, 96, 144, 192, 512],
  favicon: [16, 32, 48],
};

async function exportIcon(size, outputPath) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`  ✓ ${size}×${size} → ${outputPath.split(/[\\/]/).pop()}`);
}

async function main() {
  // Create output directories
  const iconsDir = join(assetsDir, 'icons');
  for (const platform of ['ios', 'android', 'favicon']) {
    const dir = join(iconsDir, platform);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  console.log('🌸 Exporting App Icon PNGs from SVG...\n');

  // Export all sizes per platform
  for (const [platform, sizes] of Object.entries(SIZES)) {
    console.log(`${platform.toUpperCase()}:`);
    for (const size of sizes) {
      await exportIcon(size, join(iconsDir, platform, `icon-${size}.png`));
    }
    console.log('');
  }

  // Replace main asset files
  console.log('Replacing main asset files:');
  await exportIcon(1024, join(assetsDir, 'icon.png'));
  await exportIcon(48, join(assetsDir, 'favicon.png'));

  // Android adaptive icon: foreground = full icon, background = cream gradient
  await exportIcon(512, join(assetsDir, 'android-icon-foreground.png'));

  // For background, create a plain cream gradient
  const bgSvg = Buffer.from(`<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8f6f3"/>
      <stop offset="100%" stop-color="#ede9e3"/>
    </linearGradient></defs>
    <rect width="512" height="512" fill="url(#bg)"/>
  </svg>`);
  await sharp(bgSvg).resize(512, 512).png().toFile(join(assetsDir, 'android-icon-background.png'));
  console.log('  ✓ 512×512 → android-icon-background.png');

  console.log('\n✅ All icons exported successfully!');
}

main().catch(err => { console.error('❌ Export failed:', err); process.exit(1); });
