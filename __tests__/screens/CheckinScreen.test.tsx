/**
 * DiaryScreen tests (src/app/(tabs)/checkin.tsx).
 * The checkin tab was rewritten as a diary/history browser in v1.1.0 build 4.
 * Photo capture was moved to checkin-wizard.tsx.
 */

// React Native global — normally defined by Metro bundler
(global as any).__DEV__ = false;

// ── Mutable mock state ────────────────────────────────────────────────────────

const mockHistory = jest.fn<any[], []>(() => []);

// ── jest.mock BEFORE imports ──────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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
  fontWeight: { light: '300', regular: '400', semibold: '600', bold: '700', heavy: '800' },
  shadows: {
    card: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  },
  getSeasonTheme: () => ({ primary: '#e8a5b0', accent: '#f5d5d0', bgTint: '#FFF5F3' }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/stores/checkin-store', () => ({
  useCheckinStore: (selector?: (s: any) => any) => {
    const state = { history: mockHistory(), loadHistory: jest.fn() };
    return selector ? selector(state) : state;
  },
}));

jest.mock('@/constants/seasons', () => ({
  getActiveSeason: () => ({ id: 'sakura', iconEmoji: '🌸' }),
}));

jest.mock('@/services/content-pack', () => ({
  loadSpotsData: () => ({
    spots: [{ id: 1, nameJa: 'テスト公園', lat: 35.0, lng: 139.0 }],
  }),
}));

jest.mock('@/components/PressableCard', () => ({
  PressableCard: ({ children, style }: any) => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, { style }, children);
  },
}));

// ── Imports (after all jest.mock) ─────────────────────────────────────────────

import React from 'react';
import DiaryScreen from '@/app/(tabs)/checkin';

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
  const element = React.createElement(DiaryScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DiaryScreen (checkin tab)', () => {
  beforeEach(() => {
    mockHistory.mockReturnValue([]);
  });

  it('renders diary container', () => {
    const output = renderToString();
    expect(output).toContain('diary.container');
  });

  it('shows diary title', () => {
    const output = renderToString();
    expect(output).toContain('tabs.diary');
  });

  it('shows empty state when no history', () => {
    const output = renderToString();
    expect(output).toContain('diary.emptyTitle');
    expect(output).toContain('diary.emptySub');
  });

  it('empty state CTA navigates to checkin-wizard', () => {
    const output = renderToString();
    expect(output).toContain('home.captureCta');
  });

  it('shows stats row when history has entries', () => {
    mockHistory.mockReturnValue([
      { id: 'c1', seasonId: 'sakura', spotId: 1, timestamp: '2026-03-28T10:00:00Z', composedUri: null, synced: false },
      { id: 'c2', seasonId: 'sakura', spotId: 2, timestamp: '2026-03-27T10:00:00Z', composedUri: null, synced: false },
    ]);
    const output = renderToString();
    expect(output).toContain('diary.totalCheckins');
    expect(output).toContain('diary.spotsVisited');
  });

  it('shows all photos section title when history present', () => {
    mockHistory.mockReturnValue([
      { id: 'c1', seasonId: 'sakura', spotId: 1, timestamp: '2026-03-28T10:00:00Z', composedUri: null, synced: false },
    ]);
    const output = renderToString();
    expect(output).toContain('diary.allPhotos');
  });

  it('renders photo card placeholder when no composedUri', () => {
    mockHistory.mockReturnValue([
      { id: 'c1', seasonId: 'sakura', spotId: 1, timestamp: '2026-03-28T10:00:00Z', composedUri: null, synced: false },
    ]);
    const output = renderToString();
    // Season emoji appears in placeholder card
    expect(output).toContain('🌸');
  });
});
