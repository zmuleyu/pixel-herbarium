import { useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { getActiveSeason } from '@/constants/seasons';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  fontWeight,
  shadows,
  getSeasonTheme,
} from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useCheckinStore } from '@/stores/checkin-store';
import { useStaggeredEntry } from '@/hooks/useStaggeredEntry';
import { loadSpotsData } from '@/services/content-pack';

function formatJapaneseDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const w = weekdays[date.getDay()];
  return `${m}月${d}日（${w}）`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getSpotName(seasonId: string, spotId: number): string {
  const data = loadSpotsData(seasonId);
  if (!data) return String(spotId);
  return data.spots.find((s) => s.id === spotId)?.nameJa ?? String(spotId);
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);
  const history = useCheckinStore((s) => s.history);
  const loadHistory = useCheckinStore((s) => s.loadHistory);

  // Staggered entry: header(0) + primaryCTA(1) + secondaryCTA(2) + bottomArea(3)
  const { getStyle: entryStyle } = useStaggeredEntry({ count: 4 });

  useEffect(() => {
    loadHistory();
  }, []);

  const recentRecord = history.length > 0 ? history[0] : null;

  return (
    <ScrollView
      testID="home.container"
      style={[styles.container, { backgroundColor: theme.bgTint }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Season gradient header */}
      <Animated.View style={entryStyle(0)}>
        <LinearGradient
          colors={[theme.accent, theme.bgTint, colors.background]}
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.headerGradient}
        >
          <Text style={styles.seasonEmoji}>{season.iconEmoji}</Text>
          <Text style={[styles.seasonName, { color: theme.primary }]}>
            {t(season.nameKey)}
          </Text>
          <Text style={styles.dateText}>{formatJapaneseDate(new Date())}</Text>
        </LinearGradient>
      </Animated.View>

      {/* 2. Primary CTA — camera */}
      <Animated.View style={entryStyle(1)}>
        <TouchableOpacity
          style={[styles.primaryCta, { backgroundColor: colors.blushPink }]}
          onPress={() => router.push('/checkin-wizard' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryCtaEmoji}>📷</Text>
          <Text style={[styles.primaryCtaText, { color: colors.plantPrimary }]}>
            {t('home.captureCta')}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 3. Secondary CTA — library */}
      <Animated.View style={entryStyle(2)}>
        <TouchableOpacity
          style={[styles.secondaryCta, { borderColor: colors.blushPink }]}
          onPress={() => router.push('/(tabs)/diary' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryCtaEmoji}>🖼️</Text>
          <Text style={styles.secondaryCtaText}>
            {t('home.libraryCtaLabel')}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 4. Bottom area: recent record or welcome */}
      <Animated.View style={entryStyle(3)}>
        {recentRecord ? (
          /* Recent record preview */
          <TouchableOpacity
            style={[styles.recentCard, { borderColor: theme.accent }]}
            onPress={() => router.push('/(tabs)/diary' as any)}
            activeOpacity={0.85}
          >
            <Text style={[styles.recentLabel, { color: theme.primary }]}>
              {t('home.recentRecord')}
            </Text>
            <View style={styles.recentRow}>
              {recentRecord.composedUri ? (
                <Image
                  source={{ uri: recentRecord.composedUri }}
                  style={styles.recentThumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.recentThumb, styles.recentThumbPlaceholder, { backgroundColor: theme.bgTint }]}>
                  <Text style={styles.recentThumbEmoji}>{season.iconEmoji}</Text>
                </View>
              )}
              <View style={styles.recentInfo}>
                <Text style={styles.recentSpotName} numberOfLines={1}>
                  {getSpotName(recentRecord.seasonId, recentRecord.spotId)}
                </Text>
                <Text style={styles.recentDate}>
                  {formatDateShort(recentRecord.timestamp)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          /* Welcome section for new users */
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeTitle, { color: theme.primary }]}>
              {t('home.emptyWelcomeTitle')}
            </Text>
            <Text style={styles.welcomeSub}>
              {t('home.emptyWelcomeSub')}
            </Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  // Season gradient header
  headerGradient: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  seasonEmoji: { fontSize: 40 },
  seasonName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
    fontWeight: fontWeight.heavy,
    textAlign: 'center',
    letterSpacing: 1,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.light,
  },

  // Primary CTA (camera)
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    height: 56,
    ...shadows.card,
  },
  primaryCtaEmoji: { fontSize: 20 },
  primaryCtaText: {
    fontSize: typography.fontSize.md,
    fontWeight: fontWeight.bold,
    fontFamily: typography.fontFamily.display,
  },

  // Secondary CTA (library)
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    height: 48,
    backgroundColor: colors.white,
    borderWidth: 1.5,
  },
  secondaryCtaEmoji: { fontSize: 18 },
  secondaryCtaText: {
    fontSize: typography.fontSize.md,
    fontWeight: fontWeight.semibold,
    fontFamily: typography.fontFamily.display,
    color: colors.text,
  },

  // Recent record card
  recentCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.sm,
    ...shadows.cardSubtle,
  },
  recentLabel: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recentThumb: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  recentThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentThumbEmoji: {
    fontSize: 28,
    opacity: 0.6,
  },
  recentInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  recentSpotName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  recentDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  // Welcome section
  welcomeSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  welcomeTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight,
  },
});
