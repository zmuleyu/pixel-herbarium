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
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import { useCapture } from '@/hooks/useCapture';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useAuthStore } from '@/stores/auth-store';
import { checkQuota } from '@/services/antiCheat';
import { useHerbariumStore } from '@/stores/herbarium-store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { RARITY_LABELS } from '@/constants/plants';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SharePoster } from '@/components/SharePoster';

// Statuses that show the processing overlay on the viewfinder
const PROCESSING_STATUSES = new Set(['checking', 'identifying', 'saving']);

// Statuses that trigger the result modal
const RESULT_STATUSES = new Set([
  'success', 'not_a_plant', 'no_match', 'cooldown', 'quota_exceeded', 'out_of_region', 'error',
]);

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

  // Request permissions on mount
  useEffect(() => {
    capture.requestPermissions();
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
    <View style={styles.container}>

      {/* ── Camera viewfinder ─────────────────────────────────────── */}
      <CameraView ref={cameraRef} style={styles.camera} facing="back">

        {/* GPS badge */}
        <View style={styles.gpsBadge}>
          {capture.status === 'ready' ? (
            <Text style={styles.gpsText}>
              📍 {capture.location?.latitude.toFixed(4)}, {capture.location?.longitude.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.gpsText}>📡 {t('discover.gpsAcquiring')}</Text>
          )}
        </View>

        {/* Processing overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={colors.plantPrimary} />
            <Text style={styles.processingText}>{processingLabel(discovery.status, t)}</Text>
          </View>
        )}
      </CameraView>

      {/* ── Bottom controls ───────────────────────────────────────── */}
      <View style={styles.controls}>
        {capture.status === 'idle' && (
          <ActivityIndicator color={colors.plantPrimary} />
        )}

        {capture.status === 'ready' && !isProcessing && (
          <>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              activeOpacity={0.8}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
            {quotaRemaining !== null && quotaRemaining > 0 && (
              <Text style={[styles.quotaHint, quotaRemaining <= 2 && styles.quotaHintLow]}>
                {t('discover.quotaRemaining', { count: quotaRemaining })}
              </Text>
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

function ResultContent({ status, plant, daysRemaining, onClose, onRetry, t }: ResultContentProps) {
  const router = useRouter();
  const cardScale = useRef(new Animated.Value(0.85)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const posterRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [status]);

  async function handleShare() {
    if (!posterRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(posterRef, { format: 'jpg', quality: 0.92 });
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: '花図鉑を共有' });
    } catch {
      // Share cancelled or failed — silent
    } finally {
      setSharing(false);
    }
  }

  if (status === 'success' && plant) {
    const rarityLabel = RARITY_LABELS[plant.rarity as keyof typeof RARITY_LABELS] ?? '★';
    const rarityEmoji = plant.rarity === 3 ? '⭐⭐⭐' : plant.rarity === 2 ? '⭐⭐' : '⭐';
    return (
      <Animated.View style={{ width: '100%', alignItems: 'center', gap: spacing.sm, transform: [{ scale: cardScale }], opacity: cardOpacity }}>
        {/* First-discovery banner */}
        {plant.isFirstDiscovery && (
          <View style={styles.firstDiscoveryBanner}>
            <Text style={styles.firstDiscoveryText}>✨ 新発見！</Text>
          </View>
        )}
        {/* Off-screen poster for sharing (invisible to user) */}
        <View style={styles.posterOffscreen} pointerEvents="none">
          <SharePoster
            ref={posterRef}
            plant={{
              name_ja: plant.name_ja,
              name_latin: plant.name_en,
              rarity: plant.rarity,
              hanakotoba: plant.hanakotoba,
              pixel_sprite_url: plant.pixel_sprite_url,
              cityRank: plant.cityRank,
            }}
          />
        </View>

        {/* Plant image or rarity emoji card */}
        {plant.pixel_sprite_url ? (
          <Image source={{ uri: plant.pixel_sprite_url }} style={styles.spriteImage} resizeMode="contain" />
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
            {t('discover.cityRank', { city: '全国', rank: plant.cityRank, plant: plant.name_ja })}
          </Text>
        )}
        <View style={styles.divider} />
        <Text style={styles.hanakotobaLabel}>{t('herbarium.hanakotoba')}</Text>
        <Text style={styles.hanakotobaValue}>{plant.hanakotoba}</Text>
        <Text style={styles.flowerMeaning}>{plant.flower_meaning}</Text>

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleShare} disabled={sharing}>
            {sharing
              ? <ActivityIndicator size="small" color={colors.plantPrimary} />
              : <Text style={[styles.buttonText, styles.buttonTextSecondary]}>{t('common.share')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => { onClose(); router.navigate('/(tabs)/herbarium'); }}>
            <Text style={styles.buttonText}>{t('discover.viewHerbarium')}</Text>
          </TouchableOpacity>
        </View>
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
  spriteEmoji:        { width: 120, height: 120, borderRadius: borderRadius.md, borderWidth: 2, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: 4 },
  spriteEmojiText:    { fontSize: 48 },
  spriteEmojiRarity:  { fontSize: typography.fontSize.xs, color: colors.textSecondary },

  // Plant card
  rarityLabel:        { fontSize: typography.fontSize.lg, color: colors.plantPrimary },
  cityRankText:       { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },

  // Share poster (off-screen, invisible to user)
  posterOffscreen:    { position: 'absolute', left: -9999, top: 0 },

  // Button row (close + share side by side)
  buttonRow:          { flexDirection: 'row', gap: spacing.md },
  plantNameJa:        { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl, color: colors.text },
  plantNameEn:        { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontStyle: 'italic' },
  divider:            { width: '60%', height: 1, backgroundColor: colors.border },
  hanakotobaLabel:    { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  hanakotobaValue:    { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text },
  flowerMeaning:      { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontStyle: 'italic', marginBottom: spacing.sm },
});
