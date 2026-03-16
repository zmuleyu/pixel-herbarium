export const TOTAL_PLANTS = 240;
export const GRID_COLUMNS = 6;
export const GRID_ROWS = 40; // 6 cols × 40 rows = 240 plants (spring + summer + autumn + winter)

export const RARITY_LABELS = {
  1: '★',
  2: '★★',
  3: '★★★ 限定',
} as const;

export const RARITY_COUNT = {
  1: 30, // Common
  2: 20, // Uncommon
  3: 10, // Seasonal-limited
} as const;

export const MONTHLY_QUOTA = 5;
export const COOLDOWN_RADIUS_METERS = 50;
export const COOLDOWN_DAYS = 7;
export const MAP_RADIUS_METERS = 5000;
export const FUZZ_RADIUS_METERS = 100;
