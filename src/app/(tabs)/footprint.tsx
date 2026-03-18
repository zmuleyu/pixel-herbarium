// Footprint screen — local check-in history grid.
// Loads from checkin-store; shows composed card thumbnails.

import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius, getSeasonTheme } from '@/constants/theme';
import { getActiveSeason } from '@/constants/seasons';
import { useCheckinStore } from '@/stores/checkin-store';
import type { CheckinRecord } from '@/types/hanami';
import sakuraData from '@/data/seasons/sakura.json';
import type { SpotsData } from '@/types/hanami';

const SCREEN_WIDTH = Dimensions.get('window').width;
const COLUMNS = 2;
const CARD_GAP = spacing.sm;
const CARD_SIZE = (SCREEN_WIDTH - spacing.md * 2 - CARD_GAP) / COLUMNS;

// Map seasonId → spots for name lookup
const SEASON_SPOTS: Record<string, SpotsData> = {
  sakura: sakuraData as SpotsData,
};

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getSpotName(seasonId: string, spotId: number): string {
  const data = SEASON_SPOTS[seasonId];
  if (!data) return String(spotId);
  return data.spots.find((s) => s.id === spotId)?.nameJa ?? String(spotId);
}

function CheckinCard({ record }: { record: CheckinRecord }) {
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);
  const spotName = getSpotName(record.seasonId, record.spotId);

  return (
    <View style={[styles.card, { borderColor: theme.accent }]}>
      <Image
        source={{ uri: record.composedUri }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={[styles.cardFooter, { backgroundColor: theme.bgTint }]}>
        <Text style={styles.cardSpot} numberOfLines={1}>
          {spotName}
        </Text>
        <Text style={styles.cardDate}>{formatDateShort(record.timestamp)}</Text>
      </View>
    </View>
  );
}

export default function FootprintScreen() {
  const { t } = useTranslation();
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);
  const { history, loading, loadHistory } = useCheckinStore();

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <View testID="footprint.container" style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('footprint.title')}</Text>
        {history.length > 0 && (
          <Text style={[styles.count, { color: theme.primary }]}>
            {t('footprint.totalCount', { count: history.length })}
          </Text>
        )}
      </View>

      {/* Grid */}
      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>👣</Text>
          <Text style={styles.emptyText}>{t('footprint.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          numColumns={COLUMNS}
          renderItem={({ item }) => <CheckinCard record={item} />}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },

  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xl,
    color: colors.text,
  },

  count: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.display,
  },

  // Grid

  grid: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: CARD_GAP,
  },

  row: {
    gap: CARD_GAP,
  },

  card: {
    width: CARD_SIZE,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
  },

  cardImage: {
    width: CARD_SIZE,
    height: CARD_SIZE * (4 / 3),
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },

  emptyEmoji: { fontSize: 48 },

  emptyText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
