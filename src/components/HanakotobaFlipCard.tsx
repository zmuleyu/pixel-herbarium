import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFlipCard } from '@/hooks/useFlipCard';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

interface HanakotobaFlipCardProps {
  hanakotoba: string;
  flowerMeaning: string | null;
}

const CARD_HEIGHT = 140;

export function HanakotobaFlipCard({ hanakotoba, flowerMeaning }: HanakotobaFlipCardProps) {
  const { t } = useTranslation();
  const {
    frontRotation, backRotation,
    frontOpacity, backOpacity,
    handleFlip, showHint, hintOpacity,
  } = useFlipCard();

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handleFlip} style={styles.container}>
      {/* Front face — Japanese hanakotoba */}
      <Animated.View style={[
        styles.face, styles.front,
        { opacity: frontOpacity, transform: [{ perspective: 1000 }, { rotateY: frontRotation }] },
      ]}>
        <Text style={styles.sectionLabel}>{t('herbarium.hanakotoba')}</Text>
        <Text style={styles.hanakotobaText}>{hanakotoba}</Text>
        {showHint && (
          <Animated.Text style={[styles.hintText, { opacity: hintOpacity }]}>
            {t('plant.tapToFlip')}
          </Animated.Text>
        )}
      </Animated.View>

      {/* Back face — Western meaning */}
      <Animated.View style={[
        styles.face, styles.back,
        { opacity: backOpacity, transform: [{ perspective: 1000 }, { rotateY: backRotation }] },
      ]}>
        <Text style={styles.sectionLabel}>{t('plant.westernMeaning')}</Text>
        <Text style={styles.meaningText}>
          {flowerMeaning ?? t('plant.meaningSecret')}
        </Text>
        <Text style={styles.watermark}>✿</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: CARD_HEIGHT,
    marginBottom: spacing.md,
  },
  face: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  front: {
    backgroundColor: colors.white,
  },
  back: {
    backgroundColor: colors.creamYellow,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hanakotobaText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xl,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 4,
  },
  meaningText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  watermark: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: typography.fontSize.lg,
    color: colors.plantPrimary,
    opacity: 0.15,
  },
});
