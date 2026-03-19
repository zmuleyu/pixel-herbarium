// src/components/SpotCheckinAnimation.tsx
// Full-screen overlay shown after a GPS check-in is confirmed.
// - Normal: petal emoji rain + stamp card slide-in
// - Mankai: same + gold border + haptic feedback
// - Reduce Motion: opacity fade only (no path animation, no spring)
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Animated, TouchableOpacity, StyleSheet,
  AccessibilityInfo, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { FlowerSpot } from '@/types/hanami';

const { width: SW, height: SH } = Dimensions.get('window');
const PETAL_COUNT = 7;

interface Props {
  spot:       FlowerSpot;
  isMankai:   boolean;
  is100sen:   boolean;
  onDismiss:  () => void;
}

export default function SpotCheckinAnimation({ spot, isMankai, is100sen, onDismiss }: Props) {
  const { t } = useTranslation();
  const [reduceMotion, setReduceMotion] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide      = useRef(new Animated.Value(300)).current;
  const petals         = useRef(
    Array.from({ length: PETAL_COUNT }, () => ({
      x: new Animated.Value(Math.random() * SW),
      y: new Animated.Value(-40),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      // Simple fade
      Animated.sequence([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      // Full animation
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ...petals.map((p) =>
          Animated.parallel([
            Animated.timing(p.y, { toValue: SH + 40, duration: 1500 + Math.random() * 500, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 0, duration: 1500, delay: 800, useNativeDriver: true }),
          ])
        ),
        Animated.spring(cardSlide, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }),
      ]).start();

      if (isMankai) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const borderColor = isMankai ? '#d4a017' : colors.plantPrimary;
  const message     = isMankai
    ? t('sakura.stampCard.mankai')
    : t('sakura.stampCard.saved');

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      {/* Petals */}
      {!reduceMotion && petals.map((p, i) => (
        <Animated.Text
          key={i}
          style={[styles.petal, { transform: [{ translateX: p.x }, { translateY: p.y }], opacity: p.opacity }]}
        >
          🌸
        </Animated.Text>
      ))}

      {/* Stamp Card */}
      <Animated.View style={[styles.card, { borderColor, transform: [{ translateY: cardSlide }] }]}>
        {isMankai && (
          <LinearGradient
            colors={['rgba(212,160,23,0.15)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        {is100sen && <Text style={styles.badge}>さくら名所100選</Text>}
        <Text style={styles.spotIcon}>{is100sen ? '⭐' : '🌸'}</Text>
        <Text style={styles.spotName}>{spot.nameJa}</Text>
        <Text style={styles.prefecture}>{spot.prefecture}</Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>{t('sakura.collection.tabLabel')} →</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,244,241,0.95)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl * 2,
    zIndex: 999,
  },
  petal: { position: 'absolute', fontSize: 24 },
  card: {
    width: SW - spacing.xl * 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  badge: {
    fontSize: typography.fontSize.xs,
    color: '#d4a017',
    marginBottom: spacing.sm,
    fontFamily: typography.fontFamily.display,
  },
  spotIcon: { fontSize: 48, marginBottom: spacing.sm },
  spotName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xl,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  prefecture: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight,
    marginBottom: spacing.lg,
  },
  dismissButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  dismissText: {
    fontSize: typography.fontSize.md,
    color: colors.plantPrimary,
    fontFamily: typography.fontFamily.display,
  },
});
