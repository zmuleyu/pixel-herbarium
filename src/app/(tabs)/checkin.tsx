// Check-in wizard: photo → spot → preview+share
// 3-step flow using local state; no navigation between tabs until done.

import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius, getSeasonTheme } from '@/constants/theme';
import { getActiveSeason } from '@/constants/seasons';
import { useCheckinStore } from '@/stores/checkin-store';
import { useCheckinPhoto } from '@/hooks/useCheckinPhoto';
import { SpotSelector } from '@/components/checkin/SpotSelector';
import { StampPreview } from '@/components/stamps';
import type { FlowerSpot, SpotsData, StampStyle, StampPosition } from '@/types/hanami';
import { loadSpotsData } from '@/services/content-pack';

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
  const [feedback, setFeedback] = useState<string | null>(null);

  const checkinDate = useRef(new Date());

  const spotsData = loadSpotsData(season.id);
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

  async function handleStampShare(composedUri: string) {
    try {
      await Sharing.shareAsync(composedUri, { mimeType: 'image/png' });
    } catch {
      // share cancelled or failed — silent
    }
  }

  async function handleStampSave(
    composedUri: string,
    stampStyle: StampStyle,
    stampPosition: StampPosition,
  ) {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setFeedback(t('stamp.permissionRequired'));
        setTimeout(() => setFeedback(null), 2000);
        return;
      }
      await MediaLibrary.saveToLibraryAsync(composedUri);
      await addCheckin({
        id: genId(),
        seasonId: season.id,
        spotId: selectedSpot!.id,
        photoUri: photoUri!,
        composedUri,
        templateId: stampStyle,
        timestamp: checkinDate.current.toISOString(),
        synced: false,
        stampStyle,
        stampPosition,
      });
      setFeedback(t('stamp.saved'));
      setTimeout(() => {
        setFeedback(null);
        router.replace('/(tabs)/footprint');
      }, 1500);
    } catch {
      setFeedback(t('checkin.saveError'));
      setTimeout(() => setFeedback(null), 2000);
    }
  }

  function handleBack() {
    if (step === 'spot') setStep('photo');
    else if (step === 'preview') setStep('spot');
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <View testID="checkin.container" style={[styles.container, { backgroundColor: theme.bgTint }]}>
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
        <>
          <StampPreview
            photoUri={photoUri}
            spot={selectedSpot}
            date={checkinDate.current}
            seasonId={season.id}
            onSave={handleStampSave}
            onShare={handleStampShare}
          />
          {feedback != null && (
            <Text style={[styles.feedback, { color: theme.primary }]}>{feedback}</Text>
          )}
        </>
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

  // ── Feedback (overlaid above StampPreview actions)

  feedback: {
    position: 'absolute',
    bottom: spacing.xl * 2,
    alignSelf: 'center',
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
});
