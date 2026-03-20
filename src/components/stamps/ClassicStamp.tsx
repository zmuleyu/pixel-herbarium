import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStampColors } from '@/utils/stamp-colors';
import { stamp as stampTheme } from '@/constants/theme';
import type { LandmarkInfo } from '@/types/hanami';

interface ClassicStampProps {
  spotName: string;
  cityEn: string;
  date: Date;
  themeColor: string;
  landmark?: LandmarkInfo;
}

function formatStampDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function ClassicStamp({ spotName, cityEn, date, themeColor, landmark }: ClassicStampProps) {
  const { brandDeep, brandMid } = getStampColors(themeColor);
  return (
    <View style={[styles.container, { borderColor: themeColor }]}>
      {landmark?.nameJa ? (
        <Text style={[styles.landmarkName, { color: brandMid }]} numberOfLines={1}>
          {landmark.nameJa}
        </Text>
      ) : null}
      <Text style={[styles.spotName, { color: brandDeep }]} numberOfLines={2}>
        {spotName}
      </Text>
      <Text style={[styles.meta, { color: brandMid }]}>
        {formatStampDate(date)} · {cityEn}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderWidth: 2,
    borderRadius: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    minWidth: 130,
    opacity: stampTheme.opacity.pixel,
  },
  landmarkName: {
    fontSize: 10,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  spotName: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  meta: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.3,
  },
});
