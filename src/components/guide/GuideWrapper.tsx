// src/components/guide/GuideWrapper.tsx
import React, { useState, useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import { GuideMeasureProvider, useGuideMeasure } from './GuideMeasureContext';
import { CoachMark, CoachStep } from './CoachMark';
import { useGuideState } from '../../hooks/useGuideState';
import { FEATURES } from '@/constants/features';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuideWrapperProps {
  featureKey: string;
  steps: CoachStep[];
  overlayVariant?: 'light' | 'dark';
  delay?: number;
  children: React.ReactNode;
}

interface MeasuredViewProps {
  measureKey: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

// ─── CoachMarkController (internal) ──────────────────────────────────────────

interface CoachMarkControllerProps {
  featureKey: string;
  steps: CoachStep[];
  overlayVariant: 'light' | 'dark';
  delay: number;
}

function CoachMarkController({
  featureKey,
  steps,
  overlayVariant,
  delay,
}: CoachMarkControllerProps) {
  if (FEATURES.SCREENSHOT_MODE) return null;
  const { seen, loading, markSeen } = useGuideState(featureKey);
  const { getRect } = useGuideMeasure();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (seen || loading) return;
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [seen, loading, delay]);

  if (!visible) return null;

  return (
    <CoachMark
      steps={steps}
      getRect={getRect}
      onDone={markSeen}
      overlayVariant={overlayVariant}
    />
  );
}

// ─── GuideWrapper (exported) ──────────────────────────────────────────────────

export default function GuideWrapper({
  featureKey,
  steps,
  overlayVariant = 'light',
  delay = 800,
  children,
}: GuideWrapperProps) {
  return (
    <GuideMeasureProvider>
      {children}
      <CoachMarkController
        featureKey={featureKey}
        steps={steps}
        overlayVariant={overlayVariant}
        delay={delay}
      />
    </GuideMeasureProvider>
  );
}

// ─── MeasuredView (exported) ──────────────────────────────────────────────────

export function MeasuredView({ measureKey, style, children }: MeasuredViewProps) {
  const { register } = useGuideMeasure();
  return (
    <View
      style={style}
      onLayout={(e) => register(measureKey, e)}
    >
      {children}
    </View>
  );
}
