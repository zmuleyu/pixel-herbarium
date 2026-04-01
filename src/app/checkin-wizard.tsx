// src/app/checkin-wizard.tsx
// Photo check-in wizard: photo → spot → preview+share
// Navigated to from Home CTA. Not a tab route.

import { useState, useRef } from 'react';
import { GuideWrapper, MeasuredView } from '@/components/guide';
import { STAMP_STEPS } from '@/constants/guide-steps';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
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
import CheckinSuccessOverlay from '@/components/CheckinSuccessOverlay';
import type { FlowerSpot, SpotsData, StampStyle, StampPosition, StampTransform } from '@/types/hanami';
import { loadSpotsData } from '@/services/content-pack';
import { getPreviousVisitYears } from '@/utils/stamp-position';

const SEASON_LABELS: Record<string, string> = {
  sakura: '春', ajisai: '夏', himawari: '夏', momiji: '秋', tsubaki: '冬',
};

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

type WizardStep = 'photo' | 'spot' | 'preview';

export default function CheckinWizardScreen() {
  const { t } = useTranslation();
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);
  const { addCheckin, history } = useCheckinStore();
  const { pickFromCamera, pickFromLibrary, requesting } = useCheckinPhoto();

  const [step, setStep] = useState<WizardStep>('photo');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<FlowerSpot | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastStampPosition, setLastStampPosition] = useState<StampPosition>('bottom-right');

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
    stampStyle: string,
    stampTransform?: StampTransform,
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
        stampStyle: stampStyle as StampStyle,
        stampTransform,
      });
      setShowSuccess(true);
    } catch {
      setFeedback(t('checkin.saveError'));
      setTimeout(() => setFeedback(null), 2000);
    }
  }

  function handleBack() {
    if (step === 'photo') {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    } else if (step === 'spot') {
      setStep('photo');
    } else if (step === 'preview') {
      setStep('spot');
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <GuideWrapper featureKey="stamp" steps={STAMP_STEPS} overlayVariant="light">
    <View testID="checkin-wizard.container" style={[styles.container, { backgroundColor: theme.bgTint }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={[styles.backText, { color: theme.primary }]}>
            {step === 'photo' ? `← ${t('common.back')}` : t('common.back')}
          </Text>
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

      {/* ── Success overlay ── */}
      {showSuccess && selectedSpot != null && (
        <CheckinSuccessOverlay
          spot={selectedSpot}
          seasonLabel={`${checkinDate.current.getFullYear()} ${SEASON_LABELS[season.id] ?? ''}`}
          isRevisit={history.filter(r => r.spotId === selectedSpot.id).length > 1}
          checkinCount={new Set(history.map(r => r.spotId)).size}
          stampPosition={lastStampPosition}
          previousVisitYears={getPreviousVisitYears(history, selectedSpot.id, season.id)}
          onDismiss={() => {
            setShowSuccess(false);
            router.replace('/(tabs)/home');
          }}
        />
      )}
    </View>
    </GuideWrapper>
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

  // ── Feedback

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
