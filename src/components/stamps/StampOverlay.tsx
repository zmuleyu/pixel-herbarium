import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';
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
  /** User-controlled opacity 0-1 (default: 1) */
  userOpacity?: number;
  /** User-controlled scale factor (default: 1.0) */
  userScale?: number;
}

/**
 * Build position style using flexbox centering for center positions.
 * For center-axis positions, the overlay stretches to fill that axis
 * and uses alignItems/justifyContent to center the stamp child.
 */
function getPositionStyle(pos: StampPosition): ViewStyle {
  const p = stampTheme.padding;
  const s: ViewStyle = { position: 'absolute' };

  // Vertical axis
  if (pos.startsWith('top'))       { s.top = p; }
  else if (pos.startsWith('middle') || pos === 'center') {
    s.top = 0; s.bottom = 0; s.justifyContent = 'center';
  }
  else /* bottom */                { s.bottom = p; }

  // Horizontal axis
  if (pos.endsWith('left'))        { s.left = p; }
  else if (pos.endsWith('center') || pos === 'center') {
    s.left = 0; s.right = 0; s.alignItems = 'center';
  }
  else /* right */                 { s.right = p; }

  return s;
}

const SEASON_LABELS: Record<string, string> = {
  sakura: '春', ajisai: '夏', himawari: '夏', momiji: '秋', tsubaki: '冬',
};

export function StampOverlay({
  style, position, spot, date, season,
  userOpacity = 1, userScale = 1,
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

  return (
    <Animated.View
      style={[getPositionStyle(position), { opacity: Animated.multiply(mountOpacity, userOpacity) }]}
      pointerEvents="none"
    >
      <Animated.View style={{ transform: [{ scale: Animated.multiply(mountScale, userScale) }] }}>
        {stampElement}
      </Animated.View>
    </Animated.View>
  );
}
