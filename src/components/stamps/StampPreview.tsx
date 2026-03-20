import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Image, TouchableOpacity, Text, StyleSheet, Dimensions,
  ActivityIndicator, Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MeasuredView } from '@/components/guide';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, stamp as stampConst } from '@/constants/theme';
import { SEASONS, getActiveSeason } from '@/constants/seasons';
import { StampOverlay } from './StampOverlay';
import { StyleSelector } from './StyleSelector';
import { PositionSelector } from './PositionSelector';
import type { FlowerSpot, StampStyleId, StampPosition } from '@/types/hanami';
import { STAMP_STYLE_MIGRATION, DEFAULT_STAMP_STYLE_ID } from '@/constants/stamp-styles';

const { width: SCREEN_W } = Dimensions.get('window');

// Valid positions for restore validation
const VALID_POSITIONS: StampPosition[] = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

const OPACITY_KEY = 'stamp_opacity_preference';
const SIZE_KEY = 'stamp_size_preference';

const VALID_STYLE_IDS: string[] = ['classic', 'relief', 'postcard', 'medallion', 'window', 'minimal'];

interface StampPreviewProps {
  photoUri: string;
  spot: FlowerSpot;
  date: Date;
  seasonId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (composedUri: string, stampStyle: any, stampPosition: StampPosition) => void;
  onShare: (composedUri: string) => void;
}

export function StampPreview({
  photoUri, spot, date, seasonId, onSave, onShare,
}: StampPreviewProps) {
  const { t } = useTranslation();
  const season = SEASONS.find(s => s.id === seasonId) ?? getActiveSeason();
  const viewShotRef = useRef<View>(null);

  const [stampStyle, setStampStyle] = useState<StampStyleId | string>(DEFAULT_STAMP_STYLE_ID);
  const [stampPosition, setStampPosition] = useState<StampPosition>(stampConst.defaultPosition);
  const [opacity, setOpacity] = useState(0.9);
  const [scale, setScale] = useState(1.0);
  const [busy, setBusy] = useState(false);

  // Track previous haptic thresholds to avoid repeated triggers
  const prevOpacityHalf = useRef(false);
  const prevOpacityFull = useRef(false);

  // Restore preferences
  useEffect(() => {
    (async () => {
      const [savedStyle, savedPos, savedOpacity, savedSize] = await Promise.all([
        AsyncStorage.getItem(stampConst.storageKey),
        AsyncStorage.getItem(stampConst.positionStorageKey),
        AsyncStorage.getItem(OPACITY_KEY),
        AsyncStorage.getItem(SIZE_KEY),
      ]);
      if (savedStyle) {
        const migrated = STAMP_STYLE_MIGRATION[savedStyle] ?? savedStyle;
        if (VALID_STYLE_IDS.includes(migrated)) setStampStyle(migrated as StampStyleId);
      }
      if (savedPos && VALID_POSITIONS.includes(savedPos as StampPosition)) {
        setStampPosition(savedPos as StampPosition);
      }
      if (savedOpacity) setOpacity(parseFloat(savedOpacity));
      if (savedSize) setScale(parseFloat(savedSize));
    })();
  }, []);

  const handleStyleChange = useCallback((s: StampStyleId) => {
    setStampStyle(s);
    AsyncStorage.setItem(stampConst.storageKey, s);
  }, []);

  const handlePositionChange = useCallback((p: StampPosition) => {
    setStampPosition(p);
    AsyncStorage.setItem(stampConst.positionStorageKey, p);
  }, []);

  const handleOpacityChange = useCallback((val: number) => {
    const rounded = Math.round(val * 20) / 20; // step 5%
    setOpacity(rounded);
    // Haptic feedback at key thresholds
    const isHalf = rounded >= 0.48 && rounded <= 0.52;
    const isFull = rounded >= 0.98;
    if (isHalf && !prevOpacityHalf.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      prevOpacityHalf.current = true;
    } else if (!isHalf) {
      prevOpacityHalf.current = false;
    }
    if (isFull && !prevOpacityFull.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      prevOpacityFull.current = true;
    } else if (!isFull) {
      prevOpacityFull.current = false;
    }
  }, []);

  const handleOpacityComplete = useCallback((val: number) => {
    const rounded = Math.round(val * 20) / 20;
    AsyncStorage.setItem(OPACITY_KEY, String(rounded));
  }, []);

  const handleScaleChange = useCallback((val: number) => {
    const rounded = Math.round(val * 20) / 20; // step 5%
    setScale(rounded);
  }, []);

  const handleScaleComplete = useCallback((val: number) => {
    const rounded = Math.round(val * 20) / 20;
    AsyncStorage.setItem(SIZE_KEY, String(rounded));
  }, []);

  const handleCTA = useCallback(async () => {
    if (busy || !viewShotRef.current) return;
    setBusy(true);
    try {
      const composedUri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      onSave(composedUri, stampStyle as StampStyleId, stampPosition);
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
            userOpacity={opacity}
            userScale={scale}
          />
        </View>
        {/* Position dots are outside viewShotRef — not captured in export */}
        <MeasuredView measureKey="stamp.positionGrid">
          <PositionSelector
            selected={stampPosition}
            onSelect={handlePositionChange}
            themeColor={season.themeColor}
          />
        </MeasuredView>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <StyleSelector
          selected={stampStyle}
          onSelect={handleStyleChange}
          themeColor={season.themeColor}
        />

        {/* Opacity slider */}
        <MeasuredView measureKey="stamp.opacitySlider" style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>{t('stamp.opacity')}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.2}
            maximumValue={1.0}
            value={opacity}
            onValueChange={handleOpacityChange}
            onSlidingComplete={handleOpacityComplete}
            minimumTrackTintColor={season.themeColor}
            maximumTrackTintColor={colors.border}
            thumbTintColor={season.themeColor}
          />
          <Text style={styles.sliderValue}>{Math.round(opacity * 100)}%</Text>
        </MeasuredView>

        {/* Size slider */}
        <View style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>{t('stamp.size')}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.6}
            maximumValue={1.5}
            value={scale}
            onValueChange={handleScaleChange}
            onSlidingComplete={handleScaleComplete}
            minimumTrackTintColor={season.themeColor}
            maximumTrackTintColor={colors.border}
            thumbTintColor={season.themeColor}
          />
          <Text style={styles.sliderValue}>{Math.round(scale * 100)}%</Text>
        </View>

        <MeasuredView measureKey="stamp.saveButton">
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
        </MeasuredView>
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
    gap: spacing.sm,
  },
  // Slider row
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sliderLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    width: 36,
  },
  slider: {
    flex: 1,
    height: 32,
  },
  sliderValue: {
    fontSize: 11,
    color: colors.text,
    width: 34,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  // CTA
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
