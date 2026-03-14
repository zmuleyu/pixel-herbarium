import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { useCapture } from '@/hooks/useCapture';
import { useAuthStore } from '@/stores/auth-store';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

export default function DiscoverScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    status,
    cameraGranted,
    locationGranted,
    location,
    errorMessage,
    requestPermissions,
    acquireLocation,
    reset,
  } = useCapture();

  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Request permissions on mount
  useEffect(() => {
    requestPermissions();
  }, []);

  async function handleCapture() {
    if (!cameraRef.current || status !== 'ready') return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
    if (photo) {
      setPhotoUri(photo.uri);
      // TODO Task 2.2: pass photo.uri + location to AI pipeline
      Alert.alert('撮影完了', `GPS: ${location?.latitude.toFixed(4)}, ${location?.longitude.toFixed(4)}\n画像: ${photo.uri.slice(-30)}`);
    }
  }

  // Permissions not yet granted
  if (!cameraGranted || !locationGranted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{t('discover.gpsRequired')}</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>許可する</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{errorMessage}</Text>
        <TouchableOpacity style={styles.button} onPress={() => { reset(); acquireLocation(); }}>
          <Text style={styles.buttonText}>再試行</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera viewfinder */}
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* GPS status badge */}
        <View style={styles.gpsBadge}>
          {status === 'ready' ? (
            <Text style={styles.gpsText}>
              📍 {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.gpsText}>📡 GPS 取得中…</Text>
          )}
        </View>
      </CameraView>

      {/* Bottom controls */}
      <View style={styles.controls}>
        {status === 'idle' && (
          <TouchableOpacity style={styles.button} onPress={acquireLocation}>
            <Text style={styles.buttonText}>GPS 取得</Text>
          </TouchableOpacity>
        )}

        {status === 'ready' && (
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        )}

        {(status === 'capturing' || status === 'processing') && (
          <Text style={styles.message}>{t('discover.processing')}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  message: {
    color: colors.text,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight,
  },
  gpsBadge: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  gpsText: {
    color: '#fff',
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  controls: {
    height: 120,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: colors.plantPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    color: colors.white,
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.plantPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.plantPrimary,
  },
});
