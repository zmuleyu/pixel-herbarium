// Check-in card template — 360×480 (3:4).
// Top 60%: user photo. Bottom 40%: spot info + date + brand.
// Rendered off-screen for captureRef; also used for scaled preview.

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, getSeasonTheme } from '@/constants/theme';
import type { FlowerSpot } from '@/types/hanami';
import type { SeasonConfig } from '@/constants/seasons';

export interface CardTemplateProps {
  photoUri: string;
  spot: FlowerSpot;
  date: Date;
  season: SeasonConfig;
}

export const CARD_WIDTH = 360;
export const CARD_HEIGHT = 480;
const PHOTO_HEIGHT = 288; // 60%
const INFO_HEIGHT = 192;  // 40%

function formatDateJa(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function CardTemplate({ photoUri, spot, date, season }: CardTemplateProps) {
  const theme = getSeasonTheme(season.id);

  return (
    <View style={styles.card}>
      {/* User photo */}
      <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />

      {/* Info section */}
      <LinearGradient
        colors={[theme.bgTint, theme.accent + 'CC'] as [string, string]}
        style={styles.info}
      >
        {/* Floral divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.primary }]} />
          <Text style={[styles.dividerEmoji, { color: theme.primary }]}>
            {season.iconEmoji}
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.primary }]} />
        </View>

        <Text style={styles.spotName}>{spot.nameJa}</Text>
        <Text style={styles.spotMeta}>
          {spot.prefecture} · {spot.city}
        </Text>
        <Text style={[styles.date, { color: theme.primary }]}>{formatDateJa(date)}</Text>

        {/* App brand */}
        <Text style={styles.brand}>花めぐり</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },

  photo: {
    width: CARD_WIDTH,
    height: PHOTO_HEIGHT,
  },

  info: {
    height: INFO_HEIGHT,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },

  dividerLine: {
    flex: 1,
    height: 1,
  },

  dividerEmoji: {
    fontSize: typography.fontSize.sm,
  },

  spotName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xl,
    color: colors.text,
    textAlign: 'center',
  },

  spotMeta: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  date: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },

  brand: {
    position: 'absolute',
    bottom: spacing.sm,
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
});
