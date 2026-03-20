import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { GuideWrapper, MeasuredView } from '@/components/guide';
import { DISCOVER_STEPS } from '@/constants/guide-steps';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import type { TFunction } from 'i18next';
import { useCapture } from '@/hooks/useCapture';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useAuthStore } from '@/stores/auth-store';
import { checkQuota } from '@/services/antiCheat';
import { useHerbariumStore } from '@/stores/herbarium-store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { RARITY_LABELS } from '@/constants/plants';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ShareSheet } from '@/components/ShareSheet';
import { getCurrentSeason, type Season } from '@/utils/date';

const SEASON_EVENTS: Partial<Record<Season, { emoji: string; key: string }>> = {
  spring: { emoji: '🌸', key: 'events.sakuraMatsuri' },
  summer: { emoji: '🌻', key: 'events.tsuyuNoHana' },
  autumn: { emoji: '🍂', key: 'events.momojiGari' },
};

// Statuses that show the processing overlay on the viewfinder
const PROCESSING_STATUSES = new Set(['checking', 'identifying', 'saving']);

// Statuses that trigger the result modal
const RESULT_STATUSES = new Set([
  'success', 'not_a_plant', 'no_match', 'cooldown', 'quota_exceeded', 'out_of_region', 'error',
]);

const FRAME_SIZE = 240;
const SAGE_BRACKET = 'rgba(159, 182, 159, 0.9)';
const SAGE_BORDER  = 'rgba(159, 182, 159, 0.28)';

