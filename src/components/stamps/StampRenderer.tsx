import React from 'react';
import type { FlowerSpot, StampStyleId } from '@/types/hanami';
import type { SeasonConfig } from '@/constants/seasons';
import { PREFECTURE_EN } from '@/constants/prefecture-en';
import { STAMP_STYLE_MIGRATION, DEFAULT_STAMP_STYLE_ID } from '@/constants/stamp-styles';
import { ClassicStamp } from './ClassicStamp';
import { ReliefStamp } from './ReliefStamp';
import { PostcardStamp } from './PostcardStamp';
import { MedallionStamp } from './MedallionStamp';
import { WindowStamp } from './WindowStamp';
import { MinimalStamp } from './MinimalStamp';

interface StampRendererProps {
  /** Accepts new StampStyleId values as well as legacy 'pixel'/'seal' for backward compat */
  styleId: StampStyleId | string;
  spot: FlowerSpot;
  date: Date;
  season: SeasonConfig;
}

const SEASON_LABELS: Record<string, string> = {
  sakura: '春', ajisai: '夏', himawari: '夏', momiji: '秋', tsubaki: '冬',
};

export function StampRenderer({ styleId, spot, date, season }: StampRendererProps) {
  // Migrate legacy style IDs (pixel → classic, seal → medallion)
  const resolvedId: StampStyleId = (
    STAMP_STYLE_MIGRATION[styleId] ?? styleId ?? DEFAULT_STAMP_STYLE_ID
  ) as StampStyleId;

  const cityEn =
    PREFECTURE_EN[spot.prefectureCode] ??
    spot.nameEn.split(' ').pop()?.toUpperCase() ??
    '';
  const year = date.getFullYear();
  const seasonLabel = `${year}${SEASON_LABELS[season.id] ?? ''}`;

  switch (resolvedId) {
    case 'classic':
      return (
        <ClassicStamp
          spotName={spot.nameJa}
          cityEn={cityEn}
          date={date}
          themeColor={season.themeColor}
          landmark={spot.landmark}
        />
      );
    case 'relief':
      return (
        <ReliefStamp
          spotName={spot.nameJa}
          seasonLabel={seasonLabel}
          themeColor={season.themeColor}
          landmark={spot.landmark}
        />
      );
    case 'postcard':
      return (
        <PostcardStamp
          spotName={spot.nameJa}
          seasonLabel={seasonLabel}
          themeColor={season.themeColor}
          landmark={spot.landmark}
        />
      );
    case 'medallion':
      return (
        <MedallionStamp
          spotName={spot.nameJa}
          seasonLabel={seasonLabel}
          themeColor={season.themeColor}
          landmark={spot.landmark}
        />
      );
    case 'window':
      return (
        <WindowStamp
          spotName={spot.nameJa}
          seasonLabel={seasonLabel}
          themeColor={season.themeColor}
          landmark={spot.landmark}
        />
      );
    case 'minimal':
      return (
        <MinimalStamp
          spotName={spot.nameJa}
          cityEn={cityEn}
          date={date}
          accentColor={season.accentColor}
        />
      );
    default:
      return (
        <ClassicStamp
          spotName={spot.nameJa}
          cityEn={cityEn}
          date={date}
          themeColor={season.themeColor}
          landmark={spot.landmark}
        />
      );
  }
}
