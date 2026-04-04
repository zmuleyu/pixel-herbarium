import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Image, TouchableOpacity, Text, StyleSheet, Dimensions,
  ActivityIndicator, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, stamp as stampConst } from '@/constants/theme';
import { SEASONS, getActiveSeason } from '@/constants/seasons';
import { GestureStampOverlay } from './GestureStampOverlay';
import { CustomizationPanel } from './CustomizationPanel';
import { StyleSelector } from './StyleSelector';
import { PetalPressAnimation, STAMP_APPROX_SIZE } from './PetalPressAnimation';
import { StampRenderer } from './StampRenderer';
import type { FlowerSpot, StampStyleId, StampTransform, CustomOptions } from '@/types/hanami';
import { DEFAULT_CUSTOM_OPTIONS } from '@/types/hanami';
import { STAMP_STYLE_MIGRATION, DEFAULT_STAMP_STYLE_ID } from '@/constants/stamp-styles';
import {
  STAMP_CUSTOM_COLOR_KEY,
  STAMP_DECORATION_KEY,
  STAMP_EFFECT_TYPE_KEY,
  STAMP_TEXT_MODE_KEY,
} from '@/utils/app-storage';

const { width: SCREEN_W } = Dimensions.get('window');

const VALID_STYLE_IDS: string[] = ['classic', 'relief', 'postcard', 'medallion', 'window', 'minimal'];

interface StampPreviewProps {
  photoUri: string;
  spot: FlowerSpot;
  date: Date;
  seasonId: string;
  onSave: (composedUri: string, stampStyle: StampStyleId | string, stampTransform?: StampTransform) => void;
  onShare: (composedUri: string) => void;
}

