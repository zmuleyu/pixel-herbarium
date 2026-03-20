import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { getStampColors } from '@/utils/stamp-colors';
import type { LandmarkInfo } from '@/types/hanami';

interface PostcardStampProps {
  spotName: string;
  seasonLabel: string;
  themeColor: string;
  landmark?: LandmarkInfo;
}

/**
 * Generic torii gate outline — generic Phase A placeholder.
 * Draws a simple torii in a 80x44 viewBox.
 */
function ToriiIllustration({ color }: { color: string }) {
  return (
    <Svg width={80} height={44} viewBox="0 0 80 44">
      {/* Left pillar */}
      <Path d="M22 10 L22 44 L26 44 L26 10 Z" fill={color} />
      {/* Right pillar */}
      <Path d="M54 10 L54 44 L58 44 L58 10 Z" fill={color} />
      {/* Top horizontal beam (kasagi) */}
      <Path d="M12 10 L68 10 L68 14 L12 14 Z" fill={color} />
      {/* Slight upward curve on beam ends */}
      <Path d="M10 12 Q12 8 16 10 L12 14 Z" fill={color} />
      <Path d="M70 12 Q68 8 64 10 L68 14 Z" fill={color} />
      {/* Second horizontal beam (nuki) */}
      <Path d="M22 20 L58 20 L58 23 L22 23 Z" fill={color} />
    </Svg>
  );
}

export function PostcardStamp({ spotName, seasonLabel, themeColor, landmark }: PostcardStampProps) {
  const { brandDeep, brandMid } = getStampColors(themeColor);
  const bgIllustration = `${themeColor}20`;
  return (
    <View style={[styles.outer, { borderColor: themeColor }]}>
      {/* Dashed outer border via negative-margin trick using a secondary wrapper */}
      <View style={[styles.inner, { borderColor: `${themeColor}70` }]}>
        {/* Top illustration area */}
        <View style={[styles.illustrationArea, { backgroundColor: bgIllustration }]}>
          <ToriiIllustration color={brandDeep} />
        </View>
        {/* Horizontal divider */}
        <View style={[styles.divider, { backgroundColor: '#f0d0d0' }]} />
        {/* Bottom text area */}
        <View style={styles.textArea}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 4,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  inner: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 2,
    overflow: 'hidden',
    width: 120,
  },
  illustrationArea: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
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