function processingLabel(status: string, t: (key: string) => string): string {
  switch (status) {
    case 'checking':    return t('discover.checking');
    case 'identifying': return t('discover.identifying');
    case 'saving':      return t('discover.saving');
    default:            return t('discover.processingDefault');
  }
}

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const capture = useCapture();
  const discovery = useDiscovery();
  const triggerHerbariumRefresh = useHerbariumStore((s) => s.triggerRefresh);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);

  const cameraRef = useRef<CameraView>(null);

  // Request permissions on mount — only after onboarding is complete
  useEffect(() => {
    SecureStore.getItemAsync('onboarding_done_v1').then((done) => {
      if (done) capture.requestPermissions();
    }).catch(() => {});
  }, []);

  // Acquire GPS once permissions are both granted
  useEffect(() => {
    if (capture.cameraGranted && capture.locationGranted && capture.status === 'idle') {
      capture.acquireLocation();
    }
  }, [capture.cameraGranted, capture.locationGranted]);

  // Notify herbarium to refresh when a discovery succeeds; re-fetch quota
  useEffect(() => {
    if (discovery.status === 'success') {
      triggerHerbariumRefresh();
      if (user?.id) checkQuota(user.id).then(({ remaining }) => setQuotaRemaining(remaining));
    }
  }, [discovery.status]);

  // Fetch quota on mount (once user is known)
  useEffect(() => {
    if (!user?.id) return;
    checkQuota(user.id).then(({ remaining }) => setQuotaRemaining(remaining));
  }, [user?.id]);

  async function handleCapture() {
    if (!cameraRef.current || capture.status !== 'ready') return;
    if (!capture.location || !user) return;

    const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
    if (photo) {
      await discovery.runDiscovery(photo.uri, capture.location);
    }
  }

  async function handleGalleryPick() {
    if (!capture.location || !user) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    await discovery.runDiscovery(result.assets[0].uri, capture.location);
  }

  function handleRetry() {
    discovery.reset();
    capture.reset();
    capture.acquireLocation();
  }

  // ── Permissions gate ──────────────────────────────────────────────
  if (!capture.cameraGranted || !capture.locationGranted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{t('discover.gpsRequired')}</Text>
        <TouchableOpacity style={styles.button} onPress={capture.requestPermissions}>
          <Text style={styles.buttonText}>{t('discover.allowPermission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── GPS error gate ────────────────────────────────────────────────
  if (capture.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{capture.errorMessage}</Text>
        <TouchableOpacity style={styles.button} onPress={() => { capture.reset(); capture.acquireLocation(); }}>
          <Text style={styles.buttonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const showModal = RESULT_STATUSES.has(discovery.status);
  const isProcessing = PROCESSING_STATUSES.has(discovery.status);

  return (
    <ErrorBoundary fallbackLabel={t('discover.cameraError')}>
    <GuideWrapper featureKey="discover" steps={DISCOVER_STEPS} overlayVariant="dark">
    <View style={styles.container}>

      {/* ── Camera viewfinder ─────────────────────────────────────── */}
      <MeasuredView measureKey="discover.viewfinder" style={styles.camera}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back">

          {/* GPS badge */}
          <MeasuredView measureKey="discover.gpsIndicator" style={styles.gpsBadge}>
            {capture.status === 'ready' ? (
              <Text style={styles.gpsText}>
                📍 {capture.location?.latitude.toFixed(4)}, {capture.location?.longitude.toFixed(4)}
              </Text>
            ) : (
              <Text style={styles.gpsText}>📡 {t('discover.gpsAcquiring')}</Text>
            )}
          </MeasuredView>

          {/* Seasonal event banner */}
          <EventBanner />

          {/* Viewfinder frame */}
          <ViewfinderFrame isReady={capture.status === 'ready' && !isProcessing} />

          {/* Processing overlay */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={colors.plantPrimary} />
              <Text style={styles.processingText}>{processingLabel(discovery.status, t)}</Text>
            </View>
          )}
        </CameraView>
      </MeasuredView>

      {/* ── Bottom controls ───────────────────────────────────────── */}
      <View style={styles.controls}>
        {capture.status === 'idle' && (
          <ActivityIndicator color={colors.plantPrimary} />
        )}

        {capture.status === 'ready' && !isProcessing && (
          <>
            <TouchableOpacity
              style={[styles.captureButton, quotaRemaining === 0 && styles.captureButtonDimmed]}
              onPress={quotaRemaining === 0 ? undefined : handleCapture}
              activeOpacity={quotaRemaining === 0 ? 1 : 0.8}
              testID="discover.capture"
            >
              <View style={[styles.captureInner, quotaRemaining === 0 && styles.captureInnerDimmed]} />
            </TouchableOpacity>
            {quotaRemaining === 0 ? (
              <Text style={styles.quotaExhausted}>{t('discover.quotaExhausted')}</Text>
            ) : quotaRemaining !== null && (
              <MeasuredView measureKey="discover.quotaDisplay">
                <Text style={[styles.quotaHint, quotaRemaining <= 2 && styles.quotaHintLow]}>
                  {t('discover.quotaRemaining', { count: quotaRemaining })}
                </Text>
              </MeasuredView>
            )}
          </>
        )}

        {isProcessing && (
          <Text style={styles.processingHint}>{processingLabel(discovery.status, t)}</Text>
        )}

        {__DEV__ && capture.status === 'ready' && !isProcessing && (
          <TouchableOpacity
            style={styles.devBtn}
            onPress={handleGalleryPick}
            activeOpacity={0.7}
          >
            <Text style={styles.devBtnText}>DEV: Pick from Gallery</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Result Modal ──────────────────────────────────────────── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => { discovery.reset(); }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ResultContent
              status={discovery.status}
              plant={discovery.discoveredPlant}
              daysRemaining={discovery.daysRemaining}
              onClose={() => discovery.reset()}
              onRetry={handleRetry}
              t={t}
            />
          </View>
        </View>
      </Modal>
    </View>
    </GuideWrapper>
    </ErrorBoundary>
  );
}

// ── Result card sub-component ─────────────────────────────────────────
interface ResultContentProps {
  status: string;
  plant: {
    name_ja: string;
    name_en: string;
    rarity: number;
    hanakotoba: string;
    flower_meaning: string;
    pixel_sprite_url: string | null;
    cityRank: number | null;
    isFirstDiscovery: boolean;
  } | null;
  daysRemaining?: number;
  onClose: () => void;
  onRetry: () => void;
  t: TFunction;
}

// ── Gold particle burst for ★★★ rare discoveries ────────────────────
const PARTICLE_COUNT = 12;
const PARTICLE_COLORS = ['#f5d5d0', '#e8a87c', '#f5e6a3', '#c1e8d8'];

function RareParticles() {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    const animations = particles.map((p, i) => {
      const angle = (i / PARTICLE_COUNT) * 2 * Math.PI;
      const radius = 60 + Math.random() * 40;
      const duration = 800 + Math.random() * 400;
      return Animated.parallel([
        Animated.timing(p.x, { toValue: Math.cos(angle) * radius, duration, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: Math.sin(angle) * radius, duration, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(p.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(p.scale, { toValue: 0, duration: duration - 200, useNativeDriver: true }),
        ]),
        Animated.timing(p.opacity, { toValue: 0, duration, useNativeDriver: true }),
      ]);
    });
    Animated.stagger(50, animations).start();
  }, []);

  return (
    <View style={particleStyles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            particleStyles.dot,
            { backgroundColor: PARTICLE_COLORS[i % PARTICLE_COLORS.length] },
            { transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }], opacity: p.opacity },
          ]}
        />
      ))}
    </View>
  );
}

