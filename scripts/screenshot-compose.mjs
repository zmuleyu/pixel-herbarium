import { createCanvas, loadImage, registerFont } from 'canvas';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

// --- Font Registration ---

try {
  registerFont('C:/Windows/Fonts/YuGothB.ttc', { family: 'Yu Gothic Bold' });
  registerFont('C:/Windows/Fonts/YuGothR.ttc', { family: 'Yu Gothic Regular' });
  console.log('Fonts registered: Yu Gothic Bold + Regular');
} catch (e) {
  console.warn('WARN: Could not register Yu Gothic .ttc —', e.message);
}

// --- Configuration (v2: competitive visual upgrade) ---

const BG_COLOR = '#D4537E';                    // brand.accent — high visibility
const TITLE_COLOR = '#FFFFFF';                  // White, high contrast
const SUBTITLE_COLOR = 'rgba(255,255,255,0.7)'; // White 70% opacity
const SCREENSHOT_RADIUS = 40;                   // iOS standard corner radius
const PADDING = 40;                             // Side padding
const BOTTOM_PADDING = 24;                      // Bottom breathing room

const TITLE_FONT = 'Yu Gothic Bold';
const SUBTITLE_FONT = 'Yu Gothic Regular';
const TITLE_FONT_SIZE = 96;
const SUBTITLE_FONT_SIZE = 36;
const TEXT_AREA_RATIO = 0.30;                   // Top 30% for text, bottom 70% for screenshot

// Output: iPhone 6.5" (ASC actual slot for 花図鉑)
const OUTPUT_WIDTH = 1284;
const OUTPUT_HEIGHT = 2778;

const SCREENSHOTS = [
  {
    input: 'e2e/current/01-home.png',
    title: '花に、出会う。',
    subtitle: '季節の花をスタンプで記録',
    output: 'e2e/composed/canvas/01-home.png',
  },
  {
    input: 'e2e/current/02-checkin.png',
    title: '花の日記。',
    subtitle: 'チェックインを振り返ろう',
    output: 'e2e/composed/canvas/02-diary.png',
  },
  {
    input: 'e2e/current/03-settings.png',
    title: 'あなた好みに。',
    subtitle: '言語・通知・プライバシー設定',
    output: 'e2e/composed/canvas/03-settings.png',
  },
];

// --- Rounded rect helper ---

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// --- Compose Function ---

async function composeScreenshot({ input, title, subtitle, output }) {
  const canvas = createCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
  const ctx = canvas.getContext('2d');

  const textAreaHeight = Math.floor(OUTPUT_HEIGHT * TEXT_AREA_RATIO);
  const screenshotAreaTop = textAreaHeight;
  const screenshotAreaHeight = OUTPUT_HEIGHT - screenshotAreaTop - BOTTOM_PADDING;

  // 1. Fill brand background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  // 2. Draw title (emotional hook — large, bold, white)
  ctx.fillStyle = TITLE_COLOR;
  ctx.font = `bold ${TITLE_FONT_SIZE}px "${TITLE_FONT}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const titleY = textAreaHeight * 0.42;
  ctx.fillText(title, OUTPUT_WIDTH / 2, titleY);

  // 3. Draw subtitle (functional — smaller, semi-transparent white)
  ctx.fillStyle = SUBTITLE_COLOR;
  ctx.font = `${SUBTITLE_FONT_SIZE}px "${SUBTITLE_FONT}"`;
  const subtitleY = titleY + TITLE_FONT_SIZE * 0.7;
  ctx.fillText(subtitle, OUTPUT_WIDTH / 2, subtitleY);

  // 4. Load screenshot
  const screenshot = await loadImage(input);

  // Calculate screenshot placement: fill width with padding, maintain aspect ratio
  const availableWidth = OUTPUT_WIDTH - PADDING * 2;
  const scale = availableWidth / screenshot.width;
  const drawWidth = availableWidth;
  const drawHeight = Math.min(screenshot.height * scale, screenshotAreaHeight);

  const drawX = PADDING;
  const drawY = screenshotAreaTop;

  // 5. Draw white rounded rect background (separates screenshot from brand color)
  ctx.fillStyle = '#FFFFFF';
  roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, SCREENSHOT_RADIUS);
  ctx.fill();

  // 6. Clip and draw screenshot with rounded corners
  ctx.save();
  roundedRect(ctx, drawX, drawY, drawWidth, drawHeight, SCREENSHOT_RADIUS);
  ctx.clip();
  ctx.drawImage(screenshot, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();

  // 7. Save output
  const outputDir = dirname(output);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  writeFileSync(output, canvas.toBuffer('image/png'));
  console.log(`  Composed: ${output} (${OUTPUT_WIDTH}x${OUTPUT_HEIGHT})`);
}

// --- Main ---

async function main() {
  console.log('Screenshot Compose Pipeline v2');
  console.log(`  Brand color: ${BG_COLOR}`);
  console.log(`  Output: ${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}`);
  console.log('');

  let success = 0;
  let failed = 0;

  for (const config of SCREENSHOTS) {
    try {
      if (!existsSync(config.input)) {
        console.log(`  SKIP: ${config.input} (not found)`);
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
}

main();
