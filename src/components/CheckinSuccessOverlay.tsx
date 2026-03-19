// Layered feedback overlay shown after stamp save:
// T+0ms     Toast "留めました。"
// T+1200ms  Herbarium unlock animation (petal burst → card)
// T+3500ms  Milestone prompt (if applicable)
// T+4500ms  Auto-dismiss → footprint tab

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Animated, TouchableOpacity, StyleSheet,
  AccessibilityInfo, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { FlowerSpot } from '@/types/hanami';

const { width: SW, height: SH } = Dimensions.get('window');
const PETAL_COUNT = 8;

interface Props {
  spot: FlowerSpot;
  seasonLabel: string;      // e.g. "2026 春"
  isRevisit: boolean;       // same spot previously checked in
  checkinCount: number;     // total spots visited after this check-in
  onDismiss: () => void;
}

const MILESTONES = [5, 10, 25, 50, 100];

export default function CheckinSuccessOverlay({
  spot, seasonLabel, isRevisit, checkinCount, onDismiss,
}: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'toast' | 'unlock' | 'milestone' | 'done'>('toast');
  const [reduceMotion, setReduceMotion] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(300)).current;
  const milestoneOpacity = useRef(new Animated.Value(0)).current;
  const petals = useRef(
    Array.from({ length: PETAL_COUNT }, () => ({
      x: new Animated.Value(SW * 0.3 + Math.random() * SW * 0.4), // start from center area
      y: new Animated.Value(SH * 0.5),
      opacity: new Animated.Value(1),
    }))
  ).current;

  const milestone = MILESTONES.find(m => m === checkinCount);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    // Phase 1: Toast
    Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Phase 2: Unlock card (T+1200ms)
    const unlockTimer = setTimeout(() => {
      setPhase('unlock');
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();

      if (!reduceMotion && !isRevisit) {
        // Petal burst: scatter from center outward
        Animated.parallel([
          ...petals.map((p) =>
            Animated.parallel([
              Animated.timing(p.x, {
                toValue: Math.random() * SW,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(p.y, {
                toValue: -60 + Math.random() * SH * 0.3,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(p.opacity, {
                toValue: 0,
                duration: 600,
                delay: 400,
                useNativeDriver: true,
              }),
            ])
          ),
          Animated.spring(cardSlide, {
            toValue: 0,
            useNativeDriver: true,
            damping: 18,
            stiffness: 120,
          }),
        ]).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        // Revisit or reduce motion: gentle card slide only
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, 1200);

    // Phase 3: Milestone (T+3500ms) if applicable
    const milestoneTimer = milestone
      ? setTimeout(() => {
          setPhase('milestone');
          Animated.timing(milestoneOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 3500)
      : null;

    // Phase 4: Auto-dismiss (T+4500ms, or T+3500ms if no milestone)
    const dismissTimer = setTimeout(() => {
      setPhase('done');
    }, milestone ? 5500 : 4000);

    return () => {
      clearTimeout(unlockTimer);
      if (milestoneTimer) clearTimeout(milestoneTimer);
      clearTimeout(dismissTimer);
    };
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'done') onDismiss();
  }, [phase, onDismiss]);

  const unlockMessage = isRevisit
    ? t('stamp.revisitMessage')
    : t('stamp.unlockMessage', { spot: spot.nameJa, season: seasonLabel });

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      {/* Toast */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
        <Text style={styles.toastText}>{t('stamp.savedShort')}</Text>
      </Animated.View>

      {/* Petal burst (new spot only) */}
      {!reduceMotion && !isRevisit && petals.map((p, i) => (
        <Animated.Text
          key={i}
          style={[styles.petal, {
            transform: [{ translateX: p.x }, { translateY: p.y }],
            opacity: p.opacity,
          }]}
        >
          🌸
        </Animated.Text>
      ))}

      {/* Unlock / Revisit card */}
      {phase !== 'toast' && (
        <Animated.View style={[styles.card, { transform: [{ translateY: cardSlide }] }]}>
          <Text style={styles.cardIcon}>{isRevisit ? '🌿' : '🌸'}</Text>
          <Text style={styles.cardSpotName}>{spot.nameJa}</Text>
          <Text style={styles.cardMessage}>{unlockMessage}</Text>

          {/* Milestone badge */}
          {milestone && phase === 'milestone' && (
            <Animated.View style={[styles.milestoneBadge, { opacity: milestoneOpacity }]}>
              <Text style={styles.milestoneText}>
                {t('stamp.milestone', { count: milestone })}
              </Text>
            </Animated.View>
          )}

          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>{t('stamp.viewCollection')} →</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,244,241,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  // Toast
  toast: {
    position: 'absolute',
    top: SH * 0.35,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  toastText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.text,
    letterSpacing: 1,
  },
  // Petals
  petal: { position: 'absolute', fontSize: 20 },
  // Card
  card: {
    width: SW - spacing.xl * 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardIcon: { fontSize: 40, marginBottom: spacing.sm },
  cardSpotName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xl,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  cardMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.6,
    marginBottom: spacing.md,
  },
  // Milestone
  milestoneBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  milestoneText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.sm,
    color: '#d4a017',
  },
  // Dismiss
  dismissBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  dismissText: {
    fontSize: typography.fontSize.md,
    color: colors.plantPrimary,
    fontFamily: typography.fontFamily.display,
  },
});
