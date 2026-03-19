// src/components/ShareSheet.tsx
// Bottom sheet modal for poster format preview + save/share actions.
// Renders two off-screen SharePosters (story + line) for capture,
// and two scaled-down thumbnails for the user to choose between.

import { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { SharePoster, type SharePosterPlant } from '@/components/SharePoster';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  plant: SharePosterPlant;
  discoveryDate?: string;
  discoveryCity?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const POSTER_WIDTH = 360;
const THUMB_WIDTH = (SCREEN_WIDTH - spacing.xl * 2 - spacing.md) / 2;
const STORY_HEIGHT = 640;
const LINE_SIZE = 360;

// ---------------------------------------------------------------------------
// ShareSheet
// ---------------------------------------------------------------------------

export function ShareSheet({ visible, onClose, plant, discoveryDate, discoveryCity }: ShareSheetProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<'story' | 'line'>('story');
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const storyRef = useRef<View>(null);
  const lineRef = useRef<View>(null);

  const slideAnim = useRef(new Animated.Value(300)).current;

  // Animate sheet in when visible changes
  function onShow() {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }

  function handleClose() {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelected('story');
      setFeedback(null);
      onClose();
    });
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setFeedback(t('share.permissionRequired'));
        return;
      }
      const ref = selected === 'story' ? storyRef : lineRef;
      const uri = await captureRef(ref, { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      setFeedback(t('share.saved'));
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      // Save failed — silent
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    try {
      const ref = selected === 'story' ? storyRef : lineRef;
      const uri = await captureRef(ref);
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: plant.name_ja });
    } catch {
      // Share cancelled or failed — silent
    } finally {
      setSharing(false);
    }
  }

  const storyThumbHeight = (THUMB_WIDTH / POSTER_WIDTH) * STORY_HEIGHT;
  const lineThumbSize = THUMB_WIDTH;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onShow={onShow}
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Drag handle */}
        <View style={styles.dragHandle} />

        {/* Thumbnail row */}
        <View style={styles.thumbRow}>
          {/* Story thumbnail */}
          <TouchableOpacity
            style={styles.thumbWrapper}
            onPress={() => setSelected('story')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.thumbContainer,
                { width: THUMB_WIDTH, height: storyThumbHeight },
                selected === 'story' ? styles.thumbSelected : styles.thumbUnselected,
              ]}
            >
              <View
                style={{
                  width: POSTER_WIDTH,
                  height: STORY_HEIGHT,
                  transform: [{ scale: THUMB_WIDTH / POSTER_WIDTH }],
                  overflow: 'hidden',
                }}
                collapsable={false}
              >
                <SharePoster
                  format="story"
                  plant={plant}
                  discoveryDate={discoveryDate}
                  discoveryCity={discoveryCity}
                />
              </View>
            </View>
            <Text style={[styles.thumbLabel, selected === 'story' && styles.thumbLabelSelected]}>
              {t('share.storyLabel')}
            </Text>
          </TouchableOpacity>

          {/* LINE thumbnail */}
          <TouchableOpacity
            style={styles.thumbWrapper}
            onPress={() => setSelected('line')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.thumbContainer,
                { width: THUMB_WIDTH, height: lineThumbSize },
                selected === 'line' ? styles.thumbSelected : styles.thumbUnselected,
              ]}
            >
              <View
                style={{
                  width: LINE_SIZE,
                  height: LINE_SIZE,
                  transform: [{ scale: THUMB_WIDTH / POSTER_WIDTH }],
                  overflow: 'hidden',
                }}
                collapsable={false}
              >
                <SharePoster
                  format="line"
                  plant={plant}
                  discoveryDate={discoveryDate}
                  discoveryCity={discoveryCity}
                />
              </View>
            </View>
            <Text style={[styles.thumbLabel, selected === 'line' && styles.thumbLabelSelected]}>
              {t('share.lineLabel')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Feedback message */}
        {feedback != null && (
          <Text style={styles.feedbackText}>{feedback}</Text>
        )}

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSave]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Text style={styles.buttonText}>{t('share.save')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonShare]}
            onPress={handleShare}
            disabled={sharing}
          >
            {sharing
              ? <ActivityIndicator size="small" color={colors.plantPrimary} />
              : <Text style={[styles.buttonText, styles.buttonShareText]}>{t('share.share')}</Text>}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Off-screen posters for capture (not visible to user) */}
      <View style={styles.posterOffscreen} pointerEvents="none">
        <View ref={storyRef} collapsable={false}>
          <SharePoster
            format="story"
            plant={plant}
            discoveryDate={discoveryDate}
            discoveryCity={discoveryCity}
          />
        </View>
      </View>
      <View style={[styles.posterOffscreen, { top: 800 }]} pointerEvents="none">
        <View ref={lineRef} collapsable={false}>
          <SharePoster
            format="line"
            plant={plant}
            discoveryDate={discoveryDate}
            discoveryCity={discoveryCity}
          />
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },

  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
  },

  thumbRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },

  thumbWrapper: {
    alignItems: 'center',
    gap: spacing.xs,
  },

  thumbContainer: {
    overflow: 'hidden',
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },

  thumbSelected: {
    borderColor: colors.plantPrimary,
  },

  thumbUnselected: {
    borderColor: colors.border,
  },

  thumbLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.display,
  },

  thumbLabelSelected: {
    color: colors.plantPrimary,
  },

  feedbackText: {
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: colors.plantPrimary,
    fontFamily: typography.fontFamily.display,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  button: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },

  buttonSave: {
    backgroundColor: colors.plantPrimary,
  },

  buttonShare: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },

  buttonText: {
    fontSize: typography.fontSize.md,
    color: colors.white,
    fontFamily: typography.fontFamily.display,
  },

  buttonShareText: {
    color: colors.text,
  },

  posterOffscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
  },
});
