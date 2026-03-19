// StampPreview — Step 3 of the check-in wizard.
// Shows the user's photo with a stamp overlay; lets them pick style + position.
// Internally captures a full-resolution composite for export.

import { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius, stamp as stampTheme, getSeasonTheme } from '@/constants/theme';
import { getActiveSeason } from '@/constants/seasons';
import { PixelStamp } from './PixelStamp';
import { SealStamp } from './SealStamp';
import { MinimalStamp } from './MinimalStamp';
import type { StampStyle, StampPosition, FlowerSpot } from '@/types/hanami';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StampPreviewProps {
  photoUri: string;
  spot: FlowerSpot;
  date: Date;
  seasonId: string;
  onSave: (composedUri: string, stampStyle: StampStyle, stampPosition: StampPosition) => Promise<void>;
  onShare: (composedUri: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_SIZE = SCREEN_WIDTH - spacing.xl * 2;

const STYLE_OPTIONS: StampStyle[] = ['pixel', 'seal', 'minimal'];
const POSITION_OPTIONS: StampPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

// Capture dimensions (full res, off-screen)
const CAPTURE_WIDTH = 1080;
const CAPTURE_HEIGHT = 1080;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function positionStyle(position: StampPosition): object {
  const pad = stampTheme.padding;
  switch (position) {
    case 'top-left':    return { top: pad, left: pad };
    case 'top-right':   return { top: pad, right: pad };
    case 'bottom-left': return { bottom: pad, left: pad };
    case 'bottom-right': return { bottom: pad, right: pad };
  }
}

function positionStyleCapture(position: StampPosition): object {
  const pad = stampTheme.padding * 2; // scale up for capture size
  switch (position) {
    case 'top-left':    return { top: pad, left: pad };
    case 'top-right':   return { top: pad, right: pad };
    case 'bottom-left': return { bottom: pad, left: pad };
    case 'bottom-right': return { bottom: pad, right: pad };
  }
}

// ---------------------------------------------------------------------------
// StampPreview
// ---------------------------------------------------------------------------

export function StampPreview({ photoUri, spot, date, seasonId, onSave, onShare }: StampPreviewProps) {
  const { t } = useTranslation();
  const season = getActiveSeason();
  const theme = getSeasonTheme(seasonId);

  const [stampStyle, setStampStyle] = useState<StampStyle>(stampTheme.defaultStyle);
  const [stampPosition, setStampPosition] = useState<StampPosition>(stampTheme.defaultPosition);
  const [busy, setBusy] = useState(false);

  // Off-screen full-res composite for capture
  const captureViewRef = useRef<View>(null);

  // Load persisted preferences
  useEffect(() => {
    AsyncStorage.getItem(stampTheme.storageKey)
      .then((v) => { if (v) setStampStyle(v as StampStyle); })
      .catch(() => {});
    AsyncStorage.getItem(stampTheme.positionStorageKey)
      .then((v) => { if (v) setStampPosition(v as StampPosition); })
      .catch(() => {});
  }, []);

  function handleStyleSelect(style: StampStyle) {
    setStampStyle(style);
    AsyncStorage.setItem(stampTheme.storageKey, style).catch(() => {});
  }

  function handlePositionSelect(position: StampPosition) {
    setStampPosition(position);
    AsyncStorage.setItem(stampTheme.positionStorageKey, position).catch(() => {});
  }

  async function capture(): Promise<string> {
    if (!captureViewRef.current) throw new Error('capture view not ready');
    return captureRef(captureViewRef, { format: 'png', quality: 1 });
  }

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await capture();
      await onSave(uri, stampStyle, stampPosition);
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await capture();
      await onShare(uri);
    } finally {
      setBusy(false);
    }
  }

  // Stamp props derived from spot + season
  const themeColor = theme.primary;
  const seasonEmoji = season.iconEmoji;
  const seasonLabel = t(`season.${seasonId}.name`);

  function renderStamp(scale: number = 1) {
    switch (stampStyle) {
      case 'pixel':
        return (
          <PixelStamp
            spotName={spot.nameJa}
            cityEn={spot.city}
            date={date}
            themeColor={themeColor}
          />
        );
      case 'seal':
        return (
          <SealStamp
            spotName={spot.nameJa}
            seasonEmoji={seasonEmoji}
            year={date.getFullYear()}
            seasonLabel={seasonLabel}
            themeColor={themeColor}
          />
        );
      case 'minimal':
        return (
          <MinimalStamp
            spotName={spot.nameJa}
            cityEn={spot.city}
            date={date}
            accentColor={themeColor}
          />
        );
    }
  }

  const positionLabelMap: Record<StampPosition, string> = {
    'top-left': '↖',
    'top-right': '↗',
    'bottom-left': '↙',
    'bottom-right': '↘',
  };

  return (
    <View style={styles.container}>
      {/* Photo with stamp overlay — preview */}
      <View style={[styles.photoWrapper, { width: PREVIEW_SIZE, height: PREVIEW_SIZE }]}>
        <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        <View style={[styles.stampOverlay, positionStyle(stampPosition) as object]}>
          {renderStamp()}
        </View>
      </View>

      {/* Style picker */}
      <View style={styles.pickerRow}>
        {STYLE_OPTIONS.map((style) => (
          <TouchableOpacity
            key={style}
            style={[
              styles.pickerBtn,
              stampStyle === style && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => handleStyleSelect(style)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.pickerBtnText,
                stampStyle === style && { color: colors.white },
              ]}
            >
              {t(`stamp.${style}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Position picker */}
      <View style={styles.pickerRow}>
        {POSITION_OPTIONS.map((pos) => (
          <TouchableOpacity
            key={pos}
            style={[
              styles.posBtn,
              stampPosition === pos && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => handlePositionSelect(pos)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.posBtnText,
                stampPosition === pos && { color: colors.white },
              ]}
            >
              {positionLabelMap[pos]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={busy}
          activeOpacity={0.8}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.actionBtnText}>{t('checkin.saveCard')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: theme.primary }]}
          onPress={handleShare}
          disabled={busy}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionBtnText, { color: theme.primary }]}>
            {t('stamp.share')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Off-screen full-resolution composite for capture */}
      <View style={styles.offscreen} pointerEvents="none">
        <View
          ref={captureViewRef}
          collapsable={false}
          style={{ width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT }}
        >
          <Image
            source={{ uri: photoUri }}
            style={{ width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT }}
            resizeMode="cover"
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              positionStyleCapture(stampPosition) as object,
              { justifyContent: undefined, alignItems: undefined },
            ]}
          >
            {renderStamp(3)}
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  photoWrapper: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  stampOverlay: {
    position: 'absolute',
  },

  pickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  pickerBtn: {
    flex: 1,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pickerBtnText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },

  posBtn: {
    flex: 1,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.textSecondary,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },

  posBtnText: {
    fontSize: 18,
    color: colors.text,
  },

  actionRow: {
    width: '100%',
    gap: spacing.sm,
  },

  actionBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },

  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },

  actionBtnText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.white,
  },

  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
});
