import { useRef, useState, useEffect } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

const HINT_KEY = 'hanakotoba_hint_seen_v1';

/**
 * Manages a 3-state cycling card flip animation.
 * phase: 0 = Japanese hanakotoba, 1 = Western meaning, 2 = Colour meaning.
 * Each tap advances phase (0→1→2→0) using a forward-only flip animation.
 */
export function useFlipCard() {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [showHint, setShowHint] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const hintOpacity = useRef(new Animated.Value(0.4)).current;

  // Check if hint has been seen
  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync(HINT_KEY).then((val) => {
      if (!mounted) return;
      if (!val) {
        setShowHint(true);
        Animated.loop(
          Animated.sequence([
            Animated.timing(hintOpacity, { toValue: 1, duration: 1500, useNativeDriver: true }),
            Animated.timing(hintOpacity, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
          ]),
        ).start();
      }
    });
    return () => { mounted = false; };
  }, []);

  const frontRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotation = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  function handleFlip() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Always animate forward (0 → 1). On completion, advance phase and reset
    // the animation value silently so the next tap works identically.
    Animated.spring(flipAnim, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start(() => {
      setPhase((p) => ((p + 1) % 3) as 0 | 1 | 2);
      flipAnim.setValue(0);
    });
    if (showHint) {
      setShowHint(false);
      SecureStore.setItemAsync(HINT_KEY, '1');
    }
  }

  return {
    phase,
    frontRotation,
    backRotation,
    frontOpacity,
    backOpacity,
    handleFlip,
    showHint,
    hintOpacity,
  };
}
