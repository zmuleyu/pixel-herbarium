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
}

function getPositionStyle(pos: StampPosition) {
  const p = stampTheme.padding;
  switch (pos) {
    case 'top-left': return { top: p, left: p };
    case 'top-right': return { top: p, right: p };
    case 'bottom-left': return { bottom: p, left: p };
    case 'bottom-right': return { bottom: p, right: p };
  }
}

const SEASON_LABELS: Record<string, string> = {
  sakura: '春', ajisai: '夏', himawari: '夏', momiji: '秋', tsubaki: '冬',
};

export function StampOverlay({ style, position, spot, date, season }: StampOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(opacity, { toValue: 1, useNativeDriver: true }).start();
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
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
    }
  })();

  return (
    <Animated.View style={[styles.overlay, getPositionStyle(position), { opacity, transform: [{ scale }] }]}>
      {stampElement}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute' },
});
