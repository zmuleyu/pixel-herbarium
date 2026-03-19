// Scrollable spot list for check-in spot selection.
// Shows bloom status badge per spot; supports text search across name/prefecture/city.

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  getSeasonTheme,
} from '@/constants/theme';
import { getActiveSeason } from '@/constants/seasons';
import {
  getBloomStatus,
  getBloomStatusLabel,
  getBloomStatusColor,
} from '@/utils/bloom';
import type { FlowerSpot } from '@/types/hanami';

interface SpotSelectorProps {
  spots: FlowerSpot[];
  onSelect: (spot: FlowerSpot) => void;
}

export function SpotSelector({ spots, onSelect }: SpotSelectorProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);

  const filtered =
    query.trim().length === 0
      ? spots
      : spots.filter(
          (s) =>
            s.nameJa.includes(query) ||
            s.nameEn.toLowerCase().includes(query.toLowerCase()) ||
            s.prefecture.includes(query) ||
            s.city.includes(query),
        );

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.searchInput, { borderColor: theme.primary }]}
        value={query}
        onChangeText={setQuery}
        placeholder={t('checkin.spotSearchPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const bloomStatus = getBloomStatus(item);
          const labelKey = getBloomStatusLabel(bloomStatus);
          const statusColor = getBloomStatusColor(bloomStatus);
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.nameJa}>{item.nameJa}</Text>
                <Text style={styles.prefCity}>
                  {item.prefecture} · {item.city}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: statusColor + '22',
                    borderColor: statusColor,
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: statusColor }]}>
                  {t(labelKey)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  searchInput: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    backgroundColor: colors.white,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },

  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },

  rowLeft: { flex: 1, gap: 2 },

  nameJa: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },

  prefCity: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm ?? 4,
    borderWidth: 1,
  },

  badgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.display,
  },

  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
});
