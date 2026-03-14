import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useCapture } from '@/hooks/useCapture';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useAuthStore } from '@/stores/auth-store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { RARITY_LABELS } from '@/constants/plants';

// Statuses that show the processing overlay on the viewfinder
const PROCESSING_STATUSES = new Set(['checking', 'identifying', 'saving']);

// Statuses that trigger the result modal
const RESULT_STATUSES = new Set([
  'success', 'not_a_plant', 'no_match', 'cooldown', 'quota_exceeded', 'error',
]);

function processingLabel(status: string): string {
  switch (status) {
    case 'checking':    return 'チェック中…';
    case 'identifying': return '識別中…';
    case 'saving':      return '保存中…';
    default:            return '処理中…';
  }
}

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const capture = useCapture();
  const discovery = useDiscovery();

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

  async function handleCapture() {
    if (!cameraRef.current || capture.status !== 'ready') return;
    if (!capture.location || !user) return;

    const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
    if (photo) {
      await discovery.runDiscovery(photo.uri, capture.location);
    }
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
          <Text style={styles.buttonText}>許可する</Text>
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
          <Text style={styles.buttonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const showModal = RESULT_STATUSES.has(discovery.status);
  const isProcessing = PROCESSING_STATUSES.has(discovery.status);

  return (
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
            <Text style={styles.gpsText}>📡 GPS 取得中…</Text>
          )}
        </View>

        {/* Processing overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={colors.plantPrimary} />
            <Text style={styles.processingText}>{processingLabel(discovery.status)}</Text>
          </View>
        )}
      </CameraView>

      {/* ── Bottom controls ───────────────────────────────────────── */}
      <View style={styles.controls}>
        {capture.status === 'idle' && (
          <ActivityIndicator color={colors.plantPrimary} />
        )}

        {capture.status === 'ready' && !isProcessing && (
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
        )}

        {isProcessing && (
          <Text style={styles.processingHint}>{processingLabel(discovery.status)}</Text>
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
  } | null;
  daysRemaining?: number;
  onClose: () => void;
  onRetry: () => void;
  t: TFunction;
}

function ResultContent({ status, plant, daysRemaining, onClose, onRetry, t }: ResultContentProps) {
  if (status === 'success' && plant) {
    const rarityLabel = RARITY_LABELS[plant.rarity as keyof typeof RARITY_LABELS] ?? '★';
    return (
      <>
        <Text style={styles.rarityLabel}>{rarityLabel}</Text>
        <Text style={styles.plantNameJa}>{plant.name_ja}</Text>
        <Text style={styles.plantNameEn}>{plant.name_en}</Text>
        <View style={styles.divider} />
        <Text style={styles.hanakotobaLabel}>{t('herbarium.hanakotoba')}</Text>
        <Text style={styles.hanakotobaValue}>{plant.hanakotoba}</Text>
        <Text style={styles.flowerMeaning}>{plant.flower_meaning}</Text>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>閉じる</Text>
        </TouchableOpacity>
      </>
    );
  }

  let message = '';
  let showRetry = true;

  switch (status) {
    case 'not_a_plant':
      message = t('discover.notAPlant');
      break;
    case 'no_match':
      message = 'データベースに見つかりません';
      break;
    case 'cooldown':
      message = `${t('discover.cooldown')}\n残り ${daysRemaining ?? '?'} 日`;
      showRetry = false;
      break;
    case 'quota_exceeded':
      message = t('discover.quotaRemaining', { count: 0 });
      showRetry = false;
      break;
    case 'error':
      message = 'エラーが発生しました。もう一度お試しください。';
      break;
    default:
      message = status;
  }

  return (
    <>
      <Text style={styles.message}>{message}</Text>
      {showRetry ? (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>再試行</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={onClose}>
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>閉じる</Text>
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
  controls:           { height: 120, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  processingHint:     { color: colors.textSecondary, fontSize: typography.fontSize.sm },

  // Shutter button
  captureButton:      { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: colors.plantPrimary, alignItems: 'center', justifyContent: 'center' },
  captureInner:       { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.plantPrimary },

  // Button
  button:             { backgroundColor: colors.plantPrimary, borderRadius: borderRadius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl },
  buttonSecondary:    { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  buttonText:         { color: colors.white, fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md },
  buttonTextSecondary:{ color: colors.text },

  // Modal
  modalBackdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:          { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, padding: spacing.xl, gap: spacing.md, alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl },

  // Plant card
  rarityLabel:        { fontSize: typography.fontSize.lg, color: colors.plantPrimary },
  plantNameJa:        { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl, color: colors.text },
  plantNameEn:        { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontStyle: 'italic' },
  divider:            { width: '60%', height: 1, backgroundColor: colors.border },
  hanakotobaLabel:    { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  hanakotobaValue:    { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text },
  flowerMeaning:      { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontStyle: 'italic', marginBottom: spacing.sm },
});
