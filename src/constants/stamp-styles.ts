import type { StampStyleId } from '@/types/hanami';

export interface StampStyleConfig {
  id: StampStyleId;
  nameKey: string;        // i18n key, e.g. 'stamp.styleClassic'
  descriptionKey: string; // i18n key
  requiresLandmark: boolean; // false only for 'minimal'
}

export const STAMP_STYLES: StampStyleConfig[] = [
  {
    id: 'classic',
    nameKey: 'stamp.styleClassic',
    descriptionKey: 'stamp.styleClassicDesc',
    requiresLandmark: false,
  },
  {
    id: 'relief',
    nameKey: 'stamp.styleRelief',
    descriptionKey: 'stamp.styleReliefDesc',
    requiresLandmark: false,
  },
  {
    id: 'postcard',
    nameKey: 'stamp.stylePostcard',
    descriptionKey: 'stamp.stylePostcardDesc',
    requiresLandmark: false,
  },
  {
    id: 'medallion',
    nameKey: 'stamp.styleMedallion',
    descriptionKey: 'stamp.styleMedallionDesc',
    requiresLandmark: false,
  },
  {
    id: 'window',
    nameKey: 'stamp.styleWindow',
    descriptionKey: 'stamp.styleWindowDesc',
    requiresLandmark: false,
  },
  {
    id: 'minimal',
    nameKey: 'stamp.styleMinimal',
    descriptionKey: 'stamp.styleMinimalDesc',
    requiresLandmark: false,
  },
];

/** Maps old StampStyle values to new StampStyleId */
export const STAMP_STYLE_MIGRATION: Record<string, StampStyleId> = {
  pixel: 'classic',
  seal: 'medallion',
  minimal: 'minimal',
};

export const DEFAULT_STAMP_STYLE_ID: StampStyleId = 'classic';
