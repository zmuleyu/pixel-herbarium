import React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { FlowerSpot, StampStyleId, CustomOptions } from '@/types/hanami';
import type { SeasonConfig } from '@/constants/seasons';
import { PREFECTURE_EN } from '@/constants/prefecture-en';
import { STAMP_STYLE_MIGRATION, DEFAULT_STAMP_STYLE_ID } from '@/constants/stamp-styles';
import { ClassicStamp } from './ClassicStamp';
import { ReliefStamp } from './ReliefStamp';
import { PostcardStamp } from './PostcardStamp';
import { MedallionStamp } from './MedallionStamp';
import { WindowStamp } from './WindowStamp';
import { MinimalStamp } from './MinimalStamp';
import { StampDecoration } from './StampDecoration';

interface StampRendererProps {
  /** Accepts new StampStyleId values as well as legacy 'pixel'/'seal' for backward compat */
  styleId: StampStyleId | string;
  spot: FlowerSpot;
  date: Date;
  season: SeasonConfig;
  customOptions?: CustomOptions;
}

const SEASON_LABELS: Record<string, string> = {
  sakura: '春', ajisai: '夏', himawari: '夏', momiji: '秋', tsubaki: '冬',
};

function getEffectStyle(effectType: CustomOptions['effectType'], resolvedColor: string): ViewStyle {
  if (effectType === 'shadow') {
    return {
      shadowColor: '#000000',
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.13,
      shadowRadius: 4,
      elevation: 3,
    };
  }
  if (effectType === 'glow') {
    return {
      shadowColor: resolvedColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.40,
      shadowRadius: 8,
      elevation: 6,
    };
  }
  return {};
}

export function StampRenderer({ styleId, spot, date, season, customOptions }: StampRendererProps) {
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

  // Resolved color: customColor overrides season color
  const resolvedColor =
    resolvedId === 'minimal'
      ? (customOptions?.customColor ?? season.accentColor)
      : (customOptions?.customColor ?? season.themeColor);

  // Derive customText from textMode
  const textMode = customOptions?.textMode ?? 'none';
  const customText: string | undefined =
    textMode === 'hanakotoba' ? (spot.hanakotoba?.slice(0, 12) ?? undefined)
    : textMode === 'custom' ? (customOptions?.customTextValue || undefined)
    : undefined;

  const effectStyle = getEffectStyle(customOptions?.effectType ?? 'none', resolvedColor);
  const decorationKey = customOptions?.decorationKey ?? 'none';

  let stampElement: React.ReactElement;
  switch (resolvedId) {
    case 'classic':
      stampElement = (
        <ClassicStamp
          spotName={spot.nameJa}
          cityEn={cityEn}
          date={date}
          themeColor={resolvedColor}
          landmark={spot.landmark}
          customText={customText}
        />
      );
      break;
    case 'relief':
      stampElement = (
        <ReliefStamp
          spotName={spot.nameJa}
          seasonLabel={seasonLabel}
          themeColor={resolvedColor}
          landmark={spot.landmark}
          customText={customText}
        />
      );
      break;
    case 'postcard':
      stampElement = (
        <PostcardStamp
          spotName={spot.nameJa}
          seasonLabel={seasonLabel}
          themeColor={resolvedColor}
          landmark={spot.landmark}
          customText={customText}
        />
      );
      break;
    case 'medallion':
      stampElement = (
        <MedallionStamp
          spotName={spot.nameJa}
          seasonLabel={seasonLabel}
          themeColor={resolvedColor}
          landmark={spot.landmark}
          customText={customText}
        />
      );
      break;
    case 'window':
      stampElement = (
        <WindowStamp
          spotName={spot.nameJa}
          seasonLabel={seasonLabel}
          themeColor={resolvedColor}
          landmark={spot.landmark}
          customText={customText}
        />
      );
      break;
    case 'minimal':
      stampElement = (
        <MinimalStamp
          spotName={spot.nameJa}
          cityEn={cityEn}
          date={date}
          accentColor={resolvedColor}
          customText={customText}
        />
      );
      break;
    default:
      stampElement = (
        <ClassicStamp
          spotName={spot.nameJa}
          cityEn={cityEn}
          date={date}
          themeColor={resolvedColor}
          landmark={spot.landmark}
          customText={customText}
        />
      );
  }

  return (
    <View style={[{ position: 'relative' }, effectStyle]}>
      {stampElement}
      {decorationKey !== 'none' && (
        <StampDecoration
          decorationKey={decorationKey}
          color={resolvedColor}
          styleId={resolvedId}
        />
      )}
    </View>
  );
}
