import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth-store';
import { useSeasonRecap, type RecapPlant } from '@/hooks/useSeasonRecap';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

const RARITY_COLORS: Record<number, string> = {
  1: colors.rarity.common,
  2: colors.rarity.uncommon,
  3: colors.rarity.rare,
};

const SEASON_EMOJIS: Record<string, string> = {
  spring: '🌸',
  summer: '🌻',
  autumn: '🍂',
  winter: '❄️',
};

export default function RecapScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { plants, loading, season } = useSeasonRecap(user?.id ?? '');

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  }

  const rarest = plants.reduce<RecapPlant | null>((best, p) => {
    if (!best || p.rarity > best.rarity) return p;
    return best;
  }, null);

  async function handleShare() {
    const plantNames = plants.map((p) => p.name_ja).join('、');
    const rarestLine = rarest && rarest.rarity >= 2
      ? `\n${t('herbarium.recapRarest')}：${rarest.name_ja}`
      : '';
    const message = `${season.label} · ${t('herbarium.recap')}\n${t('herbarium.recapCollected', { count: plants.length })}${rarestLine}\n\n${plantNames}`;
    await Share.share({ message });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back */}
      <TouchableOpacity onPress={handleBack} style={styles.backRow}>
        <Text style={styles.backText}>← {t('common.back')}</Text>
      </TouchableOpacity>

      {/* Season header */}
      <View style={styles.seasonHeader}>
        <Text style={styles.seasonEmoji}>{SEASON_EMOJIS[season.season] ?? '🌿'}</Text>
        <Text style={styles.seasonLabel}>{season.label}</Text>
        <Text style={styles.recapTitle}>{t('herbarium.recap')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.plantPrimary} style={{ marginTop: spacing.xl }} />
      ) : plants.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyText}>{t('herbarium.recapEmpty')}</Text>
        </View>
      ) : (
        <>
          {/* Count badge + share */}
          <View style={styles.topRow}>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {t('herbarium.recapCollected', { count: plants.length })}
              </Text>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
              <Text style={styles.shareBtnText}>{t('common.share')}</Text>
            </TouchableOpacity>
          </View>

          {/* Rarest plant spotlight */}
          {rarest && rarest.rarity >= 2 && (
            <View style={[styles.rarestCard, { borderColor: RARITY_COLORS[rarest.rarity] }]}>
              <Text style={styles.rarestLabel}>{t('herbarium.recapRarest')}</Text>
              {rarest.pixel_sprite_url ? (
                <Image
                  source={{ uri: rarest.pixel_sprite_url }}
                  style={styles.rarestSprite}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.rarestPlaceholder}>🌸</Text>
              )}
              <Text style={[styles.rarestName, { color: RARITY_COLORS[rarest.rarity] }]}>
                {rarest.name_ja}
              </Text>
              {rarest.hanakotoba && (
                <Text style={styles.rarestHanakotoba}>「{rarest.hanakotoba}」</Text>
              )}
            </View>
          )}

          {/* Plant grid */}
          <View style={styles.grid}>
            {plants.map((plant) => (
              <PlantThumb key={plant.id} plant={plant} onPress={() => router.push(`/plant/${plant.id}`)} />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ── Plant thumbnail ───────────────────────────────────────────────────────────

function PlantThumb({ plant, onPress }: { plant: RecapPlant; onPress: () => void }) {
  const rarityColor = RARITY_COLORS[plant.rarity] ?? colors.rarity.common;
  return (
    <TouchableOpacity style={styles.thumb} onPress={onPress} activeOpacity={0.7}>
      {plant.pixel_sprite_url ? (
        <Image source={{ uri: plant.pixel_sprite_url }} style={styles.thumbSprite} resizeMode="contain" />
      ) : (
        <View style={[styles.thumbPlaceholder, { backgroundColor: rarityColor }]}>
          <Text style={styles.thumbEmoji}>🌸</Text>
        </View>
      )}
      <View style={[styles.thumbBadge, { backgroundColor: rarityColor }]}>
        <Text style={styles.thumbBadgeText}>{'★'.repeat(plant.rarity)}</Text>
      </View>
      <Text style={styles.thumbName} numberOfLines={1}>{plant.name_ja}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { padding: spacing.md, paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl, alignItems: 'center' },

  backRow:   { alignSelf: 'flex-start', marginBottom: spacing.sm },
  backText:  { color: colors.plantPrimary, fontSize: typography.fontSize.sm },

  seasonHeader: { alignItems: 'center', marginBottom: spacing.md, gap: 4 },
  seasonEmoji:  { fontSize: 48 },
  seasonLabel:  { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md, color: colors.textSecondary },
  recapTitle:   { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xxl, color: colors.text },

  emptyCard:  { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  emptyEmoji: { fontSize: 48, opacity: 0.4 },
  emptyText:  { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center' },

  topRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  countBadge: { backgroundColor: colors.plantSecondary, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  countText:  { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md, color: colors.text },
  shareBtn:      { borderWidth: 1.5, borderColor: colors.plantPrimary, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  shareBtnText:  { color: colors.plantPrimary, fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.sm },

  rarestCard:          { width: '100%', borderWidth: 2, borderRadius: borderRadius.md, backgroundColor: colors.white, alignItems: 'center', padding: spacing.md, gap: spacing.xs, marginBottom: spacing.md },
  rarestLabel:         { fontSize: typography.fontSize.xs, color: colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  rarestSprite:        { width: 120, height: 120 },
  rarestPlaceholder:   { fontSize: 72 },
  rarestName:          { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg },
  rarestHanakotoba:    { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },

  grid:              { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  thumb:             { width: 88, alignItems: 'center', gap: 4 },
  thumbSprite:       { width: 80, height: 80, borderRadius: borderRadius.sm, backgroundColor: colors.white },
  thumbPlaceholder:  { width: 80, height: 80, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  thumbEmoji:        { fontSize: 36 },
  thumbBadge:        { position: 'absolute', top: 2, right: 4, borderRadius: 3, paddingHorizontal: 2 },
  thumbBadgeText:    { fontSize: 7, color: colors.text },
  thumbName:         { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center', width: '100%' },
});
