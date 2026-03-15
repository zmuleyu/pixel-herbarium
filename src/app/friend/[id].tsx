import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useHerbarium } from '@/hooks/useHerbarium';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { GRID_COLUMNS, TOTAL_PLANTS } from '@/constants/plants';
import type { PlantSlot } from '@/hooks/useHerbarium';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor(SCREEN_WIDTH / GRID_COLUMNS);

const RARITY_COLORS: Record<number, string> = {
  1: colors.rarity.common,
  2: colors.rarity.uncommon,
  3: colors.rarity.rare,
};

export default function FriendHerbariumScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { plants, collected, loading } = useHerbarium(id ?? '');
  const friendName = name ? decodeURIComponent(name) : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.plantPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ {t('common.back')}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {friendName ? (
            <Text style={styles.headerName} numberOfLines={1}>{friendName}</Text>
          ) : null}
          <Text style={styles.headerProgress}>
            {t('herbarium.progress', { count: collected.size })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bouquetBtn}
          onPress={() => router.push({ pathname: '/(tabs)/social', params: { tab: 'bouquets' } } as any)}
        >
          <Text style={styles.bouquetBtnText}>🌸</Text>
        </TouchableOpacity>
      </View>

      {/* 6×10 Grid (read-only — no tap navigation) */}
      <FlatList
        data={plants}
        numColumns={GRID_COLUMNS}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PlantCell plant={item} isCollected={collected.has(item.id)} />
        )}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ── Plant Cell (read-only) ─────────────────────────────────────────────────
function PlantCell({ plant, isCollected }: { plant: PlantSlot; isCollected: boolean }) {
  const rarityColor = RARITY_COLORS[plant.rarity] ?? colors.rarity.common;

  return (
    <View style={[styles.cell, !isCollected && styles.cellLocked]}>
      {isCollected ? (
        <>
          {plant.pixel_sprite_url ? (
            <Image source={{ uri: plant.pixel_sprite_url }} style={styles.sprite} resizeMode="contain" />
          ) : (
            <View style={[styles.spritePlaceholder, { backgroundColor: rarityColor }]}>
              <Text style={styles.spritePlaceholderText}>🌸</Text>
            </View>
          )}
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
            <Text style={styles.rarityBadgeText}>{'★'.repeat(plant.rarity)}</Text>
          </View>
        </>
      ) : (
        <View style={styles.lockedInner}>
          <Text style={styles.lockedIcon}>🌿</Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:        { paddingVertical: 4, paddingRight: spacing.sm },
  backText:       { fontSize: typography.fontSize.md, color: colors.plantPrimary },
  headerCenter:   { flex: 1, alignItems: 'center' },
  headerName:     { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md, color: colors.text },
  headerProgress: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  bouquetBtn:     { paddingVertical: 4, paddingLeft: spacing.sm },
  bouquetBtnText: { fontSize: typography.fontSize.lg },

  grid: { paddingBottom: spacing.lg },

  cell:                  { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  cellLocked:            { backgroundColor: '#e8e6e1' },
  sprite:                { width: CELL_SIZE - 4, height: CELL_SIZE - 4 },
  spritePlaceholder:     { width: CELL_SIZE - 8, height: CELL_SIZE - 8, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  spritePlaceholderText: { fontSize: CELL_SIZE * 0.4 },
  lockedInner:           { alignItems: 'center', justifyContent: 'center' },
  lockedIcon:            { fontSize: CELL_SIZE * 0.35, opacity: 0.3 },

  rarityBadge:     { position: 'absolute', top: 2, right: 2, borderRadius: 3, paddingHorizontal: 2, paddingVertical: 1 },
  rarityBadgeText: { fontSize: 7, color: colors.text },
});
