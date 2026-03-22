// src/data/packs/jp/region.ts
import type { RegionConfig, SeasonConfig } from '@/types/region';

const jpSeasons: SeasonConfig[] = [
  {
    id: 'sakura',
    nameKey: 'season.sakura.name',
    themeColor: '#e8a5b0',
    accentColor: '#f5d5d0',
    bgTint: '#FFF5F3',
    iconEmoji: '🌸',
    dateRange: ['03-15', '04-20'] as [string, string],
    spotsDataKey: 'sakura',
  },
  { id: 'ajisai',   nameKey: 'season.ajisai.name',   themeColor: '#7B9FCC', accentColor: '#b8d0ea', bgTint: '#F3F7FF', iconEmoji: '💠', dateRange: ['06-01', '07-15'] as [string, string], spotsDataKey: 'ajisai' },
  { id: 'himawari', nameKey: 'season.himawari.name', themeColor: '#d4a645', accentColor: '#f5e6a3', bgTint: '#FFFBF0', iconEmoji: '🌻', dateRange: ['07-15', '08-31'] as [string, string], spotsDataKey: 'himawari' },
  { id: 'momiji',   nameKey: 'season.momiji.name',   themeColor: '#c4764a', accentColor: '#e8b89c', bgTint: '#FFF5EF', iconEmoji: '🍁', dateRange: ['10-15', '12-05'] as [string, string], spotsDataKey: 'momiji' },
];

const jpRegion: RegionConfig = {
  id: 'jp',
  nameKey: 'region.jp.name',
  bounds: {
    latMin: 24.0,
    latMax: 46.0,
    lonMin: 122.0,
    lonMax: 154.0,
  },
  seasons: jpSeasons,
  defaultLocale: 'ja',
  adminDivisionKey: 'prefecture',
  adminDivisionStandard: 'JIS-X-0401',
  spotCategories: ['park', 'river', 'shrine', 'castle', 'mountain', 'street', 'garden'],
};

export default jpRegion;
