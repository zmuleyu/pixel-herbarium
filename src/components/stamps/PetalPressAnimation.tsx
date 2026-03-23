import React, { useEffect, useMemo } from 'react';
import { StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  type SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { getStampColors } from '@/utils/stamp-colors';
import { HapticPatterns } from '@/utils/haptics';

/** Approximate stamp bounding box — shared with GestureStampOverlay */
export const STAMP_APPROX_SIZE = 80;

interface PetalPressAnimationProps {
  /** Stamp center X relative to container */
  stampX: number;
  /** Stamp center Y relative to container */
  stampY: number;
  /** Seasonal theme color for halo + petals */
  themeColor: string;
  /** Called when all 4 stages complete */
  onComplete: () => void;
  /** StampRenderer output */
  children: React.ReactNode;
}

// -- Particle config --
const PARTICLE_COUNT = 4;
const PARTICLE_SIZE = 8;

// -- Timing (ms) --
const STAGE1_END = 300;
const STAGE2_START = STAGE1_END;
const STAGE2_HAPTIC = 350;
const TOTAL_DURATION = 1200;

function generateParticleConfigs(themeColor: string) {
  const { brandMid } = getStampColors(themeColor);
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.8;
    const distance = 30 + Math.random() * 50;
    return {
      targetX: Math.cos(angle) * distance,
      targetY: Math.sin(angle) * distance,
      color: i % 2 === 0 ? `${themeColor}99` : brandMid,
    };
  });
}

// Individual petal particle as animated view
function PetalParticle({
  targetX, targetY, color, progress, opacity,
}: {
  targetX: number;
  targetY: number;
  color: string;
  progress: SharedValue<number>;
  opacity: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, targetX]) },
      { translateY: interpolate(progress.value, [0, 1], [0, targetY]) },
      { scale: interpolate(progress.value, [0, 0.3, 1], [0.3, 1, 0.6]) },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color },
        style,
      ]}
    />
  );
}

export function PetalPressAnimation({
  stampX, stampY, themeColor, onComplete, children,
}: PetalPressAnimationProps) {
  // Stamp animation values
  const stampTranslateY = useSharedValue(-120);
  const stampOpacity = useSharedValue(0);
  const stampScale = useSharedValue(1);

  // Halo
  const haloScale = useSharedValue(0);
  const haloOpacity = useSharedValue(0);

  // Particles — shared across all petals
  const particleProgress = useSharedValue(0);
  const particleOpacity = useSharedValue(0);

  const particles = useMemo(() => generateParticleConfigs(themeColor), [themeColor]);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then(reduceMotion => {
      if (cancelled) return;
      if (reduceMotion) {
        onComplete();
        return;
      }

      // Stage 1: Float Down (0–0.3s)
      stampTranslateY.value = withSpring(0, { damping: 15, stiffness: 90 });
      stampOpacity.value = withTiming(1, { duration: 200 });

      // Stage 2→3: Press 0.88 → Bounce 1.02 → Settle 1.0
      stampScale.value = withDelay(STAGE2_START,
        withSequence(
          withTiming(0.88, { duration: 150, easing: Easing.out(Easing.quad) }),
          withSpring(1.02, { damping: 12, stiffness: 150 }),
          withSpring(1.0, { damping: 20, stiffness: 100 }),
        ),
      );

      // Halo: expand + fade during Stage 2
      haloScale.value = withDelay(STAGE2_HAPTIC,
        withTiming(1.5, { duration: 350, easing: Easing.out(Easing.quad) }),
      );
      haloOpacity.value = withDelay(STAGE2_HAPTIC,
        withSequence(
          withTiming(0.3, { duration: 100 }),
          withTiming(0, { duration: 250 }),
        ),
      );

      // Particles: burst outward + fade
      particleProgress.value = withDelay(STAGE2_HAPTIC,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
      );
      particleOpacity.value = withDelay(STAGE2_HAPTIC,
        withSequence(
          withTiming(1, { duration: 100 }),
          withDelay(200, withTiming(0, { duration: 200 })),
        ),
      );

      // Haptic at press moment
      setTimeout(() => {
        if (!cancelled) HapticPatterns.stampPress();
      }, STAGE2_HAPTIC);

      // Stage 4: Complete
      setTimeout(() => {
        if (!cancelled) runOnJS(onComplete)();
      }, TOTAL_DURATION);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Animated styles --
  const stampAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: stampTranslateY.value },
      { scale: stampScale.value },
    ],
    opacity: stampOpacity.value,
  }));

  const haloAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: haloScale.value }],
    opacity: haloOpacity.value,
  }));

  const halfSize = STAMP_APPROX_SIZE / 2;

  return (
    <>
      {/* Halo layer — behind stamp */}
      <Animated.View
        style={[
          styles.halo,
          {
            left: stampX - halfSize,
            top: stampY - halfSize,
            width: STAMP_APPROX_SIZE,
            height: STAMP_APPROX_SIZE,
            borderRadius: STAMP_APPROX_SIZE / 2,
            backgroundColor: themeColor,
          },
          haloAnimStyle,
        ]}
        pointerEvents="none"
      />

      {/* Stamp content */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: stampX - halfSize,
            top: stampY - halfSize,
          },
          stampAnimStyle,
        ]}
        pointerEvents="none"
      >
        {children}
      </Animated.View>

      {/* Petal particles — on top of stamp */}
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particleContainer,
            { left: stampX, top: stampY },
          ]}
          pointerEvents="none"
        >
          <PetalParticle
            targetX={p.targetX}
            targetY={p.targetY}
            color={p.color}
            progress={particleProgress}
            opacity={particleOpacity}
          />
        </Animated.View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
  },
  particleContainer: {
    position: 'absolute',
  },
  particle: {
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    borderRadius: PARTICLE_SIZE / 2,
  },
});
