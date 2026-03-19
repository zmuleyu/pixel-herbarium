import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { stamp as stampTheme } from '@/constants/theme';
import { PixelStamp } from './PixelStamp';
import { SealStamp } from './SealStamp';
import { MinimalStamp } from './MinimalStamp';
import type { StampStyle, StampPosition, FlowerSpot } from '@/types/hanami';
import type { SeasonConfig } from '@/constants/seasons';
import { PREFECTURE_EN } from '@/constants/prefecture-en';

interface StampOverlayProps {
  style: StampStyle;
  position: StampPosition;
  spot: FlowerSpot;
  date: Date;
  season: SeasonConfig;
  /** User-controlled opacity 0-1 (default: style-specific from theme) */
  userOpacity?: number;
  /** User-controlled scale factor (default: 1.0) */
  userScale?: number;
}

function getPositionStyle(pos: StampPosition) {
  const p = stampTheme.padding;
  switch (pos) {
    case 'top-left':      return { top: p, left: p };
    case 'top-center':    return { top: p, left: '50%' as any, transform: [{ translateX: -50 }] };
    case 'top-right':     return { top: p, right: p };
    case 'middle-left':   return { top: '50%' as any, left: p, transform: [{ translateY: -20 }] };
    case 'center':        return { top: '50%' as any, left: '50%' as any, transform: [{ translateX: -50 }, { translateY: -20 }] };
    case 'middle-right':  return { top: '50%' as any, right: p, transform: [{ translateY: -20 }] };
    case 'bottom-left':   return { bottom: p, left: p };
    case 'bottom-center': return { bottom: p, left: '50%' as any, transform: [{ translateX: -50 }] };
    case 'bottom-right':  return { bottom: p, right: p };
  }
}

const SEASON_LABELS: Record<string, string> = {
  sakura: '春', ajisai: '夏', himawari: '夏', momiji: '秋', tsubaki: '冬',
};

export function StampOverlay({
  style, position, spot, date, season,
  userOpacity, userScale,
}: StampOverlayProps) {
  const mountOpacity = useRef(new Animated.Value(0)).current;
  const mountScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(mountOpacity, { toValue: 1, useNativeDriver: true }).start();
    Animated.spring(mountScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, []);

  const cityEn = PREFECTURE_EN[spot.prefectureCode] ?? spot.nameEn.split(' ').pop()?.toUpperCase() ?? '';

  const stampElement = (() => {
    switch (style) {
      case 'pixel':
        return <PixelStamp spotName={spot.nameJa} cityEn={cityEn} date={date} themeColor={season.themeColor} />;
      case 'seal':
        return <SealStamp spotName={spot.nameJa} seasonEmoji={season.iconEmoji} year={date.getFullYear()} seasonLabel={SEASON_LABELS[season.id] ?? ''} themeColor={season.themeColor} />;
      case 'minimal':
        return <MinimalStamp spotName={spot.nameJa} cityEn={cityEn} date={date} accentColor={season.accentColor} />;
      default:
        return <PixelStamp spotName={spot.nameJa} cityEn={cityEn} date={date} themeColor={season.themeColor} />;
    }
  })();

  // Merge position style, stripping transform to combine with animated transform
  const posStyle = getPositionStyle(position);
  const { transform: posTransform, ...posRest } = posStyle as any;

  // Build combined transform: mount animation + position offset + user scale
  const combinedTransform: any[] = [
    { scale: Animated.multiply(mountScale, userScale ?? 1) },
    ...(posTransform ?? []),
  ];

  return (
    <Animated.View style={[
      styles.overlay,
      posRest,
      {
        opacity: Animated.multiply(mountOpacity, userOpacity ?? 1),
        transform: combinedTransform,
      },
    ]}>
      {stampElement}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute' },
});
