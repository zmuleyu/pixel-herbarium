// src/hooks/useStaggeredEntry.ts
// Staggered fade-in + slide-up animation for list items.
// Each item fades from 0→1 and translates Y from offset→0 with incremental delay.
// Respects AccessibilityInfo.isReduceMotionEnabled().

import { useEffect, useRef, useState } from 'react';
import { Animated, AccessibilityInfo } from 'react-native';

interface StaggeredEntryOptions {
  /** Number of items to animate */
  count: number;
  /** Delay between each item in ms (default: 80) */
  staggerMs?: number;
  /** Y offset to slide up from in px (default: 20) */
  slideOffset?: number;
  /** Total fade duration per item in ms (default: 350) */
  duration?: number;
}

interface StaggeredEntryResult {
  /** Get animated style for the item at given index */
  getStyle: (index: number) => {
    opacity: Animated.Value;
    transform: { translateY: Animated.AnimatedInterpolation<number> }[];
  };
  /** Whether animation is complete */
  ready: boolean;
}

export function useStaggeredEntry({
  count,
  staggerMs = 80,
  slideOffset = 20,
  duration = 350,
}: StaggeredEntryOptions): StaggeredEntryResult {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const anims = useRef<Animated.Value[]>([]);

  // Ensure we always have enough Animated.Values
  if (anims.current.length < count) {
    for (let i = anims.current.length; i < count; i++) {
      anims.current.push(new Animated.Value(0));
    }
  }

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (count === 0) {
      setReady(true);
      return;
    }

    if (reduceMotion) {
      // Skip animation — immediately show all items
      anims.current.forEach((a) => a.setValue(1));
      setReady(true);
      return;
    }

    const animations = anims.current.slice(0, count).map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration,
        delay: i * staggerMs,
        useNativeDriver: true,
      }),
    );

    Animated.parallel(animations).start(() => setReady(true));
  }, [count, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  function getStyle(index: number) {
    const anim = anims.current[index] ?? new Animated.Value(1);
    return {
      opacity: anim,
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [slideOffset, 0],
          }),
        },
      ],
    };
  }

  return { getStyle, ready };
}
