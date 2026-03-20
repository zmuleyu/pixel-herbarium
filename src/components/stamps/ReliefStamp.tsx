import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { getStampColors } from '@/utils/stamp-colors';
import type { LandmarkInfo } from '@/types/hanami';

interface ReliefStampProps {
  spotName: string;
  seasonLabel: string;
  themeColor: string;
  landmark?: LandmarkInfo;
}

/**
 * Generic multi-tiered pagoda outline — generic Phase A placeholder.
 * Path draws a 3-tier pagoda silhouette in a 80x70 viewBox.
 */
function PagodaWatermark({ color }: { color: string }) {
  return (
    <Svg width={80} height={70} viewBox="0 0 80 70">
      {/* Base platform */}
      <Path d="M10 65 L70 65 L70 60 L10 60 Z" fill={color} />
      {/* Bottom tier body */}
      <Path d="M18 60 L62 60 L62 50 L18 50 Z" fill={color} />
      {/* Bottom tier roof */}
      <Path d="M12 50 L40 42 L68 50 Z" fill={color} />
      {/* Mid tier body */}
      <Path d="M26 42 L54 42 L54 34 L26 34 Z" fill={color} />
      {/* Mid tier roof */}
      <Path d="M18 34 L40 27 L62 34 Z" fill={color} />
      {/* Top tier body */}
      <Path d="M32 27 L48 27 L48 21 L32 21 Z" fill={color} />
      {/* Top tier roof */}
      <Path d="M25 21 L40 14 L55 21 Z" fill={color} />
      {/* Finial */}
      <Path d="M38 14 L42 14 L41 6 L39 6 Z" fill={color} />
    </Svg>
  );
}

export function ReliefStamp({ spotName, seasonLabel, themeColor, landmark }: ReliefStampProps) {
  const { brandDeep, brandMid } = getStampColors(themeColor);
  return (
    <View style={[styles.container, { borderColor: themeColor }]}>
      {/* Watermark pagoda behind text */}
      <View style={styles.watermarkWrap} pointerEvents="none">
        <PagodaWatermark color={brandDeep} />
      </View>
      {/* Foreground text */}
      <View style={styles.textLayer}>
        {landmark?.nameJa ? (
          <Text style={[styles.landmarkName, { color: brandMid }]} numberOfLines={1}>
            {landmark.nameJa}
          </Text>
        ) : null}
        <Text style={[styles.spotName, { color: brandDeep }]} numberOfLines={2}>
          {spotName}
        </Text>
        <Text style={[styles.seasonLabel, { color: brandMid }]}>
          {seasonLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderRadius: 8,
    width: 120,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  watermarkWrap: {
    position: 'absolute',
    opacity: 0.08,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textLayer: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    zIndex: 1,
  },
  landmarkName: {
    fontSize: 9,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  spotName: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  seasonLabel: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.5,
  },
});
