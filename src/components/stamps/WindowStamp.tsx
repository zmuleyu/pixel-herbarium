import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { getStampColors } from '@/utils/stamp-colors';
import type { LandmarkInfo } from '@/types/hanami';

interface WindowStampProps {
  spotName: string;
  seasonLabel: string;
  themeColor: string;
  landmark?: LandmarkInfo;
}

/**
 * Simple arch/pagoda shape as white "window" cutout.
 * Drawn in a 80x50 viewBox — fills the top white area.
 */
function WindowShape({ color }: { color: string }) {
  return (
    <Svg width={80} height={50} viewBox="0 0 80 50">
      {/* Pagoda silhouette as window shape */}
      {/* Base */}
      <Path d="M8 49 L72 49 L72 44 L8 44 Z" fill={color} />
      {/* Body */}
      <Path d="M16 44 L64 44 L64 34 L16 34 Z" fill={color} />
      {/* Bottom roof */}
      <Path d="M8 34 L40 25 L72 34 Z" fill={color} />
      {/* Upper body */}
      <Path d="M24 25 L56 25 L56 18 L24 18 Z" fill={color} />
      {/* Upper roof */}
      <Path d="M16 18 L40 10 L64 18 Z" fill={color} />
      {/* Top body */}
      <Path d="M32 10 L48 10 L48 5 L32 5 Z" fill={color} />
      {/* Finial */}
      <Path d="M38 5 L42 5 L40 1 Z" fill={color} />
    </Svg>
  );
}

export function WindowStamp({ spotName, seasonLabel, themeColor, landmark }: WindowStampProps) {
  const { brandDeep, brandMid } = getStampColors(themeColor);
  const bgPink = `${themeColor}15`;
  return (
    <View style={[styles.container, { borderColor: themeColor, backgroundColor: bgPink }]}>
      {/* Top white area with pagoda silhouette */}
      <View style={styles.windowArea}>
        <WindowShape color={brandDeep} />
      </View>
      {/* Bottom text section on pale pink */}
      <View style={[styles.textArea, { backgroundColor: bgPink }]}>
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
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    width: 116,
  },
  windowArea: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 4,
    paddingBottom: 2,
  },
  textArea: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  landmarkName: {
    fontSize: 9,
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  spotName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  seasonLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.4,
  },
});
