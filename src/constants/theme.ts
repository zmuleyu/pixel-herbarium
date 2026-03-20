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

export const fontWeight = {
  light: '300' as const,    // Body text, captions
  regular: '400' as const,  // Default
  semibold: '600' as const, // Badges, labels
  bold: '800' as const,     // Section headers
  heavy: '900' as const,    // Hero display (plant names)
} as const;

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 9999,
} as const;

// Elevated shadow — deeper, softer blur for cards with presence
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4, // Android
  },
  cardSubtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLifted: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
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

/** 8-color palette for stamp line color customization. Index 0 matches sakura themeColor. */
export const STAMP_COLOR_PALETTE = [
  '#e8a5b0', // 桜色 (season default for sakura)
  '#7B9FCC', // 空色
  '#d4a645', // 山吹色
  '#b07090', // 藤色
  '#6b8f5e', // 萌葱色
  '#8899aa', // 青鼠色
  '#c8a060', // 砂色
  '#aaaaaa', // 薄墨色
] as const;
