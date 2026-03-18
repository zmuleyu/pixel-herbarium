// src/components/SpotStampGrid.tsx
// 8-column grid of 100 stamp slots.
// Checked-in: colored stamp emoji. Unchecked: grey lock.
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { FlowerSpot } from '@/types/hanami';
import type { SpotCheckinResult } from '@/types/sakura';

const COLS       = 8;
const GAP        = 4;
const SW         = Dimensions.get('window').width;
const CELL_SIZE  = Math.floor((SW - spacing.md * 2 - GAP * (COLS - 1)) / COLS);

interface Props {
  spots:        FlowerSpot[];
  checkins:     SpotCheckinResult[];
  onSpotPress:  (spot: FlowerSpot, checkin: SpotCheckinResult | null) => void;
}

function SpotStampGrid({ spots, checkins, onSpotPress }: Props) {
  const { t } = useTranslation();
  const progressKey = 'sakura.collection.progress';

  const checkinMap = new Map(checkins.map((c) => [c.spot_id, c]));
  const checked    = checkins.length;
  const total      = spots.length;

  return (
    <View style={styles.container}>
      {/* Progress */}
      <Text style={styles.progress}>
        {t(progressKey, { count: checked, total })}
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${total > 0 ? (checked / total) * 100 : 0}%` }]} />
      </View>

      {/* Grid */}
      <FlatList
        data={spots}
        keyExtractor={(s) => String(s.id)}
        numColumns={COLS}
        removeClippedSubviews
        scrollEnabled={false}
        renderItem={({ item: spot }) => {
          const checkin = checkinMap.get(spot.id) ?? null;
          const is100sen = spot.tags.includes('名所100選');
          const hasCheckin = checkin !== null;
          const isMankai = checkin?.stamp_variant === 'mankai';

          return (
            <TouchableOpacity
              style={[styles.cell, hasCheckin && styles.cellChecked, isMankai && styles.cellMankai,
                      is100sen && hasCheckin && styles.cell100sen]}
              onPress={() => onSpotPress(spot, checkin)}
            >
              {hasCheckin
                ? <Text style={styles.stampEmoji}>{is100sen ? '⭐' : '🌸'}</Text>
                : <Text style={styles.lockEmoji}>🔒</Text>
              }
            </TouchableOpacity>
          );
        }}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

export default SpotStampGrid;

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  progress: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontFamily: typography.fontFamily.display,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 4, backgroundColor: colors.border,
    borderRadius: borderRadius.full, marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.blushPink },
  row: { gap: GAP, marginBottom: GAP },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    opacity: 0.5,
  },
  cellChecked: { backgroundColor: colors.blushPink, opacity: 1 },
  cellMankai:  { borderWidth: 1.5, borderColor: '#d4a017' },
  cell100sen:  { backgroundColor: colors.creamYellow },
  stampEmoji:  { fontSize: CELL_SIZE * 0.5 },
  lockEmoji:   { fontSize: CELL_SIZE * 0.4 },
});
