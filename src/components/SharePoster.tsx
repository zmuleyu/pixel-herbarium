// src/components/SharePoster.tsx
// Off-screen poster component for share image generation.
// Supports three formats:
//   'story' — 360x640 (9:16) Instagram/LINE Story vertical layout
//   'line'  — 360x360 (1:1) LINE Card horizontal layout
//   'spot'  — 360x360 (1:1) Sakura spot check-in share card

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { RARITY_LABELS } from '@/constants/plants';
import { getPlantGradientColors } from '@/utils/plant-gradient';
import type { SharePosterSpot } from '@/types/spot';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SharePosterPlant {
  name_ja: string;
  name_latin: string;
  rarity: number;
  hanakotoba: string;
  pixel_sprite_url: string | null;
  cityRank: number | null;
  bloom_months: number[];
}

export type SharePosterProps =
  | { format: 'story' | 'line'; plant: SharePosterPlant; discoveryDate?: string; discoveryCity?: string }
  | { format: 'spot'; spot: SharePosterSpot };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format an ISO date string into Japanese: 2024年4月1日 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PlantSpriteProps {
  url: string | null;
  size: number;
  borderColor: string;
  nameJa: string;
}

function PlantSprite({ url, size, borderColor, nameJa }: PlantSpriteProps) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[shared.sprite, { width: size, height: size }]}
        resizeMode="contain"
        accessibilityLabel={nameJa}
      />
    );
  }
  return (
    <View style={[shared.emojiCard, { width: size, height: size, borderColor }]} accessibilityLabel={nameJa}>
      <Text style={shared.emoji}>🌸</Text>
    </View>
  );
}

function FloralDivider() {
  return (
    <View style={shared.floralDividerRow}>
      <View style={shared.floralLine} />
      <Text style={shared.floralSymbol}>✿</Text>
      <View style={shared.floralLine} />
    </View>
  );
}

interface HanakotobaBlockProps {
  hanakotoba: string;
}

function HanakotobaBlock({ hanakotoba }: HanakotobaBlockProps) {
  if (!hanakotoba) return null;
  return (
    <View style={shared.hanakotobaBlock}>
      <Text style={shared.hanakotobaLabel}>花言葉</Text>
      <Text style={shared.hanakotobaText}>「{hanakotoba}」</Text>
    </View>
  );
}

