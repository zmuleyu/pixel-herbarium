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
import type { FlowerSpot, StampStyleId, StampTransform, CustomOptions } from '@/types/hanami';
import { DEFAULT_CUSTOM_OPTIONS } from '@/types/hanami';
import { STAMP_STYLE_MIGRATION, DEFAULT_STAMP_STYLE_ID } from '@/constants/stamp-styles';

const { width: SCREEN_W } = Dimensions.get('window');

const CUSTOM_COLOR_KEY    = 'stamp_custom_color_preference';
const EFFECT_TYPE_KEY     = 'stamp_effect_type_preference';
const TEXT_MODE_KEY       = 'stamp_text_mode_preference';
const DECORATION_KEY      = 'stamp_decoration_key_preference';

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

  // Restore preferences
  useEffect(() => {
    (async () => {
      const [
        savedStyle,
        savedColor, savedEffect, savedTextMode, savedDecoration,
      ] = await Promise.all([
        AsyncStorage.getItem(stampConst.storageKey),
        AsyncStorage.getItem(CUSTOM_COLOR_KEY),
        AsyncStorage.getItem(EFFECT_TYPE_KEY),
        AsyncStorage.getItem(TEXT_MODE_KEY),
        AsyncStorage.getItem(DECORATION_KEY),
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
        AsyncStorage.setItem(CUSTOM_COLOR_KEY, next.customColor ?? 'undefined');
      }
      if ('effectType' in patch) {
        AsyncStorage.setItem(EFFECT_TYPE_KEY, next.effectType);
      }
      if ('textMode' in patch) {
        AsyncStorage.setItem(TEXT_MODE_KEY, next.textMode);
      }
      if ('decorationKey' in patch) {
        AsyncStorage.setItem(DECORATION_KEY, next.decorationKey);
      }
      return next;
    });
  }, []);

  const handleCTA = useCallback(async () => {
    if (busy || !viewShotRef.current) return;
    setBusy(true);
    try {
      // 1. Settle the transform — currentTransform already updated via onTransformChange
      setIsCapturing(true);
      // 2. Wait a frame for the static render to complete
      await new Promise<void>(r => requestAnimationFrame(() => r()));
      // 3. captureRef now captures the static style (not Reanimated UI-thread state)
      const composedUri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      setIsCapturing(false);
      onSave(composedUri, stampStyle as StampStyleId, currentTransform);
    } catch {
      setIsCapturing(false);
      // fallback handled by parent
    } finally {
      setBusy(false);
    }
  }, [busy, onSave, stampStyle, currentTransform]);

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
            resizeMode="contain"
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
      </View>

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
