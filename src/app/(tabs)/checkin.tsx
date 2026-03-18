// Check-in wizard: photo → spot → preview+share
// 3-step flow using local state; no navigation between tabs until done.

import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius, getSeasonTheme } from '@/constants/theme';
import { getActiveSeason } from '@/constants/seasons';
import { useCheckinStore } from '@/stores/checkin-store';
import { useCheckinPhoto } from '@/hooks/useCheckinPhoto';
import { SpotSelector } from '@/components/checkin/SpotSelector';
import { CardTemplate, CARD_WIDTH, CARD_HEIGHT } from '@/components/templates/CardTemplate';
import type { FlowerSpot, SpotsData } from '@/types/hanami';
import sakuraData from '@/data/seasons/sakura.json';

// Map seasonId → spots JSON
const SEASON_SPOTS: Record<string, SpotsData> = {
  sakura: sakuraData as SpotsData,
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const PREVIEW_HEIGHT = (PREVIEW_WIDTH / CARD_WIDTH) * CARD_HEIGHT;
const SCALE = PREVIEW_WIDTH / CARD_WIDTH;

// Translate to keep visual top-left at (0, 0) when scaling around element center.
const SCALE_OFFSET_X = (CARD_WIDTH * (1 - SCALE)) / 2;
const SCALE_OFFSET_Y = (CARD_HEIGHT * (1 - SCALE)) / 2;

/** Simple ID without extra deps */
function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

type WizardStep = 'photo' | 'spot' | 'preview';

export default function CheckinScreen() {
  const { t } = useTranslation();
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);
  const { addCheckin } = useCheckinStore();
  const { pickFromCamera, pickFromLibrary, requesting } = useCheckinPhoto();

  const [step, setStep] = useState<WizardStep>('photo');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<FlowerSpot | null>(null);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const cardRef = useRef<View>(null);
  const checkinDate = useRef(new Date());

  const spotsData = SEASON_SPOTS[season.id];
  const spots: FlowerSpot[] = spotsData?.spots ?? [];

  // ── Photo step handlers ──────────────────────────────────────────────────

  async function handlePickCamera() {
    const uri = await pickFromCamera();
    if (uri) {
      setPhotoUri(uri);
      setStep('spot');
    }
  }

  async function handlePickLibrary() {
    const uri = await pickFromLibrary();
    if (uri) {
      setPhotoUri(uri);
      setStep('spot');
    }
  }

  // ── Spot step handler ────────────────────────────────────────────────────

  function handleSpotSelect(spot: FlowerSpot) {
    setSelectedSpot(spot);
    checkinDate.current = new Date();
    setStep('preview');
  }

  // ── Preview step handlers ────────────────────────────────────────────────

  async function handleSave() {
    if (saving || !cardRef.current || !selectedSpot || !photoUri) return;
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setFeedback(t('checkin.permissionRequired'));
        setTimeout(() => setFeedback(null), 2000);
        return;
      }
      const composedUri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(composedUri);
      await addCheckin({
        id: genId(),
        seasonId: season.id,
        spotId: selectedSpot.id,
        photoUri,
        composedUri,
        templateId: 'card',
        timestamp: checkinDate.current.toISOString(),
        synced: false,
      });
      setFeedback(t('checkin.addedToFootprint'));
      setTimeout(() => {
        setFeedback(null);
        router.replace('/(tabs)/footprint');
      }, 1500);
    } catch {
      setFeedback(t('checkin.saveError'));
      setTimeout(() => setFeedback(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (sharing || !cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef);
      await Sharing.shareAsync(uri, { mimeType: 'image/png' });
    } catch {
      // share cancelled or failed — silent
    } finally {
      setSharing(false);
    }
  }

  function handleBack() {
    if (step === 'spot') setStep('photo');
    else if (step === 'preview') setStep('spot');
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: theme.bgTint }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          disabled={step === 'photo'}
        >
          {step !== 'photo' && (
            <Text style={[styles.backText, { color: theme.primary }]}>
              {t('common.back')}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {step === 'photo'
            ? t('checkin.stepPhoto')
            : step === 'spot'
            ? t('checkin.stepSpot')
            : t('checkin.stepPreview')}
        </Text>

        {/* Spacer to balance back button */}
        <View style={styles.backBtn} />
      </View>

      {/* ── Step: Photo ── */}
      {step === 'photo' && (
        <View style={styles.photoStep}>
          <Text style={styles.seasonEmoji}>{season.iconEmoji}</Text>
          <Text style={styles.seasonCta}>{t(`season.${season.id}.cta`)}</Text>
          <View style={styles.pickButtons}>
            <TouchableOpacity
              style={[styles.pickBtn, { backgroundColor: theme.primary }]}
              onPress={handlePickCamera}
              disabled={requesting}
              activeOpacity={0.8}
            >
              {requesting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.pickBtnText}>{t('checkin.pickCamera')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pickBtn, styles.pickBtnOutline, { borderColor: theme.primary }]}
              onPress={handlePickLibrary}
              disabled={requesting}
              activeOpacity={0.8}
            >
              <Text style={[styles.pickBtnText, { color: theme.primary }]}>
                {t('checkin.pickLibrary')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Step: Spot ── */}
      {step === 'spot' && <SpotSelector spots={spots} onSelect={handleSpotSelect} />}

      {/* ── Step: Preview ── */}
      {step === 'preview' && photoUri != null && selectedSpot != null && (
        <ScrollView
          contentContainerStyle={styles.previewStep}
          showsVerticalScrollIndicator={false}
        >
          {/* Scaled card preview — visually top-left aligned */}
          <View
            style={[
              styles.previewWrapper,
              { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT },
            ]}
          >
            <View
              style={{
                position: 'absolute',
                left: -SCALE_OFFSET_X,
                top: -SCALE_OFFSET_Y,
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                transform: [{ scale: SCALE }],
              }}
            >
              <CardTemplate
                photoUri={photoUri}
                spot={selectedSpot}
                date={checkinDate.current}
                season={season}
              />
            </View>
          </View>

          {/* Feedback */}
          {feedback != null && (
            <Text style={[styles.feedback, { color: theme.primary }]}>{feedback}</Text>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              disabled={saving || sharing}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.actionBtnText}>{t('checkin.saveCard')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.actionBtnOutline,
                { borderColor: theme.primary },
              ]}
              onPress={handleShare}
              disabled={saving || sharing}
              activeOpacity={0.8}
            >
              {sharing ? (
                <ActivityIndicator color={theme.primary} size="small" />
              ) : (
                <Text style={[styles.actionBtnText, { color: theme.primary }]}>
                  {t('common.share')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Off-screen card for captureRef — must be at full resolution */}
      {step === 'preview' && photoUri != null && selectedSpot != null && (
        <View style={styles.offscreen} pointerEvents="none">
          <View ref={cardRef} collapsable={false}>
            <CardTemplate
              photoUri={photoUri}
              spot={selectedSpot}
              date={checkinDate.current}
              season={season}
            />
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },

  backBtn: { width: 60 },

  backText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.sm,
  },

  headerTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },

  // ── Photo step

  photoStep: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },

  seasonEmoji: { fontSize: 56 },

  seasonCta: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    color: colors.text,
    textAlign: 'center',
  },

  pickButtons: {
    width: '100%',
    gap: spacing.md,
  },

  pickBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },

  pickBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },

  pickBtnText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.white,
  },

  // ── Preview step

  previewStep: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },

  previewWrapper: {
    overflow: 'hidden',
    borderRadius: borderRadius.md,
  },

  feedback: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },

  actionRow: {
    width: '100%',
    gap: spacing.md,
  },

  actionBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },

  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },

  actionBtnText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.white,
  },

  // ── Off-screen capture

  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
});
