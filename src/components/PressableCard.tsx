// src/components/PressableCard.tsx
// Card wrapper with spring press animation + optional haptic feedback.
// Press down: scale(0.97), release: spring bounce back to 1.0.

import { useRef, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface PressableCardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Enable haptic feedback on press (default: true) */
  haptic?: boolean;
  /** Press scale factor (default: 0.97) */
  pressScale?: number;
  testID?: string;
}

export function PressableCard({
  children,
  onPress,
  style,
  haptic = true,
  pressScale = 0.97,
  testID,
}: PressableCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: pressScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={testID}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
