// src/components/guide/CoachMark.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated, StyleSheet,
  Dimensions, AccessibilityInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius, shadows } from '@/constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const SPOTLIGHT_PAD = 8;

export interface CoachStep {
  targetKey?: string;
  targetRect?: { x: number; y: number; width: number; height: number };
  body: string;        // i18n key
  icon?: string;
  position?: 'above' | 'below' | 'auto';
  spotlightPadding?: number;
  spotlightShape?: 'rect' | 'circle';
}

interface CoachMarkProps {
  steps: CoachStep[];
  currentStep: number;
  /** Resolved rect for the current step's target element */
  targetRect: { x: number; y: number; width: number; height: number } | null;
  onNext: () => void;
  onDismiss: () => void;
  visible: boolean;
  overlayVariant?: 'light' | 'dark';
}

export function CoachMark({
  steps, currentStep, targetRect, onNext, onDismiss, visible, overlayVariant = 'light',
}: CoachMarkProps) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (!visible) return;
    fadeAnim.setValue(0);
    scaleAnim.setValue(reduceMotion ? 1 : 0.92);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [visible, currentStep, reduceMotion]);

  if (!visible) return null;

  const step = steps[currentStep];
  if (!step) return null;
  const isLast = currentStep === steps.length - 1;

  const pad = step.spotlightPadding ?? SPOTLIGHT_PAD;
  const overlayColor = overlayVariant === 'dark'
    ? 'rgba(80, 74, 70, 0.65)'
    : 'rgba(159, 146, 140, 0.55)';

  // Compute spotlight rect
  const sl = targetRect
    ? { x: targetRect.x - pad, y: targetRect.y - pad, w: targetRect.width + pad * 2, h: targetRect.height + pad * 2 }
    : { x: SW * 0.1, y: SH * 0.35, w: SW * 0.8, h: SW * 0.8 };

  // Four rects that form frame around spotlight
  const top =    { left: 0, top: 0, right: 0, height: sl.y };
  const bottom = { left: 0, top: sl.y + sl.h, right: 0, bottom: 0 };
  const left =   { left: 0, top: sl.y, width: sl.x, height: sl.h };
  const right =  { left: sl.x + sl.w, top: sl.y, right: 0, height: sl.h };

  // Tooltip position
  const tooltipBelow = sl.y + sl.h + 60 < SH * 0.75;
  const tooltipTop = tooltipBelow ? sl.y + sl.h + 16 : sl.y - 16 - 120;

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) onDismiss();
    else onNext();
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.root, { opacity: fadeAnim }]}>
      {/* Four-rect frame overlay */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }, top as any]} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }, bottom as any]} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }, left as any]} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }, right as any]} />

      {/* Tap outside to dismiss */}
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onDismiss} activeOpacity={1} />

      {/* Tooltip card */}
      <Animated.View
        style={[styles.tooltip, { top: tooltipTop, transform: [{ scale: scaleAnim }] }]}
        accessibilityRole="alert"
        accessibilityLabel={t(step.body)}
      >
        {step.icon && <Text style={styles.icon}>{step.icon}</Text>}
        <Text style={styles.body}>{t(step.body)}</Text>

        {/* Step dots */}
        <View style={styles.dots} accessibilityLabel={`ステップ ${currentStep + 1}/${steps.length}`}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentStep && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={handleNext}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isLast ? t('guide.gotIt') : t('guide.next')}
        >
          <Text style={styles.btnText}>{isLast ? t('guide.gotIt') : t('guide.next')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 9999 },
  tooltip: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.cardSubtle,
  },
  icon: { fontSize: 24, textAlign: 'center' },
  body: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: typography.fontSize.md * 1.7,
    textAlign: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.plantPrimary },
  btn: {
    backgroundColor: colors.plantPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.white,
    fontWeight: '600',
  },
});
