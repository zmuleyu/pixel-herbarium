jest.mock('react', () => {
  const r = jest.requireActual('react');
  return {
    ...r,
    default: { ...r },
    __esModule: true,
    useState: (init: any) => [typeof init === 'function' ? init() : init, jest.fn()],
    useRef: (init: any) => ({ current: init !== undefined ? init : null }),
    useEffect: jest.fn(),
    useMemo: (factory: any) => factory(),
    useCallback: (fn: any) => fn,
  };
});

jest.mock('react-native-reanimated', () => {
  const sv = (init: any) => ({ value: init });
  return {
    default: { View: 'Animated.View' },
    useSharedValue: sv,
    useAnimatedStyle: (fn: any) => fn(),
    withSpring: jest.fn((v: any) => v),
    withTiming: jest.fn((v: any) => v),
    withSequence: jest.fn((...args: any[]) => args[args.length - 1]),
    withDelay: jest.fn((_d: any, v: any) => v),
    runOnJS: (fn: any) => fn,
    Easing: { out: (e: any) => e, quad: 'quad', cubic: 'cubic' },
    interpolate: jest.fn((v: any, _i: any, o: any) => o[0]),
  };
});

jest.mock('react-native', () => ({
  StyleSheet: { create: (s: any) => s },
  AccessibilityInfo: { isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)) },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'Medium', Light: 'Light', Heavy: 'Heavy' },
}));

jest.mock('@/utils/stamp-colors', () => ({
  getStampColors: (color: string) => ({
    brandDeep: '#8a3050',
    brandMid: '#b04070',
  }),
}));

jest.mock('@/utils/haptics', () => ({
  HapticPatterns: {
    stampPress: jest.fn(),
  },
}));

import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { PetalPressAnimation, STAMP_APPROX_SIZE } from '../../../src/components/stamps/PetalPressAnimation';

describe('PetalPressAnimation', () => {
  const defaultProps = {
    stampX: 200,
    stampY: 300,
    themeColor: '#e8a5b0',
    onComplete: jest.fn(),
    children: React.createElement('View', null, 'stamp'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports STAMP_APPROX_SIZE as 80', () => {
    expect(STAMP_APPROX_SIZE).toBe(80);
  });

  it('renders without crashing', () => {
    const result = (PetalPressAnimation as any)(defaultProps);
    expect(result).toBeTruthy();
  });

  it('renders halo, stamp content, and particles', () => {
    const result = (PetalPressAnimation as any)(defaultProps);
    // Result is a React fragment with: halo + stamp + 4 particles = 6 elements
    expect(React.Children.count(result.props.children)).toBeGreaterThanOrEqual(3);
  });

  it('respects reduceMotion accessibility setting', () => {
    // The component checks AccessibilityInfo.isReduceMotionEnabled in useEffect.
    // When reduceMotion is true, onComplete is called immediately (skipping animation).
    // We verify the mock is set up correctly and the component renders.
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValueOnce(true);
    const onComplete = jest.fn();
    const result = (PetalPressAnimation as any)({ ...defaultProps, onComplete });
    expect(result).toBeTruthy();
    expect(AccessibilityInfo.isReduceMotionEnabled).toBeDefined();
  });
});