export function StampPreview({
  photoUri, spot, date, seasonId, onSave, onShare,
}: StampPreviewProps) {
  const { t } = useTranslation();
  const season = SEASONS.find(s => s.id === seasonId) ?? getActiveSeason();
  const viewShotRef = useRef<View>(null);

  const [stampStyle, setStampStyle] = useState<StampStyleId | string>(DEFAULT_STAMP_STYLE_ID);
  const [busy, setBusy] = useState(false);
  const [customOptions, setCustomOptions] = useState<CustomOptions>(DEFAULT_CUSTOM_OPTIONS);
  const [currentTransform, setCurrentTransform] = useState<StampTransform | undefined>(undefined);
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoContainerSize, setPhotoContainerSize] = useState({ width: 0, height: 0 });
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Restore preferences
  useEffect(() => {
    (async () => {
      const [
        savedStyle,
        savedColor, savedEffect, savedTextMode, savedDecoration,
      ] = await Promise.all([
        AsyncStorage.getItem(stampConst.storageKey),
        AsyncStorage.getItem(STAMP_CUSTOM_COLOR_KEY),
        AsyncStorage.getItem(STAMP_EFFECT_TYPE_KEY),
        AsyncStorage.getItem(STAMP_TEXT_MODE_KEY),
        AsyncStorage.getItem(STAMP_DECORATION_KEY),
      ]);
      if (savedStyle) {
        const migrated = STAMP_STYLE_MIGRATION[savedStyle] ?? savedStyle;
        if (VALID_STYLE_IDS.includes(migrated)) setStampStyle(migrated as StampStyleId);
      }

      // Restore custom options
      const restoredColor =
        savedColor === null || savedColor === 'undefined' ? undefined : savedColor;
      const restoredEffect: CustomOptions['effectType'] =
        (savedEffect === 'shadow' || savedEffect === 'glow') ? savedEffect : 'none';
      const restoredTextMode: CustomOptions['textMode'] =
        (savedTextMode === 'hanakotoba' || savedTextMode === 'custom') ? savedTextMode : 'none';
      const restoredDecoration: CustomOptions['decorationKey'] =
        (savedDecoration === 'petals' || savedDecoration === 'branch' || savedDecoration === 'stars')
          ? savedDecoration : 'none';
      setCustomOptions({
        customColor: restoredColor,
        effectType: restoredEffect,
        textMode: restoredTextMode,
        customTextValue: '',      // not persisted, always starts empty
        decorationKey: restoredDecoration,
      });
    })();
  }, []);

  const handleStyleChange = useCallback((s: StampStyleId) => {
    setStampStyle(s);
    AsyncStorage.setItem(stampConst.storageKey, s);
  }, []);

  const handleCustomChange = useCallback((patch: Partial<CustomOptions>) => {
    setCustomOptions(prev => {
      const next = { ...prev, ...patch };
      // Persist relevant keys (not customTextValue)
      if ('customColor' in patch) {
        AsyncStorage.setItem(STAMP_CUSTOM_COLOR_KEY, next.customColor ?? 'undefined');
      }
      if ('effectType' in patch) {
        AsyncStorage.setItem(STAMP_EFFECT_TYPE_KEY, next.effectType);
      }
      if ('textMode' in patch) {
        AsyncStorage.setItem(STAMP_TEXT_MODE_KEY, next.textMode);
      }
      if ('decorationKey' in patch) {
        AsyncStorage.setItem(STAMP_DECORATION_KEY, next.decorationKey);
      }
      return next;
    });
  }, []);

  const handleCTA = useCallback(async () => {
    if (busy || !viewShotRef.current) return;
    setBusy(true);
    try {
      setIsCapturing(true);
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      const composedUri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      setIsCapturing(false);
      // Trigger animation instead of saving immediately
      setPendingUri(composedUri);
    } catch (e) {
      console.warn('StampPreview: capture failed', e);
      setIsCapturing(false);
      setFeedback(t('common.error'));
      setBusy(false);
    }
  }, [busy, stampStyle, currentTransform]);

  const handleAnimationComplete = useCallback(() => {
    if (pendingUri) {
      onSave(pendingUri, stampStyle as StampStyleId, currentTransform);
      setPendingUri(null);
    }
    setBusy(false);
  }, [pendingUri, onSave, stampStyle, currentTransform]);

  return (
    <View style={styles.container}>
      {/* Photo + Stamp area */}
      <View
        style={styles.photoContainer}
        onLayout={(e) => setPhotoContainerSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })}
      >
        {/* Capturable area — only photo + stamp, no UI controls */}
        <View
          ref={viewShotRef}
          collapsable={false}
          style={StyleSheet.absoluteFill}
        >
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            resizeMode="cover"
          />
          <GestureStampOverlay
            styleId={stampStyle}
            spot={spot}
            date={date}
            season={season}
            customOptions={customOptions}
            opacity={0.9}
            containerWidth={photoContainerSize.width}
            containerHeight={photoContainerSize.height}
            isCapturing={isCapturing}
            staticTransform={currentTransform}
            onTransformChange={setCurrentTransform}
          />
        </View>

        {/* Petal Press animation overlay — plays after capture, before save */}
        {pendingUri != null && (
          <PetalPressAnimation
            stampX={
              currentTransform
                ? currentTransform.x + STAMP_APPROX_SIZE / 2
                : photoContainerSize.width > 0
                  ? photoContainerSize.width - 80 / 2 - 16 + STAMP_APPROX_SIZE / 2
                  : photoContainerSize.width * 0.65 + STAMP_APPROX_SIZE / 2
            }
            stampY={
              currentTransform
                ? currentTransform.y + STAMP_APPROX_SIZE / 2
                : photoContainerSize.height > 0
                  ? photoContainerSize.height - 80 / 2 - 16 + STAMP_APPROX_SIZE / 2
                  : photoContainerSize.height * 0.65 + STAMP_APPROX_SIZE / 2
            }
            themeColor={season.themeColor}
            onComplete={handleAnimationComplete}
          >
            <StampRenderer
              styleId={stampStyle}
              spot={spot}
              date={date}
              season={season}
              customOptions={customOptions}
            />
          </PetalPressAnimation>
        )}
      </View>

      {feedback ? (
        <Text style={styles.feedbackText}>{feedback}</Text>
      ) : null}

      {/* Controls */}
      <View style={styles.controls}>
        <StyleSelector
          selected={stampStyle}
          onSelect={handleStyleChange}
          themeColor={season.themeColor}
        />

        <CustomizationPanel
          options={customOptions}
          onChange={handleCustomChange}
          seasonColor={season.themeColor}
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
    backgroundColor: '#1a1a1a',
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
  feedbackText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xs,
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