function ResultContent({ status, plant, daysRemaining, onClose, onRetry, t }: ResultContentProps) {
  const router = useRouter();
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const [shareSheetVisible, setShareSheetVisible] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [status]);

  if (status === 'success' && plant) {
    const rarityLabel = RARITY_LABELS[plant.rarity as keyof typeof RARITY_LABELS] ?? '★';
    const rarityEmoji = plant.rarity === 3 ? '⭐⭐⭐' : plant.rarity === 2 ? '⭐⭐' : '⭐';
    return (
      <Animated.View style={{ width: '100%', alignItems: 'center', gap: spacing.sm, transform: [{ scale: cardScale }], opacity: cardOpacity }}>
        {/* Gold particle burst for ★★★ */}
        {plant.rarity === 3 && <RareParticles />}

        {/* First-discovery banner */}
        {plant.isFirstDiscovery && (
          <View style={styles.firstDiscoveryBanner}>
            <Text style={styles.firstDiscoveryText}>{t('discover.firstDiscovery')}</Text>
          </View>
        )}

        {/* Plant image or rarity emoji card */}
        {plant.pixel_sprite_url ? (
          <>
            <Image source={{ uri: plant.pixel_sprite_url }} style={styles.spriteImage} resizeMode="contain" />
            <Text style={styles.aiLabel}>{t('ai.generated')}</Text>
          </>
        ) : (
          <View style={[styles.spriteEmoji, { borderColor: plant.rarity === 3 ? colors.rarity.rare : plant.rarity === 2 ? colors.rarity.uncommon : colors.rarity.common }]}>
            <Text style={styles.spriteEmojiText}>🌸</Text>
            <Text style={styles.spriteEmojiRarity}>{rarityEmoji}</Text>
          </View>
        )}
        <Text style={styles.rarityLabel}>{rarityLabel}</Text>
        <Text style={styles.plantNameJa}>{plant.name_ja}</Text>
        <Text style={styles.plantNameEn}>{plant.name_en}</Text>
        {plant.cityRank != null && (
          <Text style={styles.cityRankText}>
            {t('discover.cityRank', { city: t('discover.nationwide'), rank: plant.cityRank, plant: plant.name_ja })}
          </Text>
        )}
        <View style={styles.divider} />
        <Text style={styles.hanakotobaLabel}>{t('herbarium.hanakotoba')}</Text>
        <Text style={styles.hanakotobaValue}>{plant.hanakotoba}</Text>
        <Text style={styles.flowerMeaning}>{plant.flower_meaning}</Text>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => setShareSheetVisible(true)}>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>{t('common.share')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => { onClose(); router.navigate('/(tabs)/herbarium'); }}>
            <Text style={styles.buttonText}>{t('discover.viewHerbarium')}</Text>
          </TouchableOpacity>
        </View>

        <ShareSheet
          visible={shareSheetVisible}
          onClose={() => setShareSheetVisible(false)}
          plant={{
            name_ja: plant.name_ja,
            name_latin: plant.name_en,
            rarity: plant.rarity,
            hanakotoba: plant.hanakotoba ?? '',
            bloom_months: [],
            pixel_sprite_url: plant.pixel_sprite_url,
            cityRank: plant.cityRank ?? null,
          }}
          discoveryDate={new Date().toISOString()}
        />
      </Animated.View>
    );
  }

  let message = '';
  let showRetry = true;

  switch (status) {
    case 'not_a_plant':
      message = t('discover.notAPlant');
      break;
    case 'no_match':
      message = t('discover.noMatch');
      break;
    case 'out_of_region':
      message = t('discover.outOfRegion');
      showRetry = false;
      break;
    case 'cooldown':
      message = `${t('discover.cooldown')}\n${daysRemaining ?? '?'}`;
      showRetry = false;
      break;
    case 'quota_exceeded':
      message = t('discover.quotaRemaining', { count: 0 });
      showRetry = false;
      break;
    case 'error':
      message = t('discover.identifyError');
      break;
    default:
      message = status;
  }

  return (
    <>
      <Text style={styles.message}>{message}</Text>
      {showRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={onClose}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>{t('common.close')}</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

// ── Event Banner ──────────────────────────────────────────────────────

function EventBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const event = SEASON_EVENTS[getCurrentSeason()];
  if (!event) return null;

  return (
    <TouchableOpacity
      style={styles.eventBanner}
      onPress={() => router.push('/(tabs)/herbarium')}
      activeOpacity={0.8}
    >
      <Text style={styles.eventEmoji}>{event.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.eventName}>{t(event.key)}</Text>
        <Text style={styles.eventActive}>{t('events.eventActive')}</Text>
      </View>
      <Text style={styles.eventChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Viewfinder overlay ────────────────────────────────────────────────

function ViewfinderFrame({ isReady }: { isReady: boolean }) {
  const { t } = useTranslation();
  const breathe      = useRef(new Animated.Value(1)).current;
  const frameOpacity = useRef(new Animated.Value(0)).current;

  // Fade in on mount
  useEffect(() => {
    Animated.timing(frameOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // Dim when not ready; restore + breathe when ready
  useEffect(() => {
    if (!isReady) {
      breathe.stopAnimation();
      Animated.timing(breathe, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      Animated.timing(frameOpacity, { toValue: 0.25, duration: 350, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(frameOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.013, duration: 2200, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1,     duration: 2200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isReady]);

  return (
    <View style={vfStyles.overlay} pointerEvents="none">
      <Animated.View style={[vfStyles.centered, { opacity: frameOpacity, transform: [{ scale: breathe }] }]}>
        {/* Circular viewfinder — sage ring + soft vignette */}
        <View style={vfStyles.circleContainer}>
          <View style={vfStyles.circleRing} />
          {/* Subtle crosshair lines */}
          <View style={[vfStyles.crosshair, vfStyles.crosshairH]} />
          <View style={[vfStyles.crosshair, vfStyles.crosshairV]} />
        </View>
        <Text style={vfStyles.guideText}>{t('discover.viewfinderGuide')}</Text>
      </Animated.View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#000' },
  camera:             { flex: 1 },
  center:             { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  message:            { color: colors.text, fontSize: typography.fontSize.md, textAlign: 'center', lineHeight: typography.fontSize.md * typography.lineHeight },

  // GPS badge
  gpsBadge:           { position: 'absolute', top: spacing.lg, left: spacing.md, right: spacing.md, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: borderRadius.sm, padding: spacing.xs },
  gpsText:            { color: '#fff', fontSize: typography.fontSize.xs, textAlign: 'center' },

  // Processing overlay
  processingOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  processingText:     { color: '#fff', fontSize: typography.fontSize.md, fontFamily: typography.fontFamily.display },

  // Controls bar
  controls:           { height: 120, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 6 },
  processingHint:     { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  quotaHint:          { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  quotaHintLow:       { color: colors.plantPrimary },
  quotaExhausted:     { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.md },
  captureButtonDimmed:{ borderColor: colors.border, opacity: 0.4 },
  captureInnerDimmed: { backgroundColor: colors.border },

  // Event banner
  eventBanner:        { position: 'absolute', bottom: spacing.lg, left: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  eventEmoji:         { fontSize: 20 },
  eventName:          { color: '#fff', fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.sm },
  eventActive:        { color: 'rgba(255,255,255,0.7)', fontSize: typography.fontSize.xs },
  eventChevron:       { color: 'rgba(255,255,255,0.6)', fontSize: 18, marginLeft: spacing.xs },

  // Shutter button
  captureButton:      { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: colors.plantPrimary, alignItems: 'center', justifyContent: 'center' },
  captureInner:       { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.plantPrimary },

  // Button
  button:             { backgroundColor: colors.plantPrimary, borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  buttonSecondary:    { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  buttonText:         { color: colors.white, fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md },
  buttonTextSecondary:{ color: colors.text },

  // Dev-only gallery button
  devBtn:             { marginTop: 8, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  devBtnText:         { color: '#fff', fontSize: typography.fontSize.xs },

  // Modal
  modalBackdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:          { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.xl, gap: spacing.md, alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl },

  // First-discovery banner
  firstDiscoveryBanner:  { backgroundColor: colors.creamYellow, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: '#e8d87c' },
  firstDiscoveryText:    { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md, color: colors.text },

  // Plant card image
  spriteImage:        { width: 120, height: 120, borderRadius: borderRadius.md },
  aiLabel:            { fontSize: 9, color: colors.textSecondary, opacity: 0.7, marginTop: 2 },
  spriteEmoji:        { width: 120, height: 120, borderRadius: borderRadius.md, borderWidth: 2, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: 4 },
  spriteEmojiText:    { fontSize: 48 },
  spriteEmojiRarity:  { fontSize: typography.fontSize.xs, color: colors.textSecondary },

  // Plant card
  rarityLabel:        { fontSize: typography.fontSize.lg, color: colors.plantPrimary },
  cityRankText:       { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },

  // Button row (close + share side by side)
  buttonRow:          { flexDirection: 'row', gap: spacing.md },
  plantNameJa:        { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl, color: colors.text },
  plantNameEn:        { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontStyle: 'italic' },
  divider:            { width: '60%', height: 1, backgroundColor: colors.border },
  hanakotobaLabel:    { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  hanakotobaValue:    { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text },
  flowerMeaning:      { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontStyle: 'italic', marginBottom: spacing.sm },
});

// Viewfinder overlay styles (isolated to keep main styles clean)
const vfStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80, // shift center upward, clear EventBanner space
  },
  centered: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  circleContainer: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleRing: {
    position: 'absolute',
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderRadius: FRAME_SIZE / 2,
    borderWidth: 2,
    borderColor: SAGE_BRACKET,
  },
  crosshair: {
    position: 'absolute',
    backgroundColor: SAGE_BORDER,
  },
  crosshairH: {
    width: FRAME_SIZE * 0.15,
    height: 1,
  },
  crosshairV: {
    width: 1,
    height: FRAME_SIZE * 0.15,
  },
  guideText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.display,
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.4,
  },
});

// Gold particle burst styles for ★★★ discoveries
const particleStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    width: 1,
    height: 1,
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
