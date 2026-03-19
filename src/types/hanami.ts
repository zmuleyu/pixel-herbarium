// Types for the seasonal flower spot check-in system.
// Generic across all seasons (sakura, ajisai, himawari, momiji, tsubaki).

export interface LandmarkInfo {
  nameJa: string;   // e.g. "天守閣"
  nameEn: string;   // e.g. "Tenshu (Main Keep)"
  /** Asset key for pixel art image (used by ClassicStamp) — added in Phase B */
  pixelArtKey?: string;
  /** Asset key for SVG outline (used by Medallion/Window) — added in Phase B */
  sealSvgKey?: string;
}

export interface FlowerSpot {
  id: number;
  regionId: string; // 'jp', 'cn', etc.
  seasonId: string; // links to SeasonConfig.id
  nameJa: string;
  nameEn: string;
  prefecture: string;
  prefectureCode: number; // JIS X 0401 (01-47)
  city: string;
  category: SpotCategory;
  treeCount?: number;
  bloomTypical: BloomWindow;
  latitude: number;
  longitude: number;
  description?: string;
  tags: string[];
  landmark?: LandmarkInfo;
}

export type SpotCategory =
  | 'park'
  | 'river'
  | 'shrine'
  | 'castle'
  | 'mountain'
  | 'street'
  | 'garden';

export interface BloomWindow {
  earlyStart: string; // "MM-DD"
  peakStart: string;
  peakEnd: string;
  lateEnd: string;
}

export type BloomStatus =
  | 'pre'
  | 'budding'
  | 'partial'
  | 'peak'
  | 'falling'
  | 'ended';

export interface CheckinRecord {
  id: string; // UUID
  seasonId: string;
  spotId: number;
  photoUri: string; // local file path
  composedUri: string; // rendered template path
  templateId: string; // now stores stampStyle value: 'pixel' | 'seal' | 'minimal'
  timestamp: string; // ISO 8601
  synced: boolean;
  stampStyle?: StampStyle | StampStyleId;  // optional for backward compat with old records
  stampPosition?: StampPosition; // optional for backward compat with old records
}

export type StampStyle = 'pixel' | 'seal' | 'minimal';
export type StampStyleId = 'classic' | 'relief' | 'postcard' | 'medallion' | 'window' | 'minimal';
export type StampPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type TemplateStyle = 'pixel' | 'seal' | 'minimal';

export interface SpotsData {
  version: number;
  seasonId: string;
  spots: FlowerSpot[];
}
