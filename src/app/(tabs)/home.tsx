import { useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
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
import { PressableCard } from '@/components/PressableCard';
import { loadSpotsData } from '@/services/content-pack';
import type { CheckinRecord } from '@/types/hanami';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 16;
const CARD_SIZE = (SCREEN_WIDTH - 48) / 2; // 16 padding each side + 16 gap

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

function CheckinCard({ record }: { record: CheckinRecord }) {
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);
  const spotName = getSpotName(record.seasonId, record.spotId);

  return (
    <PressableCard style={[styles.card, { borderColor: theme.accent }]}>
      {record.composedUri ? (
        <Image
          source={{ uri: record.composedUri }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cardImage, styles.cardPlaceholder, { backgroundColor: theme.bgTint }]}>
          <Text style={styles.cardPlaceholderEmoji}>{season.iconEmoji}</Text>
        </View>
      )}
      <View style={[styles.cardFooter, { backgroundColor: theme.bgTint }]}>
        <Text style={styles.cardSpot} numberOfLines={1}>
          {spotName}
        </Text>
        <Text style={styles.cardDate}>{formatDateShort(record.timestamp)}</Text>
      </View>
    </PressableCard>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);
  const history = useCheckinStore((s) => s.history);
  const loadHistory = useCheckinStore((s) => s.loadHistory);

  // Staggered entry: header(0) + cta(1) + section(2) + grid/empty(3)
  const { getStyle: entryStyle } = useStaggeredEntry({ count: 4 });

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <FlatList
      testID="home.container"
      style={[styles.container, { backgroundColor: theme.bgTint }]}
      contentContainerStyle={styles.content}
      data={history}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={history.length > 0 ? styles.row : undefined}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          {/* Season Header with gradient */}
          <Animated.View style={entryStyle(0)}>
            <LinearGradient
              colors={[theme.bgTint, colors.background]}
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

          {/* 花を撮る CTA */}
          <Animated.View style={entryStyle(1)}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/(tabs)/checkin' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaText}>{t('home.captureCta')}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Diary section title + count */}
          <Animated.View style={[styles.sectionHeader, entryStyle(2)]}>
            <Text style={styles.sectionTitle}>{t('home.diaryTitle')}</Text>
            {history.length > 0 && (
              <Text style={[styles.sectionCount, { color: theme.primary }]}>
                {t('home.diaryCount', { count: history.length })}
              </Text>
            )}
          </Animated.View>
        </>
      }
      renderItem={({ item }) => <CheckinCard record={item} />}
      ListEmptyComponent={
        <Animated.View style={[styles.emptyState, entryStyle(3)]}>
          <Text style={styles.emptyTitle}>{t('home.emptyTitle')}</Text>
          <Text style={styles.emptySub}>{t('home.emptySub')}</Text>
          <TouchableOpacity
            style={[styles.emptyCtaButton, { backgroundColor: colors.blushPink }]}
            onPress={() => router.push('/(tabs)/checkin' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyCtaText}>{t('home.captureCta')}</Text>
          </TouchableOpacity>
        </Animated.View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.xl,
    gap: CARD_GAP,
  },

  // Header gradient
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
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.light,
  },

  // CTA button
  ctaButton: {
    backgroundColor: colors.blushPink,
    borderRadius: borderRadius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: fontWeight.bold,
    color: colors.plantPrimary,
    fontFamily: typography.fontFamily.display,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: fontWeight.bold,
  },
  sectionCount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.display,
  },

  // Grid row
  row: {
    gap: CARD_GAP,
  },

  // Checkin card
  card: {
    width: CARD_SIZE,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    ...shadows.card,
  },
  cardImage: {
    width: CARD_SIZE,
    height: CARD_SIZE * (4 / 3),
  },
  cardPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPlaceholderEmoji: {
    fontSize: 40,
    opacity: 0.6,
  },
  cardFooter: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSpot: {
    flex: 1,
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xs,
    color: colors.text,
  },
  cardDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    color: colors.plantPrimary,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight,
  },
  emptyCtaButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  emptyCtaText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.plantPrimary,
    fontWeight: fontWeight.semibold,
  },
});
