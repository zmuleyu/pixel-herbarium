jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useEffect: (fn: () => void) => fn(),
    useRef: (value: unknown) => ({ current: value }),
  };
});

jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: () => ({ onChange: () => ({ onEnd: () => ({}) }) }),
    Pinch: () => ({ onChange: () => ({ onEnd: () => ({}) }) }),
    Rotation: () => ({ onChange: () => ({ onEnd: () => ({}) }) }),
    Simultaneous: () => ({}),
  },
  GestureDetector: ({ children }: { children: any }) => children,
}));

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'AnimatedView' },
  useSharedValue: (initial: number) => ({ value: initial }),
  useAnimatedStyle: (factory: () => any) => factory(),
  withSpring: (value: number) => value,
  runOnJS: (fn: (...args: any[]) => void) => fn,
}));

jest.mock('@/components/stamps/StampRenderer', () => ({
  StampRenderer: () => null,
}));

import React from 'react';
import { GestureStampOverlay } from '@/components/stamps/GestureStampOverlay';

const spot = {
  id: 1,
  regionId: 'jp',
  seasonId: 'sakura',
  nameJa: 'Spot',
  nameEn: 'Spot',
  prefecture: 'Tokyo',
  prefectureCode: 13,
  city: 'Tokyo',
  category: 'park' as any,
  bloomTypical: {
    earlyStart: '03-20',
    peakStart: '03-28',
    peakEnd: '04-05',
    lateEnd: '04-15',
  },
  latitude: 35,
  longitude: 139,
  tags: [],
};

const season = {
  id: 'sakura',
  nameKey: 'season.sakura',
  themeColor: '#f5d5d0',
  accentColor: '#e8a5b0',
  bgTint: '#fff5f5',
  iconEmoji: 'flower',
  dateRange: ['03-01', '04-30'] as [string, string],
  spotsDataKey: 'sakura',
};

describe('GestureStampOverlay', () => {
  it('initializes the default transform after layout dimensions are available', () => {
    const onTransformChange = jest.fn();

    GestureStampOverlay({
      styleId: 'classic',
      spot,
      date: new Date('2026-03-28'),
      season,
      containerWidth: 300,
      containerHeight: 200,
      onTransformChange,
    });

    expect(onTransformChange).toHaveBeenCalledWith({
      x: 204,
      y: 104,
      scale: 1,
      rotation: 0,
    });
  });
});
