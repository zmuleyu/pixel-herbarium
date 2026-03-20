import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { StampRenderer } from './StampRenderer';
import type { StampStyleId, CustomOptions, StampTransform } from '@/types/hanami';
import type { FlowerSpot } from '@/types/hanami';
import type { SeasonConfig } from '@/constants/seasons';

interface Props {
  styleId: StampStyleId | string;
  spot: FlowerSpot;
  date: Date;
  season: SeasonConfig;
  customOptions?: CustomOptions;
  opacity?: number;
  /** Container dimensions for boundary clamping */
  containerWidth: number;
  containerHeight: number;
  /** When true, render using staticTransform (for captureRef settle-before-capture) */
  isCapturing?: boolean;
  staticTransform?: StampTransform;
  /** Called on gesture end with current transform */
  onTransformChange?: (t: StampTransform) => void;
}

export function GestureStampOverlay({
  styleId, spot, date, season, customOptions, opacity = 1,
  containerWidth, containerHeight,
  isCapturing = false, staticTransform,
  onTransformChange,
}: Props) {
  const STAMP_SIZE = 80; // approximate stamp width/height for boundary calcs

  // Initial position: bottom-right area
  const initX = containerWidth * 0.55;
  const initY = containerHeight * 0.70;

  const translateX = useSharedValue(initX);
  const translateY = useSharedValue(initY);
  const scale = useSharedValue(1.0);
  const rotation = useSharedValue(0);

  // Pan gesture — drag freely within container bounds
  const panGesture = Gesture.Pan()
    .onChange((e) => {
      const newX = translateX.value + e.changeX;
      const newY = translateY.value + e.changeY;
      // Clamp to keep stamp inside container
      translateX.value = Math.max(0, Math.min(containerWidth - STAMP_SIZE, newX));
      translateY.value = Math.max(0, Math.min(containerHeight - STAMP_SIZE, newY));
    })
    .onEnd(() => {
      if (onTransformChange) {
        runOnJS(onTransformChange)({
          x: translateX.value,
          y: translateY.value,
          scale: scale.value,
          rotation: rotation.value,
        });
      }
    });

  // Pinch gesture — scale [0.3, 2.5]
  const pinchGesture = Gesture.Pinch()
    .onChange((e) => {
      const newScale = scale.value * e.scaleChange;
      scale.value = Math.max(0.3, Math.min(2.5, newScale));
    })
    .onEnd(() => {
      scale.value = withSpring(scale.value, { damping: 15 });
      if (onTransformChange) {
        runOnJS(onTransformChange)({
          x: translateX.value,
          y: translateY.value,
          scale: scale.value,
          rotation: rotation.value,
        });
      }
    });

  // Rotation gesture
  const rotationGesture = Gesture.Rotation()
    .onChange((e) => {
      rotation.value += e.rotationChange;
    })
    .onEnd(() => {
      if (onTransformChange) {
        runOnJS(onTransformChange)({
          x: translateX.value,
          y: translateY.value,
          scale: scale.value,
          rotation: rotation.value,
        });
      }
    });

  // All 3 gestures run simultaneously
  const composed = Gesture.Simultaneous(panGesture, pinchGesture, rotationGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
    opacity: opacity,
  }));

  // Static style for capture — uses React state values instead of SharedValues
  const staticStyle = staticTransform ? {
    transform: [
      { translateX: staticTransform.x },
      { translateY: staticTransform.y },
      { scale: staticTransform.scale },
      { rotate: `${staticTransform.rotation}rad` },
    ],
    opacity,
  } : undefined;

  const content = (
    <Animated.View
      style={[styles.stamp, isCapturing && staticStyle ? staticStyle : animatedStyle]}
    >
      <StampRenderer
        styleId={styleId}
        spot={spot}
        date={date}
        season={season}
        customOptions={customOptions}
      />
    </Animated.View>
  );

  if (isCapturing) {
    return content;
  }

  return (
    <GestureDetector gesture={composed}>
      {content}
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stamp: {
    position: 'absolute',
  },
});
