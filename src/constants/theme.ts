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
    momiji: '#e8a87c',         // Autumn maple
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
