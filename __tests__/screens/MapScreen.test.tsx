/**
 * MapScreen tests.
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

// Mock all dependencies BEFORE imports
jest.mock('@/stores/sakura-store', () => ({
  useSakuraStore: Object.assign(
    jest.fn(() => ({
      spots: [
        {
          id: 1, nameJa: '上野恩賜公園', nameEn: 'Ueno Park',
          prefecture: '東京都', prefectureCode: 13, city: '台東区', category: 'park',
          bloomTypical: { earlyStart: '03-20', peakStart: '03-28', peakEnd: '04-05', lateEnd: '04-12' },
          latitude: 35.7141, longitude: 139.7734,
          tags: ['名所100選'],
        },
      ],
      checkins: [],
      loading: false,
      initSpots: jest.fn(),
      loadCheckins: jest.fn(),
      performCheckin: jest.fn(() => Promise.resolve({ isNew: false, isMankai: false })),
      hasCheckedIn: jest.fn(() => false),
      getProgress: jest.fn(() => ({ checked: 0, total: 1 })),
      flushOfflineQueue: jest.fn(),
    })),
    { getState: jest.fn(() => ({ checkins: [] })) }
  ),
}));
jest.mock('@/components/PrePermissionScreen', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/SpotCheckinAnimation', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/hooks/useReviewPrompt', () => ({
  maybeRequestReview: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));
jest.mock('@/utils/geo', () => ({
  isWithinRadius: jest.fn(() => false),
  fuzzCoordinate: jest.fn((c) => c),
}));
jest.mock('@/utils/bloom', () => ({
  getBloomStatus: jest.fn(() => 'peak'),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('@/hooks/useNearbyDiscoveries', () => ({
  useNearbyDiscoveries: () => ({
    discoveries: [],
    userLocation: { latitude: 35.6762, longitude: 139.6503 },
    loading: false,
    refresh: jest.fn(),
  }),
}));
jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: 'MapView',
  Marker: 'Marker',
  Callout: 'Callout',
  Heatmap: 'Heatmap',
  PROVIDER_DEFAULT: null,
}));
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => children,
}));
jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1', plantPrimary: '#9fb69f', text: '#3a3a3a',
    textSecondary: '#7a7a7a', border: '#e8e6e1', white: '#ffffff',
    rarity: { common: '#9fb69f', uncommon: '#d4e4f7', rare: '#f5d5d0' },
    seasonal: { sakura: '#f5d5d0' },
    plantSecondary: '#c1e8d8',
    blushPink: '#f5d5d0',
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
    lineHeight: 1.7,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));

import React from 'react';
import MapScreen from '@/app/(tabs)/map';

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
  const element = React.createElement(MapScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MapScreen', () => {
  it('renders map container without crashing', () => {
    expect(() => renderToString()).not.toThrow();
  });

  it('renders map component', () => {
    const output = renderToString();
    expect(output).toContain('MapView');
  });
});

describe('MapScreen — layer toggle', () => {
  it('renders layer toggle buttons', () => {
    const html = renderToString();
    expect(html).toContain('sakura.layerToggle');
  });
});
