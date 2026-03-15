import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
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
const CURRENT_MONTH = new Date().getMonth() + 1; // 1–12

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
  const [hintPlant, setHintPlant] = useState<PlantSlot | null>(null);

  function handleCellPress(plant: PlantSlot) {
    if (collected.has(plant.id)) {
      router.push(`/plant/${plant.id}`);
    } else {
      setHintPlant(plant);
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
        <View style={styles.headerRight}>
          <Text style={styles.headerProgress}>
            {t('herbarium.progress', { count: collected.size })}
          </Text>
          <TouchableOpacity onPress={() => router.push('/recap' as any)} style={styles.recapBtn}>
            <Text style={styles.recapBtnText}>📋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${(collected.size / TOTAL_PLANTS) * 100}%` as any }]} />
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

      {/* Bloom hint bottom sheet for locked cells */}
      {hintPlant && (
        <BloomHintSheet
          plant={hintPlant}
          onClose={() => setHintPlant(null)}
          onDetail={() => {
            setHintPlant(null);
            router.push(`/plant/${hintPlant.id}`);
          }}
        />
      )}
    </View>
  );
}

// ── Bloom Hint Sheet ───────────────────────────────────────────────────────

interface BloomHintSheetProps {
  plant: PlantSlot;
  onClose: () => void;
  onDetail: () => void;
}

function BloomHintSheet({ plant, onClose, onDetail }: BloomHintSheetProps) {
  const { t } = useTranslation();
  const isCurrentMonth = plant.bloom_months.includes(CURRENT_MONTH);
  const monthStr = plant.bloom_months.map((m) => `${m}月`).join('・');

  return (
    <View style={sheet.overlay}>
      <TouchableOpacity style={sheet.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={sheet.card}>
        <Text style={sheet.seasonIcon}>{isCurrentMonth ? '🌱' : '🌿'}</Text>
        <Text style={sheet.status}>
          {isCurrentMonth ? t('discover.checkingHint') : t('discover.outOfSeason')}
        </Text>
        {monthStr.length > 0 && (
          <Text style={sheet.months}>{monthStr}</Text>
        )}
        <TouchableOpacity style={sheet.detailBtn} onPress={onDetail}>
          <Text style={sheet.detailBtnText}>{t('herbarium.viewDetail')}</Text>
        </TouchableOpacity>
      </View>
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
  const scale = useRef(new Animated.Value(isCollected ? 0.8 : 1)).current;
  const opacity = useRef(new Animated.Value(isCollected ? 0 : 1)).current;

  useEffect(() => {
    if (!isCollected) return;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [isCollected]);

  return (
    <TouchableOpacity
      style={[styles.cell, !isCollected && styles.cellLocked]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {isCollected ? (
        <Animated.View style={{ alignItems: 'center', transform: [{ scale }], opacity }}>
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
        </Animated.View>
      ) : (
        <View style={[styles.lockedInner, plant.bloom_months.includes(CURRENT_MONTH) && styles.lockedInnerSeason]}>
          <Text style={[styles.lockedIcon, plant.bloom_months.includes(CURRENT_MONTH) && styles.lockedIconSeason]}>
            {plant.bloom_months.includes(CURRENT_MONTH) ? '🌱' : '🌿'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center:    { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  headerTitle:    { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text },
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerProgress: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  recapBtn:       { paddingHorizontal: spacing.xs, paddingVertical: 2 },
  recapBtnText:   { fontSize: typography.fontSize.md },

  progressBarTrack: { height: 3, backgroundColor: colors.border, marginHorizontal: 0 },
  progressBarFill:  { height: 3, backgroundColor: colors.plantPrimary },

  grid: { paddingBottom: spacing.lg },

  cell:                  { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  cellLocked:            { backgroundColor: '#e8e6e1' },
  sprite:                { width: CELL_SIZE - 4, height: CELL_SIZE - 4 },
  spritePlaceholder:     { width: CELL_SIZE - 8, height: CELL_SIZE - 8, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  spritePlaceholderText: { fontSize: CELL_SIZE * 0.4 },
  lockedInner:           { alignItems: 'center', justifyContent: 'center' },
  lockedInnerSeason:     { backgroundColor: `${colors.plantSecondary}60` }, // in-season tint
  lockedIcon:            { fontSize: CELL_SIZE * 0.35, opacity: 0.3 },
  lockedIconSeason:      { opacity: 0.55 }, // in-season more visible

  rarityBadge:     { position: 'absolute', top: 2, right: 2, borderRadius: 3, paddingHorizontal: 2, paddingVertical: 1 },
  rarityBadgeText: { fontSize: 7, color: colors.text },
});

const sheet = StyleSheet.create({
  overlay:      { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', zIndex: 10 },
  backdrop:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  card:         { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl, alignItems: 'center', gap: spacing.sm },
  seasonIcon:   { fontSize: 48 },
  status:       { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md, color: colors.text, textAlign: 'center' },
  months:       { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  detailBtn:    { backgroundColor: colors.plantPrimary, borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, marginTop: spacing.xs },
  detailBtnText:{ color: colors.white, fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md },
});
