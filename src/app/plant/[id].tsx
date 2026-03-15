import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { usePlantDetail } from '@/hooks/usePlantDetail';
import { useAuthStore } from '@/stores/auth-store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { RARITY_LABELS } from '@/constants/plants';

const MONTH_NAMES_JA = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const RARITY_COLORS: Record<number, string> = {
  1: colors.rarity.common,
  2: colors.rarity.uncommon,
  3: colors.rarity.rare,
};

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const plantId = Number(id);
  const { plant, discoveries, loading, error } = usePlantDetail(plantId, user?.id ?? '');
  const posterRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (!posterRef.current || sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(posterRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: plant?.name_ja });
      }
    } catch (_) {
      // Sharing cancelled or unavailable — silent
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.plantPrimary} />
      </View>
    );
  }

  if (error || !plant) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? t('common.notFound')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← {t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rarityColor = RARITY_COLORS[plant.rarity] ?? colors.rarity.common;
  const rarityLabel = RARITY_LABELS[plant.rarity as keyof typeof RARITY_LABELS] ?? '★';

  // Best available image: personal pixel art > standard sprite
  const heroImageUri = discoveries[0]?.pixel_url ?? plant.pixel_sprite_url;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back + Share row */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} disabled={sharing}>
          {sharing
            ? <ActivityIndicator size="small" color={colors.plantPrimary} />
            : <Text style={styles.shareBtnText}>🌸 {t('herbarium.sharePoster')}</Text>}
        </TouchableOpacity>
      </View>

      {/* Hero image (poster capture area) */}
      <View ref={posterRef} style={[styles.posterArea, { borderColor: rarityColor, backgroundColor: colors.white }]}>
        {heroImageUri ? (
          <Image source={{ uri: heroImageUri }} style={styles.heroImage} resizeMode="contain" />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: rarityColor }]}>
            <Text style={styles.heroPlaceholderText}>🌸</Text>
          </View>
        )}
        <Text style={styles.posterName}>{plant.name_ja}</Text>
        <Text style={styles.posterHanakotoba}>{plant.hanakotoba}</Text>
      </View>

      {/* Rarity badge */}
      <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
        <Text style={styles.rarityBadgeText}>{rarityLabel}</Text>
      </View>

      {/* Names */}
      <Text style={styles.nameJa}>{plant.name_ja}</Text>
      <Text style={styles.nameEn}>{plant.name_en}</Text>
      <Text style={styles.nameLatin}>{plant.name_latin}</Text>

      <View style={styles.divider} />

      {/* Hanakotoba (花言葉) */}
      {plant.hanakotoba && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('herbarium.hanakotoba')}</Text>
          <Text style={styles.hanakotobaText}>{plant.hanakotoba}</Text>
          {plant.flower_meaning && (
            <Text style={styles.flowerMeaning}>{plant.flower_meaning}</Text>
          )}
        </View>
      )}

      {/* Bloom calendar */}
      {plant.bloom_months.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('plant.bloomCalendar')}</Text>
          <View style={styles.monthGrid}>
            {MONTH_NAMES_JA.map((name, i) => {
              const active = plant.bloom_months.includes(i + 1);
              return (
                <View
                  key={i}
                  style={[
                    styles.monthCell,
                    active && { backgroundColor: rarityColor },
                  ]}
                >
                  <Text style={[styles.monthText, active && styles.monthTextActive]}>
                    {name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Prefecture chips */}
      {plant.prefectures.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('plant.prefectures')}</Text>
          <View style={styles.chipRow}>
            {plant.prefectures.map((pref) => (
              <View key={pref} style={styles.chip}>
                <Text style={styles.chipText}>{pref}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Discovery history */}
      {discoveries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('plant.myDiscoveries')}</Text>
          {discoveries.map((disc) => (
            <DiscoveryRow key={disc.id} record={disc} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ── Discovery row ────────────────────────────────────────────────────────────

interface DiscoveryRowProps {
  record: { id: string; created_at: string; pixel_url: string | null; user_note: string | null };
}

function DiscoveryRow({ record }: DiscoveryRowProps) {
  const dateStr = new Date(record.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.discRow}>
      {record.pixel_url && (
        <Image source={{ uri: record.pixel_url }} style={styles.discPixelArt} resizeMode="contain" />
      )}
      <View style={styles.discInfo}>
        <Text style={styles.discDate}>{dateStr}</Text>
        {record.user_note && <Text style={styles.discNote}>{record.user_note}</Text>}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { padding: spacing.md, paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl, alignItems: 'center' },
  center:    { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: spacing.md },

  topRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', marginBottom: spacing.sm },
  backBtnText:   { color: colors.plantPrimary, fontSize: typography.fontSize.sm },
  shareBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.plantPrimary, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  shareBtnText:  { color: colors.plantPrimary, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.display },

  posterArea:    { width: 220, alignItems: 'center', borderWidth: 2, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.sm, gap: 4 },
  heroImage:     { width: 192, height: 192 },
  posterName:    { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text },
  posterHanakotoba: { fontSize: typography.fontSize.xs, color: colors.textSecondary, fontStyle: 'italic' },
  heroPlaceholder: { width: 192, height: 192, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { fontSize: 80 },

  rarityBadge:     { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginBottom: spacing.xs },
  rarityBadgeText: { fontSize: typography.fontSize.sm, color: colors.text, fontFamily: typography.fontFamily.display },

  nameJa:    { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xxl, color: colors.text, textAlign: 'center' },
  nameEn:    { fontSize: typography.fontSize.md, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
  nameLatin: { fontSize: typography.fontSize.xs, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginBottom: spacing.xs },

  divider: { width: '60%', height: 1, backgroundColor: colors.border, marginVertical: spacing.md },

  section:      { width: '100%', marginBottom: spacing.md },
  sectionLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },

  hanakotobaText: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text },
  flowerMeaning:  { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontStyle: 'italic', marginTop: 2 },

  monthGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  monthCell:      { width: 44, height: 32, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  monthText:      { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  monthTextActive: { color: colors.text, fontFamily: typography.fontFamily.display },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip:    { backgroundColor: colors.plantSecondary, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  chipText: { fontSize: typography.fontSize.xs, color: colors.text },

  discRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.sm },
  discPixelArt: { width: 64, height: 64, borderRadius: borderRadius.sm },
  discInfo:     { flex: 1 },
  discDate:     { fontSize: typography.fontSize.sm, color: colors.text, fontFamily: typography.fontFamily.display },
  discNote:     { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },

  errorText: { color: colors.textSecondary, fontSize: typography.fontSize.md, textAlign: 'center', marginHorizontal: spacing.xl },
});
