/**
 * DiscoverScreen tests.
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

// React Native global — normally defined by Metro bundler
(global as any).__DEV__ = false;

// Mock all dependencies BEFORE imports
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mutable mock for useCapture — toggled per-test (typed loosely to allow status changes)
const mockUseCapture = jest.fn<{
  status: string;
  cameraGranted: boolean;
  locationGranted: boolean;
  location: { latitude: number; longitude: number } | null;
  errorMessage: string | null;
  requestPermissions: jest.Mock;
  acquireLocation: jest.Mock;
  reset: jest.Mock;
}, []>(() => ({
  status: 'ready',
  cameraGranted: true,
  locationGranted: true,
  location: { latitude: 35.6762, longitude: 139.6503 },
  errorMessage: null,
  requestPermissions: jest.fn(),
  acquireLocation: jest.fn(),
  reset: jest.fn(),
}));
jest.mock('@/hooks/useCapture', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useCapture: function (...args: any[]): any { return mockUseCapture(...(args as [])); },
}));

jest.mock('@/hooks/useDiscovery', () => ({
  useDiscovery: () => ({
    status: 'idle',
    discoveredPlant: null,
    daysRemaining: undefined,
    runDiscovery: jest.fn(),
    reset: jest.fn(),
  }),
}));
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'test-user' } }),
}));
jest.mock('@/stores/herbarium-store', () => ({
  useHerbariumStore: () => jest.fn(),
}));
jest.mock('@/services/antiCheat', () => ({
  checkQuota: jest.fn(() => Promise.resolve({ allowed: true, remaining: 10 })),
}));
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => children,
}));
jest.mock('@/components/guide', () => ({
  GuideWrapper: ({ children }: { children: any }) => children,
  MeasuredView: ({ children, style }: { children: any; style?: any }) => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, { style }, children);
  },
}));
jest.mock('@/components/ShareSheet', () => ({
  ShareSheet: 'ShareSheet',
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn() }),
}));
jest.mock('@/utils/date', () => ({
  getCurrentSeason: () => 'spring',
}));
jest.mock('@/constants/plants', () => ({
  RARITY_LABELS: { 1: '★', 2: '★★', 3: '★★★ 限定' },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('1'), // onboarding done → guard passes → requestPermissions allowed
  setItemAsync: jest.fn().mockResolvedValue(undefined),
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
import DiscoverScreen from '@/app/(tabs)/discover';

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
  const element = React.createElement(DiscoverScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DiscoverScreen', () => {
  beforeEach(() => {
    mockUseCapture.mockReturnValue({
      status: 'ready',
      cameraGranted: true,
      locationGranted: true,
      location: { latitude: 35.6762, longitude: 139.6503 },
      errorMessage: null,
      requestPermissions: jest.fn(),
      acquireLocation: jest.fn(),
      reset: jest.fn(),
    });
  });

  it('renders camera view when permission granted', () => {
    const output = renderToString();
    expect(output).toContain('CameraView');
  });

  it('shows permission denied message when no permission', () => {
    mockUseCapture.mockReturnValue({
      status: 'idle',
      cameraGranted: false,
      locationGranted: false,
      location: null,
      errorMessage: null,
      requestPermissions: jest.fn(),
      acquireLocation: jest.fn(),
      reset: jest.fn(),
    });
    const output = renderToString();
    expect(output).toContain('discover.gpsRequired');
  });
});
