import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';

interface Props {
  isDownloading: boolean;
  isReady: boolean;
}

/**
 * Subtle bottom banner for OTA update progress.
 * Slides up from bottom when downloading, shows restart button when ready.
 */
export function OTAUpdateBanner({ isDownloading, isReady }: Props) {
  const visible = isDownloading || isReady;
  const translateY = useRef(new Animated.Value(80)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Slide banner in/out
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 80,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  // Animate progress bar: 0→85% during download, snap to 100% when ready
  useEffect(() => {
    if (isDownloading) {
      progressWidth.setValue(0);
      Animated.timing(progressWidth, {
        toValue: 0.85,
        duration: 18000, // smooth crawl toward 85%
        useNativeDriver: false,
      }).start();
    }
  }, [isDownloading, isReady]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.container, { transform: [{ translateY }] }]}
    >
      <View style={styles.row}>
        <Text style={styles.label}>🌿 新バージョンを取得中...</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: progressWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 998,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg, // clearance for iPhone home indicator
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.display,
  },
  track: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.plantPrimary,
    borderRadius: 2,
  },
});
