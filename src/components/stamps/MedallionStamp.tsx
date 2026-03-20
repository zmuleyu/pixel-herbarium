import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { getStampColors } from '@/utils/stamp-colors';
import { stamp as stampTheme } from '@/constants/theme';
import type { LandmarkInfo } from '@/types/hanami';

interface MedallionStampProps {
  spotName: string;
  seasonLabel: string;
  themeColor: string;
  landmark?: LandmarkInfo;
}

const DIAMETER = stampTheme.sealDiameter; // 72

/**
 * Generic castle/pagoda silhouette for the top arc area.
 * Drawn in a 48x28 viewBox, centered at top of circle.
 */
function BuildingSilhouette({ color }: { color: string }) {
  return (
    <Svg width={48} height={28} viewBox="0 0 48 28">
      {/* Base */}
      <Path d="M4 27 L44 27 L44 24 L4 24 Z" fill={color} />
      {/* Main body */}
      <Path d="M10 24 L38 24 L38 16 L10 16 Z" fill={color} />
      {/* Roof */}
      <Path d="M6 16 L24 8 L42 16 Z" fill={color} />
      {/* Tower left */}
      <Path d="M13 16 L13 10 L17 10 L17 16 Z" fill={color} />
      {/* Tower right */}
      <Path d="M31 16 L31 10 L35 10 L35 16 Z" fill={color} />
      {/* Central spire */}
      <Path d="M22 8 L26 8 L25 2 L23 2 Z" fill={color} />
    </Svg>
  );
}

export function MedallionStamp({ spotName, seasonLabel, themeColor, landmark }: MedallionStampProps) {
  const { brandDeep, brandMid } = getStampColors(themeColor);
  const radius = DIAMETER / 2;
  return (
    <View style={[styles.container, {
      width: DIAMETER,
      height: DIAMETER,
      borderRadius: radius,
      borderColor: themeColor,
      opacity: stampTheme.opacity.seal,
    }]}>
      {/* Double ring: inner ring */}
      <View style={[styles.innerRing, {
        width: DIAMETER - 8,
        height: DIAMETER - 8,
        borderRadius: (DIAMETER - 8) / 2,
        borderColor: themeColor,
      }]} />
      {/* Building silhouette in top area */}
      <View style={styles.illustrationWrap}>
        <BuildingSilhouette color={brandDeep} />
      </View>
      {/* Center text */}
      <Text style={[styles.spotName, { color: brandDeep }]} numberOfLines={1}>
        {spotName}
      </Text>
      <Text style={[styles.seasonLabel, { color: brandMid }]}>
        {seasonLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 0.6,
  },
  illustrationWrap: {
    opacity: 0.25,
    marginBottom: 2,
    marginTop: -4,
  },
  spotName: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.3,
    paddingHorizontal: 6,
  },
  seasonLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
