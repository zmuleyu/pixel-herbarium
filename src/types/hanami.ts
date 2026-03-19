// Types for the seasonal flower spot check-in system.
// Generic across all seasons (sakura, ajisai, himawari, momiji, tsubaki).

export interface FlowerSpot {
  id: number;
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
  templateId: string;
  timestamp: string; // ISO 8601
  synced: boolean;
}

export type TemplateStyle = 'card' | 'watermark' | 'pixel';

export type StampStyle = 'pixel' | 'seal' | 'minimal';

export type StampPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface SpotsData {
  version: number;
  seasonId: string;
  spots: FlowerSpot[];
}
