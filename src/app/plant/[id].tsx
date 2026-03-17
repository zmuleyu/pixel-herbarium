import {
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ShareSheet } from '@/components/ShareSheet';
import { HanakotobaFlipCard } from '@/components/HanakotobaFlipCard';
import { SeasonPhaseIndicator } from '@/components/SeasonPhaseIndicator';
import { usePlantDetail } from '@/hooks/usePlantDetail';
import { useHerbarium } from '@/hooks/useHerbarium';
import { useAuthStore } from '@/stores/auth-store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { RARITY_LABELS } from '@/constants/plants';
import { getPlantGradientColors } from '@/utils/plant-gradient';

function getMonthName(month: number, lng: string): string {
  return new Date(2024, month - 1, 1).toLocaleDateString(lng === 'ja' ? 'ja-JP' : 'en-US', { month: 'short' });
}

function getMonthNames(lng: string): string[] {
  return Array.from({ length: 12 }, (_, i) => getMonthName(i + 1, lng));
}

// Returns e.g. "3月〜4月ごろ" (ja) or "Mar – Apr" (en) from bloom_months array
function formatBloomHint(months: number[], lng: string): string {
  if (months.length === 0) return '';
  const sorted = [...months].sort((a, b) => a - b);
  const names = sorted.map((m) => getMonthName(m, lng));
  return lng === 'ja' ? names.join('〜') + 'ごろ' : names.join(' – ');
}

