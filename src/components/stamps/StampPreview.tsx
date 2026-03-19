import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Image, TouchableOpacity, Text, StyleSheet, Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, stamp as stampConst } from '@/constants/theme';
import { SEASONS, getActiveSeason } from '@/constants/seasons';
import { StampOverlay } from './StampOverlay';
import { StyleSelector } from './StyleSelector';
import { PositionSelector } from './PositionSelector';
import type { FlowerSpot, StampStyle, StampPosition } from '@/types/hanami';

const { width: SCREEN_W } = Dimensions.get('window');

interface StampPreviewProps {
  photoUri: string;
  spot: FlowerSpot;
  date: Date;
  seasonId: string;
  onSave: (composedUri: string, stampStyle: StampStyle, stampPosition: StampPosition) => void;
  onShare: (composedUri: string) => void;
}

export function StampPreview({
  photoUri, spot, date, seasonId, onSave, onShare,
}: StampPreviewProps) {
  const { t } = useTranslation();
  const season = SEASONS.find(s => s.id === seasonId) ?? getActiveSeason();
  const viewShotRef = useRef<View>(null);

  const [stampStyle, setStampStyle] = useState<StampStyle>(stampConst.defaultStyle);
  const [stampPosition, setStampPosition] = useState<StampPosition>(stampConst.defaultPosition);
  const [busy, setBusy] = useState(false);

  // Restore preferences
  useEffect(() => {
    (async () => {
      const [savedStyle, savedPos] = await Promise.all([
        AsyncStorage.getItem(stampConst.storageKey),
        AsyncStorage.getItem(stampConst.positionStorageKey),
      ]);
      if (savedStyle === 'pixel' || savedStyle === 'seal' || savedStyle === 'minimal') {
        setStampStyle(savedStyle);
      }
      if (savedPos === 'top-left' || savedPos === 'top-right' || savedPos === 'bottom-left' || savedPos === 'bottom-right') {
        setStampPosition(savedPos);
      }
    })();
  }, []);

  const handleStyleChange = useCallback((s: StampStyle) => {
    setStampStyle(s);
    AsyncStorage.setItem(stampConst.storageKey, s);
  }, []);

  const handlePositionChange = useCallback((p: StampPosition) => {
    setStampPosition(p);
    AsyncStorage.setItem(stampConst.positionStorageKey, p);
  }, []);

  const handleCTA = useCallback(async () => {
    if (busy || !viewShotRef.current) return;
    setBusy(true);
    try {
      const composedUri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      onSave(composedUri, stampStyle, stampPosition);
    } catch {
      // fallback handled by parent
    } finally {
      setBusy(false);
    }
  }, [busy, onSave, stampStyle, stampPosition]);

  return (
    <View style={styles.container}>
      {/* Photo + Stamp area */}
      <View style={styles.photoContainer}>
        {/* Capturable area — only photo + stamp, no UI controls */}
        <View
          ref={viewShotRef}
          collapsable={false}
          style={StyleSheet.absoluteFill}
        >
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            resizeMode="contain"
          />
          <StampOverlay
            style={stampStyle}
            position={stampPosition}
            spot={spot}
            date={date}
            season={season}
          />
        </View>
        {/* Position dots are outside viewShotRef — not captured in export */}
        <PositionSelector
          selected={stampPosition}
          onSelect={handlePositionChange}
          themeColor={season.themeColor}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <StyleSelector
          selected={stampStyle}
          onSelect={handleStyleChange}
          themeColor={season.themeColor}
        />

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: season.themeColor }]}
          onPress={handleCTA}
          disabled={busy}
          activeOpacity={0.8}
          accessibilityLabel={t('stamp.share')}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.ctaText}>{t('stamp.share')} →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  photoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  controls: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  cta: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  ctaText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
