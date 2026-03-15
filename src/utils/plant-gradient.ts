// src/utils/plant-gradient.ts
// Rarity-mapped gradient colors for plant detail hero area

const RARITY_GRADIENT: Record<number, { start: string; end: string }> = {
  1: { start: '#e8f0e8', end: '#f5f4f1' }, // sage green → cream (common)
  2: { start: '#e0eaf5', end: '#f5f4f1' }, // sky blue → cream (uncommon)
  3: { start: '#f5e0dd', end: '#f5f4f1' }, // blush pink → cream (rare)
};

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l]; // achromatic

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let hue = 0;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / d + 2) / 6;
  else hue = ((r - g) / d + 4) / 6;

  return [hue, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  if (s === 0) {
    const v = Math.round(l * 255);
    return `#${v.toString(16).padStart(2, '0').repeat(3)}`;
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function saturateHex(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  const newS = Math.min(1, Math.max(0, s + amount));
  return hslToHex(h, newS, l);
}

export function getPlantGradientColors(
  rarity: number,
  bloomMonths: number[],
  currentMonth?: number,
): [string, string] {
  const base = RARITY_GRADIENT[rarity] ?? RARITY_GRADIENT[1];
  const month = currentMonth ?? new Date().getMonth() + 1;
  const inBloom = bloomMonths.includes(month);
  const start = inBloom ? saturateHex(base.start, 0.1) : base.start;
  return [start, base.end];
}