const RARITY_COLORS: Record<number, string> = {
  1: colors.rarity.common,
  2: colors.rarity.uncommon,
  3: colors.rarity.rare,
};

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();

  const plantId = Number(id);
  const { plant, discoveries, loading, error, updateNote } = usePlantDetail(plantId, user?.id ?? '');
  const { collected } = useHerbarium(user?.id ?? '');
  const isCollected = collected.has(plantId);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);

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
  const gradientColors = getPlantGradientColors(plant.rarity, plant.bloom_months);
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
        <TouchableOpacity style={styles.shareBtn} onPress={() => setShareSheetVisible(true)}>
          <Text style={styles.shareBtnText}>🌸 {t('herbarium.sharePoster')}</Text>
        </TouchableOpacity>
      </View>

      {/* Hero image */}
      <View style={[styles.posterArea, { borderColor: rarityColor }]}>
        <LinearGradient
          colors={gradientColors}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
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
        <HanakotobaFlipCard
          hanakotoba={plant.hanakotoba}
          flowerMeaning={plant.flower_meaning}
          colorMeaning={plant.color_meaning}
        />
      )}

      {/* Season phase indicator (花開き → 見頃 → 花散り) */}
      <SeasonPhaseIndicator
        bloomMonths={plant.bloom_months}
        rarity={plant.rarity}
        availableWindow={plant.available_window}
      />

      {/* Bloom calendar */}
      {plant.bloom_months.length > 0 && (
        <View style={styles.metadataCard}>
          <Text style={styles.sectionLabel}>{t('plant.bloomCalendar')}</Text>
          <View style={styles.monthGrid}>
            {getMonthNames(i18n.language).map((name, i) => {
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
        <View style={styles.metadataCard}>
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

      {/* Locked hint card — shown when plant not yet collected */}
      {!isCollected && (
        <View style={styles.lockedCard}>
          <Text style={styles.lockedEmoji}>🌿</Text>
          <Text style={styles.lockedTitle}>{t('herbarium.locked')}</Text>
          {plant.bloom_months.length > 0 && (
            <Text style={styles.lockedHint}>
              {[
                formatBloomHint(plant.bloom_months, i18n.language),
                plant.prefectures.length > 0 ? plant.prefectures.slice(0, 3).join(' / ') : null,
              ].filter(Boolean).join('\n')}
            </Text>
          )}
          {plant.rarity === 3 && (
            <View style={[styles.limitedBadge, { backgroundColor: colors.rarity.rare }]}>
              <Text style={styles.limitedBadgeText}>{t('events.limitedPlant')}</Text>
            </View>
          )}
        </View>
      )}

      {/* Discovery history */}
      {discoveries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('plant.myDiscoveries')}</Text>
          {discoveries.map((disc) => (
            <DiscoveryRow key={disc.id} record={disc} onSaveNote={updateNote} t={t} />
          ))}
        </View>
      )}

      <ShareSheet
        visible={shareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        plant={{
          name_ja: plant.name_ja,
          name_latin: plant.name_latin,
          rarity: plant.rarity,
          hanakotoba: plant.hanakotoba ?? '',
          bloom_months: plant.bloom_months ?? [],
          pixel_sprite_url: heroImageUri ?? null,
          cityRank: null,
        }}
        discoveryDate={discoveries[0]?.created_at}
        discoveryCity={discoveries[0]?.city ?? undefined}
      />
    </ScrollView>
  );
}

// ── Discovery row ────────────────────────────────────────────────────────────

interface DiscoveryRowProps {
  record: { id: string; created_at: string; pixel_url: string | null; user_note: string | null };
  onSaveNote: (discoveryId: string, note: string) => Promise<void>;
  t: (key: string) => string;
}

function DiscoveryRow({ record, onSaveNote, t }: DiscoveryRowProps) {
  const [draft, setDraft] = useState(record.user_note ?? '');
  const [saving, setSaving] = useState(false);

  const dateStr = new Date(record.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  async function handleBlur() {
    if (draft === (record.user_note ?? '')) return; // no change
    setSaving(true);
    await onSaveNote(record.id, draft);
    setSaving(false);
  }

  return (
    <View style={styles.discRow}>
      {record.pixel_url && (
        <Image source={{ uri: record.pixel_url }} style={styles.discPixelArt} resizeMode="contain" />
      )}
      <View style={styles.discInfo}>
        <View style={styles.discDateRow}>
          <Text style={styles.discDateLabel}>{t('herbarium.discoveredOn')}</Text>
          <Text style={styles.discDate}>{dateStr}</Text>
          {saving && <ActivityIndicator size="small" color={colors.plantPrimary} style={{ marginLeft: 6 }} />}
        </View>
        <TextInput
          style={styles.discNoteInput}
          value={draft}
          onChangeText={setDraft}
          onBlur={handleBlur}
          placeholder={t('herbarium.yourNote')}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={200}
          returnKeyType="done"
          blurOnSubmit
        />
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
  backBtn:       { paddingVertical: 4, paddingHorizontal: spacing.xs },
  backBtnText:   { color: colors.plantPrimary, fontSize: typography.fontSize.sm },
  shareBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.plantPrimary, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  shareBtnText:  { color: colors.plantPrimary, fontSize: typography.fontSize.xs, fontFamily: typography.fontFamily.display },

  posterArea:    { width: 220, alignItems: 'center', borderWidth: 2, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.sm, gap: 4, overflow: 'hidden' },
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
  metadataCard: { width: '100%', backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  sectionLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 1 },

  monthGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  monthCell:      { width: 44, height: 32, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  monthText:      { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  monthTextActive: { color: colors.text, fontFamily: typography.fontFamily.display },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip:    { backgroundColor: colors.plantSecondary, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  chipText: { fontSize: typography.fontSize.xs, color: colors.text },

  discRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm, backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.sm },
  discPixelArt:  { width: 64, height: 64, borderRadius: borderRadius.sm },
  discInfo:      { flex: 1 },
  discDateRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  discDateLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  discDate:      { fontSize: typography.fontSize.sm, color: colors.text, fontFamily: typography.fontFamily.display },
  discNoteInput: { fontSize: typography.fontSize.xs, color: colors.text, fontStyle: 'italic', paddingVertical: 2, minHeight: 20 },

  errorText: { color: colors.textSecondary, fontSize: typography.fontSize.md, textAlign: 'center', marginHorizontal: spacing.xl },

  // Locked state hint card
  lockedCard:        { width: '100%', backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  lockedEmoji:       { fontSize: 40, opacity: 0.4 },
  lockedTitle:       { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md, color: colors.textSecondary },
  lockedHint:        { fontSize: typography.fontSize.sm, color: colors.text, textAlign: 'center', lineHeight: typography.fontSize.sm * typography.lineHeight },
  limitedBadge:      { borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginTop: spacing.xs },
  limitedBadgeText:  { fontSize: typography.fontSize.xs, color: colors.text, fontFamily: typography.fontFamily.display },
});
