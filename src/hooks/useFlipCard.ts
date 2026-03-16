import { useRef, useState, useEffect } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

const HINT_KEY = 'hanakotoba_hint_seen_v1';

export function useFlipCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const hintOpacity = useRef(new Animated.Value(0.4)).current;

  // Check if hint has been seen
  useEffect(() => {
    SecureStore.getItemAsync(HINT_KEY).then((val) => {
      if (!val) {
        setShowHint(true);
        // Start breathing pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(hintOpacity, { toValue: 1, duration: 1500, useNativeDriver: true }),
            Animated.timing(hintOpacity, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
          ]),
        ).start();
      }
    });
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
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, {
      toValue,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
    if (showHint) {
      setShowHint(false);
      SecureStore.setItemAsync(HINT_KEY, '1');
    }
  }

  return {
    isFlipped,
    frontRotation,
    backRotation,
    frontOpacity,
    backOpacity,
    handleFlip,
    showHint,
    hintOpacity,
  };
}
