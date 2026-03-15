import { forwardRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { RARITY_LABELS } from '@/constants/plants';

interface SharePosterPlant {
  name_ja: string;
  name_latin: string;
  rarity: number;
  hanakotoba: string;
  pixel_sprite_url: string | null;
  cityRank: number | null;
}

interface SharePosterProps {
  plant: SharePosterPlant;
}

// Fixed 9:16 poster rendered off-screen for ViewShot capture.
// Position it at left:-9999 in the parent to keep it invisible to users.
export const SharePoster = forwardRef<View, SharePosterProps>(function SharePoster({ plant }, ref) {
  const rarityLabel = RARITY_LABELS[plant.rarity as keyof typeof RARITY_LABELS] ?? '★';
  const rarityColor =
    plant.rarity === 3 ? colors.rarity.rare
    : plant.rarity === 2 ? colors.rarity.uncommon
    : colors.rarity.common;

  return (
    <View ref={ref} style={styles.poster}>
      {/* Subtle top accent strip */}
      <View style={[styles.accentStrip, { backgroundColor: rarityColor }]} />

      {/* Plant image */}
      <View style={styles.imageArea}>
        {plant.pixel_sprite_url ? (
          <Image
            source={{ uri: plant.pixel_sprite_url }}
            style={styles.sprite}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.emojiCard, { borderColor: rarityColor }]}>
            <Text style={styles.emoji}>🌸</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.rarityLabel, { color: rarityColor }]}>{rarityLabel}</Text>
        <Text style={styles.nameJa}>{plant.name_ja}</Text>
        <Text style={styles.nameLatin}>{plant.name_latin}</Text>

        <View style={styles.divider} />

        <Text style={styles.hanakotobaLabel}>花言葉</Text>
        <Text style={styles.hanakotoba}>「{plant.hanakotoba}」</Text>

        {plant.cityRank != null && (
          <Text style={styles.cityRank}>
            全国で {plant.cityRank} 番目の発見者 🌿
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.footerDot, { backgroundColor: rarityColor }]} />
        <Text style={styles.appName}>花図鉑</Text>
        <View style={[styles.footerDot, { backgroundColor: rarityColor }]} />
      </View>
    </View>
  );
});

const POSTER_WIDTH = 360;
const POSTER_HEIGHT = 640;

const styles = StyleSheet.create({
  poster: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    backgroundColor: colors.background,
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

  sprite: {
    width: 160,
    height: 160,
    borderRadius: borderRadius.md,
  },

  emojiCard: {
    width: 160,
    height: 160,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emoji: {
    fontSize: 72,
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

  divider: {
    width: 48,
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },

  hanakotobaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 1,
  },

  hanakotoba: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },

  cityRank: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },

  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  appName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
});
