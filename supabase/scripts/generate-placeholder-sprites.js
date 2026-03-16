#!/usr/bin/env node
/**
 * Generate 256x256 placeholder pixel art sprites for all 60 spring plants.
 * Uses pure Node.js (no canvas/sharp) — outputs PPM then converts via built-in tools.
 * Each sprite is a simple geometric flower pattern colored by rarity.
 *
 * Output: assets/sprites/plant_{id}.png (via PPM→PNG conversion)
 * Fallback: assets/sprites/plant_{id}.ppm (if no PNG converter available)
 *
 * Usage: node supabase/scripts/generate-placeholder-sprites.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SIZE = 256;
const OUT_DIR = path.join(__dirname, '../../assets/sprites');

// Adult Kawaii rarity palettes (low saturation, warm)
const PALETTES = {
  1: { // ★ Common — sage green
    bg: [245, 244, 241],       // cream
    petal: [159, 182, 159],    // sage
    center: [232, 166, 124],   // warm peach
    stem: [140, 160, 140],     // darker sage
    leaf: [193, 232, 216],     // mint
  },
  2: { // ★★ Uncommon — sky blue
    bg: [245, 244, 241],
    petal: [180, 200, 230],    // soft blue
    center: [245, 230, 163],   // warm yellow
    stem: [140, 160, 140],
    leaf: [193, 232, 216],
  },
  3: { // ★★★ Rare — blush pink
    bg: [245, 244, 241],
    petal: [245, 213, 208],    // blush
    center: [245, 230, 163],   // gold
    stem: [140, 160, 140],
    leaf: [193, 232, 216],
  },
};

// Simple flower shapes (pixel patterns on 16x16 grid, scaled to 256x256)
const FLOWER_PATTERNS = [
  // 0: 5-petal round (sakura-like)
  { petals: 5, petalR: 3, centerR: 1.5, stemH: 5 },
  // 1: 6-petal star
  { petals: 6, petalR: 2.5, centerR: 1.2, stemH: 4 },
  // 2: 4-petal cross
  { petals: 4, petalR: 3.5, centerR: 1.5, stemH: 6 },
  // 3: 8-petal daisy
  { petals: 8, petalR: 2, centerR: 1.8, stemH: 4 },
  // 4: 3-petal tulip
  { petals: 3, petalR: 3, centerR: 1, stemH: 6 },
];

// All 60 plants from seed data
const PLANTS = [
  // ★ Common (1-30)
  { id: 1, rarity: 1, name: 'Yoshino Cherry' },
  { id: 2, rarity: 1, name: 'Japanese Plum' },
  { id: 3, rarity: 1, name: 'Dandelion' },
  { id: 4, rarity: 1, name: 'Rapeseed' },
  { id: 5, rarity: 1, name: 'Narcissus' },
  { id: 6, rarity: 1, name: 'Tulip' },
  { id: 7, rarity: 1, name: 'Pansy' },
  { id: 8, rarity: 1, name: 'Dogwood' },
  { id: 9, rarity: 1, name: 'Kobushi Magnolia' },
  { id: 10, rarity: 1, name: 'Peach Blossom' },
  { id: 11, rarity: 1, name: 'Spiraea' },
  { id: 12, rarity: 1, name: 'Forsythia' },
  { id: 13, rarity: 1, name: 'Celandine' },
  { id: 14, rarity: 1, name: 'Moss Phlox' },
  { id: 15, rarity: 1, name: 'Speedwell' },
  { id: 16, rarity: 1, name: 'Dogtooth Violet' },
  { id: 17, rarity: 1, name: 'Violet' },
  { id: 18, rarity: 1, name: 'Japanese Kerria' },
  { id: 19, rarity: 1, name: 'Fleabane' },
  { id: 20, rarity: 1, name: 'Field Mustard' },
  { id: 21, rarity: 1, name: 'White Clover' },
  { id: 22, rarity: 1, name: 'Henbit Deadnettle' },
  { id: 23, rarity: 1, name: 'Common Dandelion' },
  { id: 24, rarity: 1, name: 'Hyacinth' },
  { id: 25, rarity: 1, name: 'Anemone' },
  { id: 26, rarity: 1, name: 'Grape Hyacinth' },
  { id: 27, rarity: 1, name: 'Dames Rocket' },
  { id: 28, rarity: 1, name: 'Baby Blue Eyes' },
  { id: 29, rarity: 1, name: 'Pot Marigold' },
  { id: 30, rarity: 1, name: 'Crown Daisy' },
  // ★★ Uncommon (31-50)
  { id: 31, rarity: 2, name: 'Japanese Wisteria' },
  { id: 32, rarity: 2, name: 'Hydrangea' },
  { id: 33, rarity: 2, name: 'Peony' },
  { id: 34, rarity: 2, name: 'Lilac' },
  { id: 35, rarity: 2, name: 'Clematis' },
  { id: 36, rarity: 2, name: 'Tree Peony' },
  { id: 37, rarity: 2, name: 'Rhododendron' },
  { id: 38, rarity: 2, name: 'Deadnettle' },
  { id: 39, rarity: 2, name: 'Azalea' },
  { id: 40, rarity: 2, name: 'Rabbit-ear Iris' },
  { id: 41, rarity: 2, name: 'Japanese Iris' },
  { id: 42, rarity: 2, name: 'Mountain Azalea' },
  { id: 43, rarity: 2, name: 'Three-leaf Azalea' },
  { id: 44, rarity: 2, name: 'Mountain Magnolia' },
  { id: 45, rarity: 2, name: 'Shortia' },
  { id: 46, rarity: 2, name: 'Two-flowered Anemone' },
  { id: 47, rarity: 2, name: 'Hepatica' },
  { id: 48, rarity: 2, name: 'Trillium' },
  { id: 49, rarity: 2, name: 'Wild Grape' },
  { id: 50, rarity: 2, name: 'Fringed Iris' },
  // ★★★ Rare (51-60)
  { id: 51, rarity: 3, name: 'Double Cherry Blossom' },
  { id: 52, rarity: 3, name: 'Northern Kobushi' },
  { id: 53, rarity: 3, name: 'Spikenard' },
  { id: 54, rarity: 3, name: 'Ladys Slipper' },
  { id: 55, rarity: 3, name: 'Japanese Wood Poppy' },
  { id: 56, rarity: 3, name: 'Giant Lily' },
  { id: 57, rarity: 3, name: 'Asian Skunk Cabbage' },
  { id: 58, rarity: 3, name: 'Japanese Primrose' },
  { id: 59, rarity: 3, name: 'Alpine Anemone' },
  { id: 60, rarity: 3, name: 'Bleeding Heart' },
];

function createPixelGrid() {
  // 16x16 logical grid, each cell = 16px in the 256x256 output
  return Array.from({ length: 16 }, () => Array(16).fill(null));
}

function drawCircle(grid, cx, cy, r, color) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= r) grid[y][x] = color;
    }
  }
}

function drawFlower(grid, pattern, palette) {
  const cx = 8, cy = 6; // flower center (slightly above middle)

  // Draw petals
  for (let i = 0; i < pattern.petals; i++) {
    const angle = (i / pattern.petals) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * (pattern.petalR + 0.5);
    const py = cy + Math.sin(angle) * (pattern.petalR + 0.5);
    drawCircle(grid, px, py, pattern.petalR, palette.petal);
  }

  // Draw center
  drawCircle(grid, cx, cy, pattern.centerR, palette.center);

  // Draw stem
  for (let y = cy + 2; y < cy + 2 + pattern.stemH && y < 16; y++) {
    grid[y][cx] = palette.stem;
    if (y > cy + 3) grid[y][cx - 1] = palette.stem; // slight thickness
  }

  // Draw leaves
  const leafY = cy + 4;
  if (leafY < 15) {
    drawCircle(grid, cx - 2, leafY, 1.2, palette.leaf);
    drawCircle(grid, cx + 2, leafY + 1, 1.2, palette.leaf);
  }
}

function gridToPPM(grid, palette) {
  const pixels = [];
  const CELL = SIZE / 16; // 16px per cell

  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const gx = Math.floor(px / CELL);
      const gy = Math.floor(py / CELL);
      const color = grid[gy]?.[gx] ?? palette.bg;
      pixels.push(color[0], color[1], color[2]);
    }
  }

  const header = `P6\n${SIZE} ${SIZE}\n255\n`;
  return Buffer.concat([Buffer.from(header), Buffer.from(pixels)]);
}

// Main
fs.mkdirSync(OUT_DIR, { recursive: true });

let generated = 0;
for (const plant of PLANTS) {
  const palette = PALETTES[plant.rarity];
  const patternIdx = (plant.id - 1) % FLOWER_PATTERNS.length;
  const pattern = FLOWER_PATTERNS[patternIdx];
  const grid = createPixelGrid();

  drawFlower(grid, pattern, palette);

  const ppmPath = path.join(OUT_DIR, `plant_${plant.id}.ppm`);
  const pngPath = path.join(OUT_DIR, `plant_${plant.id}.png`);

  fs.writeFileSync(ppmPath, gridToPPM(grid, palette));

  // Try to convert PPM → PNG using available tools
  try {
    execSync(`magick "${ppmPath}" "${pngPath}"`, { stdio: 'ignore' });
    fs.unlinkSync(ppmPath);
  } catch {
    try {
      execSync(`ffmpeg -y -i "${ppmPath}" "${pngPath}"`, { stdio: 'ignore' });
      fs.unlinkSync(ppmPath);
    } catch {
      // Keep PPM if no converter available
    }
  }

  generated++;
  if (generated % 10 === 0 || generated === 1) {
    console.log(`Generated ${generated}/${PLANTS.length}: ${plant.name} (★${'★'.repeat(plant.rarity - 1)})`);
  }
}

console.log(`\nDone! ${generated} sprites in ${OUT_DIR}`);
console.log('Files:', fs.readdirSync(OUT_DIR).length);

// Generate SQL UPDATE statements
const sqlPath = path.join(__dirname, '../seed/update_sprite_urls.sql');
const ext = fs.existsSync(path.join(OUT_DIR, 'plant_1.png')) ? 'png' : 'ppm';
const lines = PLANTS.map(p =>
  `UPDATE plants SET pixel_sprite_url = 'asset:///sprites/plant_${p.id}.${ext}' WHERE id = ${p.id};`
);
fs.writeFileSync(sqlPath, `-- Auto-generated sprite URL updates\n-- These use asset:// protocol for bundled sprites\n\n${lines.join('\n')}\n`);
console.log(`SQL updates written to ${sqlPath}`);
