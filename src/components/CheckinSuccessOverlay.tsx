// Layered feedback overlay shown after stamp save — Method C timing:
// T+0ms     Overlay + Toast "留めました。" fade in
// T+2200ms  Toast fades out; petal burst (new spot) + elastic card from bottom
// T+2800ms  Card fully visible
// T+4500ms  Milestone badge fades in (if applicable)
// T+6000ms  Dismiss button becomes visible
// T+15000ms Auto-close fallback

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Animated, TouchableOpacity, StyleSheet,
  AccessibilityInfo, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { FlowerSpot, StampPosition } from '@/types/hanami';
import { gridPositionToCoords } from '@/utils/stamp-position';

const { width: SW, height: SH } = Dimensions.get('window');
const PETAL_COUNT = 8;

interface Props {
  spot: FlowerSpot;
  seasonLabel: string;                          // e.g. "2026 春"
  isRevisit: boolean;
  checkinCount: number;
  stampPosition?: StampPosition;               // for anchoring petals
  containerSize?: { width: number; height: number }; // for petal origin calc
  previousVisitYears?: string[];               // shown as year pills in revisit mode
  onDismiss: () => void;
}

const MILESTONES = [5, 10, 25, 50, 100];

export default function CheckinSuccessOverlay({
  spot,
  seasonLabel,
  isRevisit,
  checkinCount,
  stampPosition = 'bottom-right',
  containerSize,
  previousVisitYears,
  onDismiss,
}: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'toast' | 'unlock' | 'milestone' | 'done'>('toast');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(300)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const milestoneOpacity = useRef(new Animated.Value(0)).current;

  const cw = containerSize?.width ?? SW;
  const ch = containerSize?.height ?? SH;
  const origin = gridPositionToCoords(stampPosition, cw, ch);

  const petals = useRef(
    Array.from({ length: PETAL_COUNT }, () => ({
      x: new Animated.Value(origin.x),
      y: new Animated.Value(origin.y),
      opacity: new Animated.Value(1),
    }))
  ).current;

  const milestone = MILESTONES.find(m => m === checkinCount);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    // T+0: Overlay + Toast fade in
    Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // T+2200: Toast out, petal burst (new spot, no reduce motion), elastic card entry
    const t1 = setTimeout(() => {
      setPhase('unlock');
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();

      if (!reduceMotion && !isRevisit) {
        // Petal burst anchored to stamp position, scattering downward-ish
        Animated.parallel([
          ...petals.map((p) =>
            Animated.parallel([
              Animated.timing(p.x, {
                toValue: Math.random() * cw,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(p.y, {
                toValue: origin.y + 60 + Math.random() * ch * 0.3,
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
          Animated.timing(cardOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        // Revisit or reduce motion: gentle fade only (no spring)
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        Animated.timing(cardSlide, { toValue: 0, duration: 1, useNativeDriver: true }).start();
      }
    }, 2200);

    // T+4500: Milestone badge
    const t2 = milestone
      ? setTimeout(() => {
          setPhase('milestone');
          Animated.timing(milestoneOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 4500)
      : null;

    // T+6000: Dismiss button visible
    const t3 = setTimeout(() => {
      setShowButton(true);
    }, 6000);

    // T+15000: Auto-close fallback
    const t4 = setTimeout(() => {
      setPhase('done');
    }, 15000);

    return () => {
      clearTimeout(t1);
      if (t2) clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'done') onDismiss();
  }, [phase, onDismiss]);

  const visibleYears = previousVisitYears?.slice(0, 5) ?? [];

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      {/* Toast */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
        <Text style={styles.toastText}>{t('stamp.savedShort')}</Text>
      </Animated.View>

      {/* Petal burst (new spot only, no reduce motion) */}
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
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateY: cardSlide }],
              opacity: cardOpacity,
            },
          ]}
        >
          <Text style={styles.cardIcon}>{isRevisit ? '🌿' : '🌸'}</Text>
          <Text style={styles.cardSpotName}>{spot.nameJa}</Text>

          {isRevisit ? (
            <>
              <Text style={styles.cardMessage}>{t('stamp.revisitMessage')}</Text>

              {/* Year pills */}
              {visibleYears.length > 0 && (
                <View style={styles.yearsRow}>
                  {visibleYears.map((year) => (
                    <View key={year} style={styles.yearPill}>
                      <Text style={styles.yearPillText}>{year}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <Text style={styles.cardMessage}>
              {t('stamp.unlockMessage', { spot: spot.nameJa, season: seasonLabel })}
            </Text>
          )}

          {/* Milestone badge */}
          {milestone && phase === 'milestone' && (
            <Animated.View style={[styles.milestoneBadge, { opacity: milestoneOpacity }]}>
              <Text style={styles.milestoneText}>
                {t('stamp.milestone', { count: milestone })}
              </Text>
            </Animated.View>
          )}

          {/* Dismiss button — shown after T+6000 */}
          {showButton && (
            <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
              <Text style={styles.dismissText}>{t('stamp.viewCollection')} →</Text>
            </TouchableOpacity>
          )}
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
    marginBottom: spacing.xs,
  },
  // Year pills (revisit mode)
  yearsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  yearPill: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  yearPillText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.display,
  },
  // Milestone
  milestoneBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  milestoneText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.sm,
    color: '#d4a017',
  },
  // Dismiss
  dismissBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  dismissText: {
    fontSize: typography.fontSize.md,
    color: colors.plantPrimary,
    fontFamily: typography.fontFamily.display,
  },
});
