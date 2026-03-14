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
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useHerbarium, type PlantSlot } from '@/hooks/useHerbarium';
import { useAuthStore } from '@/stores/auth-store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { GRID_COLUMNS, TOTAL_PLANTS, RARITY_LABELS } from '@/constants/plants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor(SCREEN_WIDTH / GRID_COLUMNS);

const RARITY_COLORS: Record<number, string> = {
  1: colors.rarity.common,
  2: colors.rarity.uncommon,
  3: colors.rarity.rare,
};

export default function HerbariumScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const router = useRouter();
  const { plants, collected, loading } = useHerbarium(user?.id ?? '');

  function handleCellPress(plant: PlantSlot) {
    if (collected.has(plant.id)) {
      router.push(`/plant/${plant.id}`);
    }
  }

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
        <Text style={styles.headerTitle}>{t('herbarium.title')}</Text>
        <Text style={styles.headerProgress}>
          {t('herbarium.progress', { count: collected.size })}
        </Text>
      </View>

      {/* 6×10 Grid */}
      <FlatList
        data={plants}
        numColumns={GRID_COLUMNS}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PlantCell
            plant={item}
            isCollected={collected.has(item.id)}
            onPress={() => handleCellPress(item)}
          />
        )}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ── Plant Cell ─────────────────────────────────────────────────────────────

interface PlantCellProps {
  plant: PlantSlot;
  isCollected: boolean;
  onPress: () => void;
}

function PlantCell({ plant, isCollected, onPress }: PlantCellProps) {
  const rarityColor = RARITY_COLORS[plant.rarity] ?? colors.rarity.common;

  return (
    <TouchableOpacity
      style={[styles.cell, !isCollected && styles.cellLocked]}
      onPress={onPress}
      activeOpacity={isCollected ? 0.7 : 1}
    >
      {isCollected ? (
        <>
          {plant.pixel_sprite_url ? (
            <Image
              source={{ uri: plant.pixel_sprite_url }}
              style={styles.sprite}
              resizeMode="contain"
            />
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
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  header:         { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle:    { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text },
  headerProgress: { fontSize: typography.fontSize.sm, color: colors.textSecondary },

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
