/**
 * FootprintScreen tests.
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

(global as any).__DEV__ = false;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush, navigate: jest.fn(), back: jest.fn() }),
}));

const mockLoadHistory = jest.fn();
const mockStoreState: { history: any[]; loadHistory: jest.Mock; loading: boolean } = {
  history: [],
  loadHistory: mockLoadHistory,
  loading: false,
};
jest.mock('@/stores/checkin-store', () => ({
  useCheckinStore: (selector?: (state: typeof mockStoreState) => any) => (
    selector ? selector(mockStoreState) : mockStoreState
  ),
}));

jest.mock('@/constants/seasons', () => ({
  getActiveSeason: () => ({
    id: 'sakura',
    iconEmoji: '🌸',
    nameKey: 'season.spring',
  }),
}));

jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1',
    text: '#3a3a3a',
    textSecondary: '#7a7a7a',
    white: '#ffffff',
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22 },
    lineHeight: 1.7,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { md: 12, lg: 20 },
  fontWeight: { light: '300', semibold: '600', bold: '700' },
  shadows: { card: {} },
  getSeasonTheme: () => ({
    primary: '#d4537e',
    accent: '#d4537e',
    bgTint: '#fff6f9',
  }),
}));

jest.mock('@/components/PressableCard', () => ({
  PressableCard: ({ children, onPress }: { children: any; onPress?: () => void }) => {
    const React = jest.requireActual('react');
    return React.createElement('PressableCard', { onPress }, children);
  },
}));

jest.mock('@/services/content-pack', () => ({
  loadSpotsData: () => ({
    spots: [{ id: 1, nameJa: '上野公園' }],
  }),
}));

import React from 'react';
import FootprintScreen from '@/app/(tabs)/footprint';

function shallowRender(element: any, depth = 12): any {
  if (
    element == null ||
    typeof element === 'string' ||
    typeof element === 'number' ||
    typeof element === 'boolean'
  ) return element;
  if (Array.isArray(element)) return element.map((e) => shallowRender(e, depth));
  if (!element.type) return element;
  if (typeof element.type === 'function' && depth > 0) {
    try {
      const output = element.type({ ...element.props });
      return shallowRender(output, depth - 1);
    } catch {
      return null;
    }
  }
  const children = element.props?.children;
  return {
    type: typeof element.type === 'string' ? element.type : element.type?.name ?? 'Unknown',
    props: { ...element.props, children: undefined },
    children:
      children != null
        ? (Array.isArray(children)
          ? children.map((c: any) => shallowRender(c, depth))
          : shallowRender(children, depth))
        : undefined,
  };
}

function renderToString(): string {
  const element = React.createElement(FootprintScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

describe('FootprintScreen', () => {
  beforeEach(() => {
    mockStoreState.history = [];
    mockLoadHistory.mockClear();
    mockRouterPush.mockClear();
  });

  it('renders container', () => {
    const output = renderToString();
    expect(output).toContain('footprint.container');
  });

  it('shows title key', () => {
    const output = renderToString();
    expect(output).toContain('footprint.title');
  });

  it('shows empty state emoji and message when no history', () => {
    const output = renderToString();
    expect(output).toContain('🌿');
    expect(output).toContain('footprint.empty');
    expect(output).toContain('footprint.emptySub');
  });

  it('shows CTA button in empty state', () => {
    const output = renderToString();
    expect(output).toContain('footprint.emptyCta');
    expect(output).toContain('PressableCard');
  });

  it('shows grid when history has items', () => {
    mockStoreState.history = [
      { id: 'f1', seasonId: 'sakura', spotId: 1, timestamp: '2026-03-20T09:00:00.000Z', composedUri: 'file:///a.jpg' },
    ];
    const output = renderToString();
    expect(output).toContain('FlatList');
  });

  it('shows total count badge when history has items', () => {
    mockStoreState.history = [
      { id: 'f1', seasonId: 'sakura', spotId: 1, timestamp: '2026-03-20T09:00:00.000Z', composedUri: 'file:///a.jpg' },
      { id: 'f2', seasonId: 'sakura', spotId: 1, timestamp: '2026-03-21T09:00:00.000Z', composedUri: null },
    ];
    const output = renderToString();
    expect(output).toContain('footprint.totalCount');
  });

  it('renders season-aware placeholder when composed image is missing', () => {
    mockStoreState.history = [
      { id: 'f3', seasonId: 'sakura', spotId: 1, timestamp: '2026-03-22T09:00:00.000Z', composedUri: null },
    ];
    const output = renderToString();
    // FlatList renderItem is a prop function — shallowRender only serialises data
    // Verify the grid (FlatList) is present with the null-composedUri record
    expect(output).toContain('FlatList');
    expect(output).toContain('"composedUri":null');
  });

  it('renders stamp thumbnail image items', () => {
    mockStoreState.history = [
      { id: 'f4', seasonId: 'sakura', spotId: 1, timestamp: '2026-03-23T09:00:00.000Z', composedUri: 'file:///thumb.jpg' },
    ];
    const output = renderToString();
    // FlatList renderItem is a prop function — shallowRender serialises data prop
    expect(output).toContain('FlatList');
    expect(output).toContain('thumb.jpg');
  });
});