function PosterFooter() {
  return (
    <View style={shared.footer}>
      <Text style={shared.footerText}>花図鉑 — Pixel Herbarium</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// StoryPoster (360x640)
// ---------------------------------------------------------------------------

function StoryPoster({ plant, discoveryDate, discoveryCity }: { plant: SharePosterPlant; discoveryDate?: string; discoveryCity?: string }) {
  const gradientColors = getPlantGradientColors(plant.rarity, plant.bloom_months) as [string, string];
  const rarityLabel = RARITY_LABELS[plant.rarity as keyof typeof RARITY_LABELS] ?? '★';
  const rarityColor =
    plant.rarity === 3 ? colors.rarity.rare
    : plant.rarity === 2 ? colors.rarity.uncommon
    : colors.rarity.common;

  // Build metadata line: city · date (filter nulls)
  const metaParts: string[] = [];
  if (discoveryCity) metaParts.push(discoveryCity);
  if (discoveryDate) metaParts.push(formatDate(discoveryDate));
  const metaLine = metaParts.length > 0 ? metaParts.join(' · ') : null;

  return (
    <LinearGradient
      colors={gradientColors}
      style={storyStyles.poster}
    >
      {/* Rarity accent strip */}
      <View style={[storyStyles.accentStrip, { backgroundColor: rarityColor }]} />

      {/* Sprite */}
      <View style={storyStyles.imageArea}>
        <PlantSprite url={plant.pixel_sprite_url} size={160} borderColor={rarityColor} nameJa={plant.name_ja} />
      </View>

      {/* Main content */}
      <View style={storyStyles.content}>
        <Text style={[storyStyles.rarityLabel, { color: rarityColor }]}>{rarityLabel}</Text>
        <Text style={storyStyles.nameJa}>{plant.name_ja}</Text>
        <Text style={storyStyles.nameLatin}>{plant.name_latin}</Text>

        <FloralDivider />

        <HanakotobaBlock hanakotoba={plant.hanakotoba} />

        {plant.cityRank != null && (
          <Text style={storyStyles.cityRank}>
            全国で {plant.cityRank} 番目の発見者 🌿
          </Text>
        )}

        {metaLine != null && (
          <Text style={storyStyles.metaLine}>{metaLine}</Text>
        )}
      </View>

      <PosterFooter />
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// LineCard (360x360)
// ---------------------------------------------------------------------------

function LineCard({ plant, discoveryDate, discoveryCity }: { plant: SharePosterPlant; discoveryDate?: string; discoveryCity?: string }) {
  const gradientColors = getPlantGradientColors(plant.rarity, plant.bloom_months) as [string, string];
  const rarityLabel = RARITY_LABELS[plant.rarity as keyof typeof RARITY_LABELS] ?? '★';
  const rarityColor =
    plant.rarity === 3 ? colors.rarity.rare
    : plant.rarity === 2 ? colors.rarity.uncommon
    : colors.rarity.common;

  const metaParts: string[] = [];
  if (discoveryCity) metaParts.push(discoveryCity);
  if (discoveryDate) metaParts.push(formatDate(discoveryDate));
  const metaLine = metaParts.length > 0 ? metaParts.join(' · ') : null;

  return (
    <LinearGradient
      colors={gradientColors}
      style={lineStyles.card}
    >
      {/* Horizontal body: sprite left, text right */}
      <View style={lineStyles.body}>
        <PlantSprite url={plant.pixel_sprite_url} size={120} borderColor={rarityColor} nameJa={plant.name_ja} />

        <View style={lineStyles.textArea}>
          <Text style={[lineStyles.rarityLabel, { color: rarityColor }]}>{rarityLabel}</Text>
          <Text style={lineStyles.nameJa}>{plant.name_ja}</Text>
          <Text style={lineStyles.nameLatin}>{plant.name_latin}</Text>

          <HanakotobaBlock hanakotoba={plant.hanakotoba} />

          {metaLine != null && (
            <Text style={lineStyles.metaLine}>{metaLine}</Text>
          )}
        </View>
      </View>

      {/* Gift copy */}
      <Text style={lineStyles.giftCopy}>この花をあなたに贈ります 🌸</Text>

      <PosterFooter />
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// SpotPoster (360x360) — sakura spot check-in share card
// ---------------------------------------------------------------------------

function SpotPoster({ spot }: { spot: SharePosterSpot }) {
  const borderColor = spot.stamp_variant === 'mankai' ? '#d4a017' : colors.blushPink;

  return (
    <View style={[spotStyles.canvas, { borderColor, borderWidth: spot.stamp_variant === 'mankai' ? 3 : 0 }]}>
      <LinearGradient
        colors={[colors.seasonal.sakura, colors.blushPink]}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={spotStyles.spotIcon}>{spot.is100sen ? '⭐' : '🌸'}</Text>
      <Text style={spotStyles.spotName}>{spot.name_ja}</Text>
      <Text style={spotStyles.prefecture}>{spot.prefecture}</Text>
      <Text style={spotStyles.date}>{formatDate(spot.checked_in_at)}</Text>
      <Text style={spotStyles.logo}>Pixel Herbarium</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function SharePoster(props: SharePosterProps) {
  if (props.format === 'spot') {
    return <SpotPoster spot={props.spot} />;
  }
  if (props.format === 'line') {
    return <LineCard plant={props.plant} discoveryDate={props.discoveryDate} discoveryCity={props.discoveryCity} />;
  }
  return <StoryPoster plant={props.plant} discoveryDate={props.discoveryDate} discoveryCity={props.discoveryCity} />;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const POSTER_WIDTH = 360;
const STORY_HEIGHT = 640;
const LINE_SIZE = 360;

const shared = StyleSheet.create({
  sprite: {
    borderRadius: borderRadius.md,
  },

  emojiCard: {
    borderRadius: borderRadius.md,
    borderWidth: 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emoji: {
    fontSize: 72,
  },

  floralDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    gap: spacing.xs,
  },

  floralLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  floralSymbol: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  hanakotobaBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },

  hanakotobaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 1,
  },

  hanakotobaText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },

  footer: {
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },

  footerText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
});

const storyStyles = StyleSheet.create({
  poster: {
    width: POSTER_WIDTH,
    height: STORY_HEIGHT,
    alignItems: 'center',
    overflow: 'hidden',
  },

  accentStrip: {
    width: '100%',
    height: 4,
  },

  imageArea: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },

  rarityLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.display,
    letterSpacing: 2,
  },

  nameJa: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  nameLatin: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  cityRank: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  metaLine: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

const lineStyles = StyleSheet.create({
  card: {
    width: LINE_SIZE,
    height: LINE_SIZE,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    justifyContent: 'space-between',
  },

  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    flex: 1,
  },

  textArea: {
    flex: 1,
    gap: spacing.xs,
  },

  rarityLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.display,
    letterSpacing: 2,
  },

  nameJa: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xl,
    color: colors.text,
  },

  nameLatin: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  metaLine: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  giftCopy: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});

const spotStyles = StyleSheet.create({
  canvas: {
    width: 360, height: 360,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: borderRadius.md,
  },
  spotIcon:   { fontSize: 64, marginBottom: 8 },
  spotName:   {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
    color: colors.text, textAlign: 'center', marginBottom: spacing.xs,
  },
  prefecture: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  date:       { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  logo:       {
    fontSize: typography.fontSize.xs, color: colors.textSecondary,
    position: 'absolute', bottom: 12, right: 12,
  },
});
