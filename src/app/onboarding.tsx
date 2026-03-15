import { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export const ONBOARDING_KEY = 'onboarding_done_v1';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SLIDES = [
  {
    emoji: '🌸',
    title: '花図鉑へようこそ',
    body: '日本の植物をカメラで発見して\nピクセルアートの図鉑を完成させよう。',
  },
  {
    emoji: '📷',
    title: '撮影して識別',
    body: '植物を見つけたらカメラで撮影。\nAIが種類を識別して、あなただけの\nピクセルアートに変換します。',
  },
  {
    emoji: '🗺️',
    title: '場所を記録する',
    body: 'GPS で発見場所を記録。\n全国何番目の発見者か確認したり、\n都道府県ごとの開花情報を楽しもう。',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  function goNext() {
    if (page < SLIDES.length - 1) {
      const next = page + 1;
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
      setPage(next);
    } else {
      finish();
    }
  }

  async function finish() {
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
    router.replace('/(tabs)/discover');
  }

  const isLast = page === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Slide pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      {/* Skip + Next/Start buttons */}
      <View style={styles.buttonRow}>
        {!isLast ? (
          <TouchableOpacity onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipText}>スキップ</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipBtn} />
        )}
        <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>{isLast ? 'はじめる 🌱' : '次へ'}</Text>
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

  pager: { flex: 1 },

  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  slideEmoji: { fontSize: 80 },
  slideTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
    color: colors.text,
    textAlign: 'center',
  },
  slideBody: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * 1.7,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
  },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 20, backgroundColor: colors.plantPrimary },

  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  skipBtn:  { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, minWidth: 72 },
  skipText: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  nextBtn:  {
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
});
