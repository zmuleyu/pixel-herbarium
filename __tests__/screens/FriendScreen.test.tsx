/**
 * FriendScreen tests.
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

// React Native global — normally defined by Metro bundler
(global as any).__DEV__ = false;

// Mutable mock for useHerbarium — toggled per-test
const mockUseHerbarium = jest.fn(() => ({
  plants: [],
  collected: new Set<number>(),
  collectionMap: new Map(),
  loading: true,
  refresh: jest.fn(),
}));

// Mock all dependencies BEFORE imports
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: any) => opts ? `${key}:${JSON.stringify(opts)}` : key }),
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'friend-1', name: encodeURIComponent('花子') }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('@/hooks/useHerbarium', () => ({
  useHerbarium: function (...args: any[]): any { return mockUseHerbarium(...(args as [])); },
}));
jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1',
    plantPrimary: '#9fb69f',
    text: '#3a3a3a',
    textSecondary: '#7a7a7a',
    border: '#e8e6e1',
    white: '#ffffff',
    rarity: { common: '#9fb69f', uncommon: '#d4e4f7', rare: '#f5d5d0' },
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
    lineHeight: 1.7,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));
jest.mock('@/constants/plants', () => ({
  GRID_COLUMNS: 6,
  TOTAL_PLANTS: 240,
}));

import React from 'react';
import FriendHerbariumScreen from '@/app/friend/[id]';

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
  const element = React.createElement(FriendHerbariumScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('FriendScreen', () => {
  beforeEach(() => {
    mockUseHerbarium.mockReturnValue({
      plants: [],
      collected: new Set<number>(),
      collectionMap: new Map(),
      loading: true,
      refresh: jest.fn(),
    });
  });

  it('renders container', () => {
    const output = renderToString();
    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
  });

  it('shows loading state initially', () => {
    const output = renderToString();
    // When loading, the component shows an ActivityIndicator centered view
    // It should NOT show the header/grid yet
    expect(output).not.toContain('common.back');
  });

  it('renders friend name when loaded', () => {
    mockUseHerbarium.mockReturnValue({
      plants: [
        { id: 1, name_ja: 'サクラ', name_en: 'Cherry', name_latin: 'Prunus', rarity: 1, pixel_sprite_url: null, hanakotoba: '', bloom_months: [3, 4] },
      ] as any,
      collected: new Set([1]),
      collectionMap: new Map(),
      loading: false,
      refresh: jest.fn(),
    });
    const output = renderToString();
    expect(output).toContain('花子');
  });

  it('renders herbarium grid when loaded', () => {
    mockUseHerbarium.mockReturnValue({
      plants: [
        { id: 1, name_ja: 'サクラ', name_en: 'Cherry', name_latin: 'Prunus', rarity: 1, pixel_sprite_url: null, hanakotoba: '', bloom_months: [3, 4] },
      ] as any,
      collected: new Set([1]),
      collectionMap: new Map(),
      loading: false,
      refresh: jest.fn(),
    });
    const output = renderToString();
    // Should show back button and progress text
    expect(output).toContain('common.back');
    expect(output).toContain('herbarium.progress');
  });
});
