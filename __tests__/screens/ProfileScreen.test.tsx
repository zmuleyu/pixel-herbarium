/**
 * ProfileScreen tests.
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

// Mock all dependencies BEFORE imports
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'test-user' } }),
}));
jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    email: 'test@example.com',
    displayName: 'Test User',
    avatarUrl: null,
    quotaUsed: 3,
    quotaTotal: 10,
    loading: false,
    updating: false,
    handleSignOut: jest.fn(),
    updateDisplayName: jest.fn(),
  }),
}));
jest.mock('@/hooks/useHerbarium', () => ({
  useHerbarium: () => ({ plants: [], collected: new Set(), loading: false }),
}));
jest.mock('@/hooks/useSeasonRecap', () => ({
  useSeasonRecap: () => ({
    plants: [],
    season: { label: '春' },
  }),
}));
jest.mock('@/constants/plants', () => ({
  TOTAL_PLANTS: 120,
  RARITY_LABELS: { 1: '★', 2: '★★', 3: '★★★ 限定' },
}));
jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1', plantPrimary: '#9fb69f', text: '#3a3a3a',
    textSecondary: '#7a7a7a', border: '#e8e6e1', white: '#ffffff',
    rarity: { common: '#9fb69f', uncommon: '#d4e4f7', rare: '#f5d5d0' },
    seasonal: { sakura: '#f5d5d0' },
    plantSecondary: '#c1e8d8',
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
import ProfileScreen from '@/app/(tabs)/profile';

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
  const element = React.createElement(ProfileScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProfileScreen', () => {
  it('renders profile screen without crashing', () => {
    expect(() => renderToString()).not.toThrow();
  });

  it('renders settings menu row', () => {
    const output = renderToString();
    expect(output).toContain('profile.settings');
  });
});
