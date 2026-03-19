// src/types/region.ts
// SeasonConfig lives here to prevent circular dependency with constants/seasons.ts.
// constants/seasons.ts re-exports it for backward compatibility.

export interface SeasonConfig {
  id: string;
  nameKey: string;
  themeColor: string;
  accentColor: string;
  bgTint: string;
  iconEmoji: string;
  dateRange: [string, string];
  spotsDataKey: string;
}

export interface GeoBounds {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export interface RegionConfig {
  id: string;
  nameKey: string;
  bounds: GeoBounds;
  seasons: SeasonConfig[];
  defaultLocale: string;
  adminDivisionKey: string;
  adminDivisionStandard?: string;
  spotCategories: string[];
}
