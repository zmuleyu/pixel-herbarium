/**
 * OnboardingScreen tests.
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

// React Native global — normally defined by Metro bundler
(global as any).__DEV__ = false;

// Mutable mock for useOnboardingControls — toggled per-test
const mockOnboardingControls = jest.fn(() => ({
  page: 0,
  scrollRef: { current: null },
  slideAnims: [
    { interpolate: () => 0, __getValue: () => 1 },
    { interpolate: () => 0, __getValue: () => 0 },
    { interpolate: () => 0, __getValue: () => 0 },
  ],
  dotAnim: { interpolate: () => 10 },
  goNext: jest.fn(),
  goBack: jest.fn(),
  finish: jest.fn(),
  onSwipeEnd: jest.fn(),
}));

// Mock all dependencies BEFORE imports
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@/hooks/useOnboardingControls', () => ({
  useOnboardingControls: (...args: any[]) => mockOnboardingControls(...(args as [])),
  ONBOARDING_KEY: 'onboarding_done_v1',
}));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1', plantPrimary: '#9fb69f', text: '#3a3a3a',
    textSecondary: '#7a7a7a', border: '#e8e6e1', white: '#ffffff',
    rarity: { common: '#9fb69f', uncommon: '#d4e4f7', rare: '#f5d5d0' },
    seasonal: { sakura: '#f5d5d0' },
    plantSecondary: '#c1e8d8',
    creamYellow: '#fff8dc',
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
    lineHeight: 1.7,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
  shadows: {
    card: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
    cardSubtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardLifted: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 6 },
  },
}));

import React from 'react';
import OnboardingScreen from '@/app/onboarding';

// ── shallowRender helper ──────────────────────────────────────────────────────
function shallowRender(element: any, depth = 10): any {
  if (element == null || typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') return element;
  if (Array.isArray(element)) return element.map(e => shallowRender(e, depth));
  if (!element.type) return element;
  if (typeof element.type === 'function' && depth > 0) {
    const output = element.type({ ...element.props });
    return shallowRender(output, depth - 1);
  }
  const children = element.props?.children;
  return {
    type: typeof element.type === 'string' ? element.type : element.type?.name ?? 'Unknown',
    props: { ...element.props, children: undefined },
    children: children != null ? (Array.isArray(children) ? children.map((c: any) => shallowRender(c, depth)) : shallowRender(children, depth)) : undefined,
  };
}

function renderToString(): string {
  const element = React.createElement(OnboardingScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OnboardingScreen', () => {
  beforeEach(() => {
    mockOnboardingControls.mockReturnValue({
      page: 0,
      scrollRef: { current: null },
      slideAnims: [
        { interpolate: () => 0, __getValue: () => 1 },
        { interpolate: () => 0, __getValue: () => 0 },
        { interpolate: () => 0, __getValue: () => 0 },
      ],
      dotAnim: { interpolate: () => 10 },
      goNext: jest.fn(),
      goBack: jest.fn(),
      finish: jest.fn(),
      onSwipeEnd: jest.fn(),
    });
  });

  it('renders container', () => {
    const output = renderToString();
    expect(output).toContain('View');
  });

  it('shows skip button text', () => {
    const output = renderToString();
    expect(output).toContain('onboarding.skip');
  });

  it('renders slide content (first slide)', () => {
    const output = renderToString();
    expect(output).toContain('onboarding.slide1Title');
    expect(output).toContain('onboarding.slide1Body');
  });

  it('renders dot indicators', () => {
    const output = renderToString();
    // There are 3 slides so 3 dot indicators rendered via Animated.View
    expect(output).toContain('borderRadius');
  });

  it('shows Next button', () => {
    const output = renderToString();
    expect(output).toContain('onboarding.next');
  });

  it('shows Get Started button on last slide', () => {
    mockOnboardingControls.mockReturnValue({
      page: 2,
      scrollRef: { current: null },
      slideAnims: [
        { interpolate: () => 0, __getValue: () => 0 },
        { interpolate: () => 0, __getValue: () => 0 },
        { interpolate: () => 0, __getValue: () => 1 },
      ],
      dotAnim: { interpolate: () => 10 },
      goNext: jest.fn(),
      goBack: jest.fn(),
      finish: jest.fn(),
      onSwipeEnd: jest.fn(),
    });
    const output = renderToString();
    expect(output).toContain('onboarding.start');
  });

  it('renders gradient background', () => {
    const output = renderToString();
    expect(output).toContain('LinearGradient');
  });
});
