// src/app/(tabs)/checkin.tsx
// Diary tab — displays check-in history as a photo diary.
// Photo capture is accessed from the Home tab CTA → /checkin-wizard.

import { useEffect } from 'react';
import {
  View,
  Text,
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
import { useCheckinStore } from '@/stores/checkin-store';
import { PressableCard } from '@/components/PressableCard';
import { loadSpotsData } from '@/services/content-pack';
import type { CheckinRecord } from '@/types/hanami';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 16;
const CARD_SIZE = (SCREEN_WIDTH - 48) / 2;

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

function DiaryCard({ record }: { record: CheckinRecord }) {
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
        <Text style={styles.cardSpot} numberOfLines={1}>{spotName}</Text>
        <Text style={styles.cardDate}>{formatDateShort(record.timestamp)}</Text>
      </View>
    </PressableCard>
  );
}

export default function DiaryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);
  const history = useCheckinStore((s) => s.history);
  const loadHistory = useCheckinStore((s) => s.loadHistory);

  useEffect(() => {
    loadHistory();
  }, []);

  const uniqueSpots = new Set(history.map((r) => r.spotId)).size;

  return (
    <FlatList
      testID="diary.container"
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      data={history}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={history.length > 0 ? styles.row : undefined}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>{t('tabs.diary')}</Text>

          {history.length > 0 && (
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderColor: theme.accent }]}>
                <Text style={[styles.statNumber, { color: theme.primary }]}>{history.length}</Text>
                <Text style={styles.statLabel}>{t('diary.totalCheckins')}</Text>
              </View>
              <View style={[styles.statCard, { borderColor: theme.accent }]}>
                <Text style={[styles.statNumber, { color: theme.primary }]}>{uniqueSpots}</Text>
                <Text style={styles.statLabel}>{t('diary.spotsVisited')}</Text>
              </View>
            </View>
          )}

          {history.length > 0 && (
            <Text style={styles.sectionTitle}>{t('diary.allPhotos')}</Text>
          )}
        </>
      }
      renderItem={({ item }) => <DiaryCard record={item} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>{season.iconEmoji}</Text>
          <Text style={styles.emptyTitle}>{t('diary.emptyTitle')}</Text>
          <Text style={styles.emptySub}>{t('diary.emptySub')}</Text>
          <TouchableOpacity
            style={[styles.emptyCtaButton, { backgroundColor: theme.accent }]}
            onPress={() => router.push('/checkin-wizard' as any)}
            activeOpacity={0.85}
          >
            <Text style={[styles.emptyCtaText, { color: theme.primary }]}>
              {t('home.captureCta')}
            </Text>
          </TouchableOpacity>
        </View>
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

  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
    fontWeight: fontWeight.heavy,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  sectionTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },

  row: { gap: CARD_GAP },

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

  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 48 },
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
    fontWeight: fontWeight.semibold,
  },
});
