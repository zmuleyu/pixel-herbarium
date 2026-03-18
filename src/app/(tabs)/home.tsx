import { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
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
  getSeasonTheme,
} from '@/constants/theme';
import {
  getBloomStatus,
  getBloomStatusLabel,
  getBloomStatusColor,
  getFeaturedSpot,
} from '@/utils/bloom';
import { useCheckinStore } from '@/stores/checkin-store';
import type { FlowerSpot } from '@/types/hanami';

import sakuraData from '@/data/seasons/sakura.json';

// Map seasonId to spot data
const SEASON_SPOTS: Record<string, FlowerSpot[]> = {
  sakura: sakuraData.spots as FlowerSpot[],
};

function formatJapaneseDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const w = weekdays[date.getDay()];
  return `${m}月${d}日（${w}）`;
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);
  const spots = SEASON_SPOTS[season.id] ?? [];
  const featured = getFeaturedSpot(spots);
  const history = useCheckinStore((s) => s.history);
  const loadHistory = useCheckinStore((s) => s.loadHistory);
  const recentCheckins = history
    .filter((h) => h.seasonId === season.id)
    .slice(0, 2);

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <ScrollView
      testID="home.container"
      style={[styles.container, { backgroundColor: theme.bgTint }]}
      contentContainerStyle={styles.content}
    >
      {/* Season Header */}
      <View style={styles.header}>
        <Text style={styles.seasonEmoji}>{season.iconEmoji}</Text>
        <Text style={[styles.seasonName, { color: theme.primary }]}>
          {t(season.nameKey)}
        </Text>
        <Text style={styles.dateText}>{formatJapaneseDate(new Date())}</Text>
      </View>

      {/* Featured Spot Card */}
      {featured && (
        <View style={[styles.featuredCard, { borderColor: theme.accent }]}>
          <Text style={styles.featuredLabel}>
            {t('season.sakura.featuredTitle')}
          </Text>
          <Text style={styles.featuredName}>{featured.nameJa}</Text>
          <View style={styles.featuredMeta}>
            <Text style={styles.featuredLocation}>
              {featured.prefecture} {featured.city}
            </Text>
            <BloomBadge spot={featured} />
          </View>
          {featured.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {featured.tags.slice(0, 3).map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: theme.accent }]}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Bloom Status Row */}
      {spots.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bloomRow}
        >
          {spots.slice(0, 8).map((spot) => (
            <View key={spot.id} style={styles.bloomItem}>
              <Text style={styles.bloomSpotName} numberOfLines={1}>
                {spot.nameJa}
              </Text>
              <BloomBadge spot={spot} />
            </View>
          ))}
        </ScrollView>
      )}

      {/* CTA Button */}
      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/(tabs)/checkin')}
        activeOpacity={0.8}
      >
        <Text style={styles.ctaText}>
          {t(`season.${season.id}.cta`)}
        </Text>
      </TouchableOpacity>

      {/* Recent Check-ins or Empty State */}
      {recentCheckins.length > 0 ? (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>{t('home.recentTitle')}</Text>
          {recentCheckins.map((record) => {
            const spot = spots.find((s) => s.id === record.spotId);
            return (
              <View key={record.id} style={styles.recentCard}>
                <Text style={styles.recentSpot}>
                  {spot?.nameJa ?? `Spot #${record.spotId}`}
                </Text>
                <Text style={styles.recentDate}>
                  {new Date(record.timestamp).toLocaleDateString('ja-JP')}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {t(`season.${season.id}.empty`)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// Bloom status badge sub-component
function BloomBadge({ spot }: { spot: FlowerSpot }) {
  const { t } = useTranslation();
  const status = getBloomStatus(spot);
  const color = getBloomStatusColor(status);
  const label = getBloomStatusLabel(status);

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{t(label)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },

  // Header
  header: { alignItems: 'center', gap: spacing.xs },
  seasonEmoji: { fontSize: 40 },
  seasonName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  // Featured card
  featuredCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.sm,
  },
  featuredLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featuredName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xl,
    color: colors.text,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  tag: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
  },

  // Bloom status row
  bloomRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  bloomItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 90,
  },
  bloomSpotName: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontFamily: typography.fontFamily.display,
  },

  // Badge
  badge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontWeight: '600',
  },

  // CTA
  ctaButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    color: colors.white,
  },

  // Recent section
  recentSection: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    color: colors.text,
  },
  recentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentSpot: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  recentDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  // Empty state
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight,
  },
});
