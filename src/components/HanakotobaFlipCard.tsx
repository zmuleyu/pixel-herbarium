import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFlipCard } from '@/hooks/useFlipCard';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

interface HanakotobaFlipCardProps {
  hanakotoba: string;
  flowerMeaning: string | null;
  colorMeaning: string | null;
}

const CARD_HEIGHT = 148;

export function HanakotobaFlipCard({ hanakotoba, flowerMeaning, colorMeaning }: HanakotobaFlipCardProps) {
  const { t } = useTranslation();
  const {
    phase, frontRotation, backRotation,
    frontOpacity, backOpacity,
    handleFlip, showHint, hintOpacity,
  } = useFlipCard();

  // Three faces cycling: JP hanakotoba → Western meaning → Colour meaning
  const faces = [
    { label: t('herbarium.hanakotoba'), text: hanakotoba, bg: colors.white, isJP: true },
    { label: t('plant.westernMeaning'), text: flowerMeaning ?? t('plant.meaningSecret'), bg: colors.creamYellow, isJP: false },
    { label: t('plant.colorMeaning'), text: colorMeaning ?? t('plant.meaningSecret'), bg: colors.plantSecondary, isJP: false },
  ] as const;

  const frontFace = faces[phase];
  const backFace = faces[(phase + 1) % 3];

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handleFlip} style={styles.container} accessibilityLabel="花言葉カード" accessibilityRole="button">
      {/* Front face — shows current phase content, rotates away on tap */}
      <Animated.View style={[
        styles.face,
        { backgroundColor: frontFace.bg, opacity: frontOpacity, transform: [{ perspective: 1000 }, { rotateY: frontRotation }] },
      ]}>
        <Text style={styles.sectionLabel}>{frontFace.label}</Text>
        <Text style={frontFace.isJP ? styles.hanakotobaText : styles.meaningText}>
          {frontFace.text}
        </Text>
        {showHint && phase === 0 && (
          <Animated.Text style={[styles.hintText, { opacity: hintOpacity }]}>
            {t('plant.tapToFlip')}
          </Animated.Text>
        )}
        <PageDots phase={phase} />
      </Animated.View>

      {/* Back face — shows next phase content, rotates into view on tap */}
      <Animated.View style={[
        styles.face,
        { backgroundColor: backFace.bg, opacity: backOpacity, transform: [{ perspective: 1000 }, { rotateY: backRotation }] },
      ]}>
        <Text style={styles.sectionLabel}>{backFace.label}</Text>
        <Text style={backFace.isJP ? styles.hanakotobaText : styles.meaningText}>
          {backFace.text}
        </Text>
        <Text style={styles.watermark}>✿</Text>
        <PageDots phase={(phase + 1) % 3} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function PageDots({ phase }: { phase: number }) {
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, phase === i && styles.dotActive]} testID={`dot-${i}`} />
      ))}
    </View>
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
    bottom: 20,
    right: 12,
    fontSize: typography.fontSize.lg,
    color: colors.plantPrimary,
    opacity: 0.15,
  },
  dots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.plantPrimary,
  },
});
