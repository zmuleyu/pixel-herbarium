/**
 * HerbariumScreen tests.
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

// Mock all dependencies BEFORE imports
jest.mock('@/stores/spot-store', () => ({
  useSpotStore: jest.fn(() => ({
    spots: [], checkins: [], loading: false,
    initSpots: jest.fn(), loadCheckins: jest.fn(),
    hasCheckedIn: jest.fn(() => false), getProgress: jest.fn(() => ({ checked: 0, total: 0 })),
  })),
}));
jest.mock('@/components/SpotStampGrid', () => ({
  __esModule: true, default: () => null,
}));
jest.mock('@/components/SpotDetailSheet', () => ({
  __esModule: true, default: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'ja' } }),
}));

// Mutable mock for useHerbarium — toggled per-test
const mockUseHerbarium = jest.fn(() => ({ plants: [], collected: new Set(), loading: false }));
jest.mock('@/hooks/useHerbarium', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useHerbarium: function (...args: any[]): any { return mockUseHerbarium(...(args as [])); },
}));

jest.mock('@/hooks/useHerbariumFilter', () => ({
  useHerbariumFilter: () => ({ filter: 'all', setFilter: jest.fn(), filteredPlants: [] }),
  FILTER_OPTIONS: [{ value: 'all', labelKey: 'filter.all' }],
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'test-user' } }),
}));
jest.mock('@/utils/date', () => ({
  getCurrentSeason: () => 'spring',
}));
jest.mock('@/constants/plants', () => ({
  GRID_COLUMNS: 6,
  TOTAL_PLANTS: 120,
  RARITY_LABELS: { 1: '★', 2: '★★', 3: '★★★ 限定' },
}));
jest.mock('@/utils/plant-image', () => ({
  resolvePlantImage: jest.fn(() => null),
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
  fontWeight: { light: '300', regular: '400', semibold: '600', bold: '800', heavy: '900' },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
  shadows: {
    card: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
    cardSubtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardLifted: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 6 },
  },
}));

import React from 'react';
import HerbariumScreen from '@/app/(tabs)/herbarium';

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
  const element = React.createElement(HerbariumScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HerbariumScreen', () => {
  beforeEach(() => {
    mockUseHerbarium.mockReturnValue({ plants: [], collected: new Set(), loading: false });
  });

  it('shows loading indicator when loading is true', () => {
    mockUseHerbarium.mockReturnValue({ plants: [], collected: new Set(), loading: true });
    const output = renderToString();
    expect(output).toContain('ActivityIndicator');
  });

  it('renders header with title when loaded', () => {
    const output = renderToString();
    expect(output).toContain('herbarium.title');
  });

  it('renders FlatList for plant grid', () => {
    const output = renderToString();
    expect(output).toContain('FlatList');
  });
});

describe('HerbariumScreen — spot tab', () => {
  it('renders spot tab label', () => {
    const html = renderToString();
    expect(html).toContain('sakura.collection.tabLabel');
  });
});
