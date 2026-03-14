import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useHerbarium, type PlantSlot } from '@/hooks/useHerbarium';
import { useAuthStore } from '@/stores/auth-store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { GRID_COLUMNS, TOTAL_PLANTS, RARITY_LABELS } from '@/constants/plants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = Math.floor(SCREEN_WIDTH / GRID_COLUMNS);

// Rarity badge colors matching theme
const RARITY_COLORS: Record<number, string> = {
  1: colors.rarity.common,
  2: colors.rarity.uncommon,
  3: colors.rarity.rare,
};

export default function HerbariumScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { plants, collected, collectionMap, loading, refresh } = useHerbarium(user?.id ?? '');

  const [selected, setSelected] = useState<PlantSlot | null>(null);

  function handleCellPress(plant: PlantSlot) {
    if (collected.has(plant.id)) {
      setSelected(plant);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.plantPrimary} />
      </View>
    );
  }

  const discoveredCount = collected.size;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('herbarium.title')}</Text>
        <Text style={styles.headerProgress}>
          {t('herbarium.progress', { count: discoveredCount })}
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

      {/* Detail Modal */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selected && (
              <PlantDetail
                plant={selected}
                discoveredAt={collectionMap.get(selected.id)?.discovered_at ?? null}
                onClose={() => setSelected(null)}
                t={t}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Plant Cell ────────────────────────────────────────────────────────
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
            // Placeholder pixel block while sprite not uploaded yet
            <View style={[styles.spritePlaceholder, { backgroundColor: rarityColor }]}>
              <Text style={styles.spritePlaceholderText}>🌸</Text>
            </View>
          )}
          {/* Rarity badge */}
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
            <Text style={styles.rarityBadgeText}>
              {'★'.repeat(plant.rarity)}
            </Text>
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

// ── Plant Detail Modal Content ────────────────────────────────────────
interface PlantDetailProps {
  plant: PlantSlot;
  discoveredAt: string | null;
  onClose: () => void;
  t: TFunction;
}

function PlantDetail({ plant, discoveredAt, onClose, t }: PlantDetailProps) {
  const rarityLabel = RARITY_LABELS[plant.rarity as keyof typeof RARITY_LABELS] ?? '★';
  const dateStr = discoveredAt
    ? new Date(discoveredAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <>
      <Text style={styles.detailRarity}>{rarityLabel}</Text>
      <Text style={styles.detailNameJa}>{plant.name_ja}</Text>
      <Text style={styles.detailNameEn}>{plant.name_en}</Text>
      <Text style={styles.detailLatin}>{plant.name_latin}</Text>

      <View style={styles.detailDivider} />

      <Text style={styles.detailSectionLabel}>{t('herbarium.hanakotoba')}</Text>
      <Text style={styles.detailHanakotoba}>{plant.hanakotoba}</Text>

      {dateStr && (
        <Text style={styles.detailDiscoveredAt}>
          {t('herbarium.discoveredOn')}：{dateStr}
        </Text>
      )}

      <TouchableOpacity style={styles.button} onPress={onClose}>
        <Text style={styles.buttonText}>閉じる</Text>
      </TouchableOpacity>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  center:             { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  // Header
  header:             { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle:        { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text },
  headerProgress:     { fontSize: typography.fontSize.sm, color: colors.textSecondary },

  // Grid
  grid:               { paddingBottom: spacing.lg },

  // Cell
  cell:               { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  cellLocked:         { backgroundColor: '#e8e6e1' },
  sprite:             { width: CELL_SIZE - 4, height: CELL_SIZE - 4 },
  spritePlaceholder:  { width: CELL_SIZE - 8, height: CELL_SIZE - 8, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  spritePlaceholderText: { fontSize: CELL_SIZE * 0.4 },
  lockedInner:        { alignItems: 'center', justifyContent: 'center' },
  lockedIcon:         { fontSize: CELL_SIZE * 0.35, opacity: 0.3 },

  // Rarity badge (top-right corner)
  rarityBadge:        { position: 'absolute', top: 2, right: 2, borderRadius: 3, paddingHorizontal: 2, paddingVertical: 1 },
  rarityBadgeText:    { fontSize: 7, color: colors.text },

  // Modal
  modalBackdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:          { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.xl, gap: spacing.sm, alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl },

  // Detail
  detailRarity:       { fontSize: typography.fontSize.lg, color: colors.plantPrimary },
  detailNameJa:       { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl, color: colors.text },
  detailNameEn:       { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontStyle: 'italic' },
  detailLatin:        { fontSize: typography.fontSize.xs, color: colors.textSecondary, fontStyle: 'italic' },
  detailDivider:      { width: '60%', height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  detailSectionLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  detailHanakotoba:   { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text },
  detailDiscoveredAt: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm },

  // Button
  button:             { backgroundColor: colors.plantPrimary, borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  buttonText:         { color: colors.white, fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md },
});
