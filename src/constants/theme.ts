export const colors = {
  background: '#f5f4f1',       // Cream white (NOT pure white)
  plantPrimary: '#9fb69f',     // Sage green
  plantSecondary: '#c1e8d8',   // Mint green
  blushPink: '#f5d5d0',        // Blush pink (flowers)
  skyBlue: '#d4e4f7',          // Sky blue (map)
  creamYellow: '#fff8dc',      // Cream yellow (highlights)
  text: '#3a3a3a',             // Near-black (NOT pure black)
  textSecondary: '#7a7a7a',
  border: '#e8e6e1',           // Light gray border
  white: '#ffffff',
  rarity: {
    common: '#9fb69f',         // ★
    uncommon: '#d4e4f7',       // ★★
    rare: '#f5d5d0',           // ★★★
  },
  seasonal: {
    sakura: '#f5d5d0',         // Spring cherry blossom
    ajisai: '#d4e4f7',         // Rainy season hydrangea
    himawari: '#f5e6a3',       // Summer sunflower
    momiji: '#e8a87c',         // Autumn maple
    tsubaki: '#c9a0a0',        // Winter camellia
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  fontFamily: {
    body: 'System',                    // San Francisco on iOS
    display: 'HiraginoMaruGothicProN', // Maru-Gothic for labels/buttons
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  lineHeight: 1.7, // Japanese user preference: spacious
} as const;

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

// Season theme system — used by tab bar, buttons, cards in check-in mode
export const SEASON_THEMES = {
  sakura: { primary: '#e8a5b0', accent: '#f5d5d0', bgTint: '#FFF5F3' },
  ajisai: { primary: '#7B9FCC', accent: '#d4e4f7', bgTint: '#F0F4FF' },
  himawari: { primary: '#d4a645', accent: '#f5e6a3', bgTint: '#FFFBF0' },
  momiji: { primary: '#c4764a', accent: '#e8a87c', bgTint: '#FFF5F0' },
  tsubaki: { primary: '#b07878', accent: '#c9a0a0', bgTint: '#FFF3F3' },
} as const;

export type SeasonTheme = (typeof SEASON_THEMES)[keyof typeof SEASON_THEMES];

export function getSeasonTheme(seasonId: string): SeasonTheme {
  return (
    SEASON_THEMES[seasonId as keyof typeof SEASON_THEMES] ??
    SEASON_THEMES.sakura
  );
}

export const stamp = {
  padding: 16,
  opacity: {
    pixel: 0.93,
    seal: 0.90,
    minimal: 1,
  },
  pixelBorder: 2,
  sealDiameter: 72,
  sealBorder: 2.5,
  minimalBarWidth: 2.5,
  defaultPosition: 'bottom-right' as const,
  defaultStyle: 'pixel' as const,
  storageKey: 'stamp_style_preference',
  positionStorageKey: 'stamp_position_preference',
} as const;
