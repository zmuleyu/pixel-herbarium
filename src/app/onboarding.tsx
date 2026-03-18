// src/app/onboarding.tsx
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { useOnboardingControls, ONBOARDING_KEY } from '@/hooks/useOnboardingControls';

// Re-export so _layout.tsx import path remains unchanged
export { ONBOARDING_KEY };

const SCREEN_WIDTH = Dimensions.get('window').width;

// Per-slide visual config: gradient and emoji glow colour
const SLIDE_CONFIG = [
  {
    emoji: '🌸',
    gradientColors: ['#fce4ec', '#f5f4f1'] as const,
    glowColor: 'rgba(232,165,176,0.22)',
  },
  {
    emoji: '🗺️',
    gradientColors: ['#e0eaf5', '#f5f4f1'] as const,
    glowColor: 'rgba(100,140,190,0.18)',
  },
  {
    emoji: '📸',
    gradientColors: ['#f5ede0', '#f5f4f1'] as const,
    glowColor: 'rgba(210,160,90,0.15)',
  },
] as const;

export default function OnboardingScreen() {
  const { t } = useTranslation();

  const slides = [
    { title: t('onboarding.slide1Title'), body: t('onboarding.slide1Body') },
    { title: t('onboarding.slide2Title'), body: t('onboarding.slide2Body') },
    { title: t('onboarding.slide3Title'), body: t('onboarding.slide3Body') },
  ];

  const { page, scrollRef, slideAnims, dotAnim, goNext, goBack, finish, onSwipeEnd } =
    useOnboardingControls(slides.length);

  const isLast = page === slides.length - 1;

  return (
    <View style={styles.container}>
      {/* Header: Skip (left) | Step counter (right) */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="onboarding.skip"
          onPress={finish}
          style={[styles.skipBtn, isLast && styles.invisible]}
          disabled={isLast}
        >
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>{page + 1} / {slides.length}</Text>
      </View>

      {/* Slide pager with gradient backgrounds */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onSwipeEnd}
        style={styles.pager}
      >
        {slides.map((slide, i) => {
          const config = SLIDE_CONFIG[i];
          const anim = slideAnims[i];
          // Both opacity and translateY driven by the same Animated.Value (0→1)
          const opacity = anim;
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          });

          return (
            <LinearGradient
              key={i}
              colors={config.gradientColors}
              style={styles.slide}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            >
              <Animated.View
                style={[styles.slideContent, { opacity, transform: [{ translateY }] }]}
              >
                {/* Emoji inside coloured glow circle */}
                <View style={[styles.emojiCircle, { backgroundColor: config.glowColor }]}>
                  <Text style={styles.slideEmoji}>{config.emoji}</Text>
                </View>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideBody}>{slide.body}</Text>
              </Animated.View>
            </LinearGradient>
          );
        })}
      </ScrollView>

      {/* Dot indicators — animated width + colour.
          Each dot has a static base (colors.border) with an active overlay (colors.plantPrimary)
          that fades in/out via opacity interpolation. Width expands 6→20px for the active dot.
          ±0.5 input range: both dots narrow at midpoint of transition (intentional). */}
      <View style={styles.dots}>
        {slides.map((_, i) => {
          const dotWidth = dotAnim.interpolate({
            inputRange: [i - 0.5, i, i + 0.5],
            outputRange: [6, 20, 6],
            extrapolate: 'clamp',
          });
          const activeOpacity = dotAnim.interpolate({
            inputRange: [i - 0.5, i, i + 0.5],
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          return (
            // Static border-color base; active sage-green overlay fades in on top
            <Animated.View
              key={i}
              style={[styles.dotBase, { width: dotWidth, backgroundColor: colors.border }]}
            >
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  { borderRadius: 3, backgroundColor: colors.plantPrimary, opacity: activeOpacity },
                ]}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* Footer: Back (left) | Next / Get Started (right) */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={goBack}
          style={[styles.backBtn, page === 0 && styles.invisible]}
          disabled={page === 0}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {isLast ? t('onboarding.start') : t('onboarding.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
  },

  // Header row
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.sm,
  },
  skipBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minWidth: 72,
  },
  skipText: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  counter:  { color: colors.textSecondary, fontSize: typography.fontSize.sm },

  // Slide pager
  pager: { flex: 1 },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emojiCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideEmoji:  { fontSize: 52 },
  slideTitle:  {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
    color: colors.text,
    textAlign: 'center',
  },
  slideBody:   {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * 1.7,
  },

  // Dot indicators
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
  },
  dotBase: { height: 6, borderRadius: 3, overflow: 'hidden' },

  // Footer row
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  nextBtn: {
    backgroundColor: colors.plantPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  nextText: {
    color: colors.white,
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
  },

  // Shared utility
  invisible: { opacity: 0 }, // hides element without removing from layout
});
