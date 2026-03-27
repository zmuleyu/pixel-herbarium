import { createCanvas, loadImage, registerFont } from 'canvas';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

// --- Configuration ---

const BRAND_BG = '#FFF0F0';       // Unified brand pink-white
const BORDER_COLOR = '#FFB7C5';   // Sakura pink border
const TEXT_COLOR = '#1D1D1F';     // Apple-style dark text
const BORDER_WIDTH = 40;
const MARGIN = 40;
const TEXT_AREA_HEIGHT = 200;
const FONT_SIZE = 80;
const FONT_FAMILY = 'Yu Gothic Medium';  // Fallback: 'Hiragino Sans', 'Noto Sans JP'

// Output dimensions: iPhone 6.9" (1320 x 2868)
const OUTPUT_WIDTH = 1320;
const OUTPUT_HEIGHT = 2868;

const SCREENSHOTS = [
  {
    input: 'e2e/current/01-home.png',
    title_ja: '花めぐりの記録、はじめよう',
    output: 'e2e/composed/canvas/01-home.png',
  },
  {
    input: 'e2e/current/02-checkin.png',
    title_ja: '写真で記録、思い出に残る',
    output: 'e2e/composed/canvas/02-checkin.png',
  },
  {
    input: 'e2e/current/03-footprint.png',
    title_ja: 'あなたの花の足跡を一覧で',
    output: 'e2e/composed/canvas/03-footprint.png',
  },
  {
    input: 'e2e/current/04-settings.png',
    title_ja: 'あなたの花旅をカスタマイズ',
    output: 'e2e/composed/canvas/04-settings.png',
  },
];

// --- Compose Function ---

async function composeScreenshot({ input, title_ja, output }) {
  const canvas = createCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
  const ctx = canvas.getContext('2d');

  // 1. Fill background
  ctx.fillStyle = BRAND_BG;
  ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  // 2. Draw border
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = BORDER_WIDTH;
  ctx.strokeRect(
    BORDER_WIDTH / 2,
    BORDER_WIDTH / 2,
    OUTPUT_WIDTH - BORDER_WIDTH,
    OUTPUT_HEIGHT - BORDER_WIDTH
  );

  // 3. Draw marketing text at top
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = `${FONT_SIZE}px "${FONT_FAMILY}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title_ja, OUTPUT_WIDTH / 2, BORDER_WIDTH + TEXT_AREA_HEIGHT / 2);

  // 4. Load and draw screenshot
  const screenshot = await loadImage(input);

  // Calculate placement: centered below text area with margin
  const availableWidth = OUTPUT_WIDTH - (BORDER_WIDTH + MARGIN) * 2;
  const availableHeight = OUTPUT_HEIGHT - BORDER_WIDTH * 2 - TEXT_AREA_HEIGHT - MARGIN * 2;

  // Scale to fit while maintaining aspect ratio
  const scale = Math.min(
    availableWidth / screenshot.width,
    availableHeight / screenshot.height
  );
  const drawWidth = screenshot.width * scale;
  const drawHeight = screenshot.height * scale;

  const drawX = (OUTPUT_WIDTH - drawWidth) / 2;
  const drawY = BORDER_WIDTH + TEXT_AREA_HEIGHT + MARGIN;

  // Optional: rounded corners clip for the screenshot
  const radius = 24;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(drawX + radius, drawY);
  ctx.lineTo(drawX + drawWidth - radius, drawY);
  ctx.arcTo(drawX + drawWidth, drawY, drawX + drawWidth, drawY + radius, radius);
  ctx.lineTo(drawX + drawWidth, drawY + drawHeight - radius);
  ctx.arcTo(drawX + drawWidth, drawY + drawHeight, drawX + drawWidth - radius, drawY + drawHeight, radius);
  ctx.lineTo(drawX + radius, drawY + drawHeight);
  ctx.arcTo(drawX, drawY + drawHeight, drawX, drawY + drawHeight - radius, radius);
  ctx.lineTo(drawX, drawY + radius);
  ctx.arcTo(drawX, drawY, drawX + radius, drawY, radius);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(screenshot, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();

  // 5. Save output
  const outputDir = dirname(output);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(output, buffer);
  console.log(`  Composed: ${output} (${OUTPUT_WIDTH}x${OUTPUT_HEIGHT})`);
}

// --- Main ---

async function main() {
  console.log('Screenshot Compose Pipeline');
  console.log(`  Background: ${BRAND_BG}`);
  console.log(`  Text color: ${TEXT_COLOR}`);
  console.log(`  Output: ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}`);
  console.log('');

  let success = 0;
  let failed = 0;

  for (const config of SCREENSHOTS) {
    try {
      if (!existsSync(config.input)) {
        console.log(`  SKIP: ${config.input} (file not found)`);
        failed++;
        continue;
      }
      await composeScreenshot(config);
      success++;
    } catch (err) {
      console.error(`  FAILED: ${config.input} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} composed, ${failed} skipped/failed.`);
  if (success > 0) {
    console.log('Output in e2e/composed/canvas/');
  }
}

main();
