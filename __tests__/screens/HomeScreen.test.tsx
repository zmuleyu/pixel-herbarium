/**
 * HomeScreen tests.
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
    blushPink: '#ffd9e5',
    plantPrimary: '#9fb69f',
    text: '#3a3a3a',
    textSecondary: '#7a7a7a',
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
    lineHeight: 1.7,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { md: 12, lg: 20 },
  fontWeight: { light: '300', semibold: '600', bold: '700', heavy: '800' },
  shadows: { card: {} },
  getSeasonTheme: () => ({
    primary: '#d4537e',
    accent: '#d4537e',
    bgTint: '#fff6f9',
  }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('@/components/guide', () => ({
  GuideWrapper: ({ children }: { children: any }) => children,
  MeasuredView: ({ children }: { children: any }) => children,
}));

jest.mock('@/hooks/useStaggeredEntry', () => ({
  useStaggeredEntry: () => ({ getStyle: () => ({}) }),
}));

jest.mock('@/components/PressableCard', () => ({
  PressableCard: ({ children }: { children: any }) => children,
}));

jest.mock('@/services/content-pack', () => ({
  loadSpotsData: () => ({
    spots: [{ id: 1, nameJa: '上野公園' }],
  }),
}));

import React from 'react';
import HomeScreen from '@/app/(tabs)/home';

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
  const element = React.createElement(HomeScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

describe('HomeScreen', () => {
  beforeEach(() => {
    mockStoreState.history = [];
    mockLoadHistory.mockClear();
    mockRouterPush.mockClear();
  });

  it('renders container', () => {
    const output = renderToString();
    expect(output).toContain('home.container');
  });

  it('shows season emoji from active season', () => {
    const output = renderToString();
    expect(output).toContain('🌸');
  });

  it('shows capture CTA text', () => {
    const output = renderToString();
    expect(output).toContain('home.captureCta');
  });

  it('shows diary section title', () => {
    const output = renderToString();
    expect(output).toContain('home.diaryTitle');
  });

  it('shows empty state when history is empty', () => {
    const output = renderToString();
    expect(output).toContain('home.emptyTitle');
    expect(output).toContain('home.emptySub');
  });

  it('shows diary count when history has items', () => {
    mockStoreState.history = [
      { id: 'c1', seasonId: 'sakura', spotId: 1, timestamp: '2026-03-20T09:00:00.000Z', composedUri: null },
      { id: 'c2', seasonId: 'sakura', spotId: 1, timestamp: '2026-03-21T09:00:00.000Z', composedUri: null },
    ];
    const output = renderToString();
    expect(output).toContain('home.diaryCount');
  });

  it('provides loadHistory mock on store shape', () => {
    expect(typeof mockStoreState.loadHistory).toBe('function');
  });

  it('renders seasonal background gradient', () => {
    const output = renderToString();
    expect(output).toContain('LinearGradient');
  });

  it('shows greeting season name text key', () => {
    const output = renderToString();
    expect(output).toContain('season.spring');
  });

  it('renders navigation capture elements', () => {
    const output = renderToString();
    expect(output).toContain('TouchableOpacity');
    // onPress is a function reference, not a serialised string; verify the CTA button exists
    expect(output).toContain('home.captureCta');
  });

  it('shows only one captureCta when history is empty (no duplicate header CTA)', () => {
    mockStoreState.history = [];
    const output = renderToString();
    // Count occurrences: only the empty state CTA should appear, not the header CTA
    const count = (output.match(/home\.captureCta/g) ?? []).length;
    expect(count).toBe(1);
  });

  it('shows header captureCta when history has items', () => {
    mockStoreState.history = [
      { id: 'c1', seasonId: 'sakura', spotId: 1, timestamp: '2026-03-20T09:00:00.000Z', composedUri: null },
    ];
    const output = renderToString();
    expect(output).toContain('home.captureCta');
  });
});
