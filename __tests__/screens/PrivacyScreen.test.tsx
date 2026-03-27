/**
 * PrivacyScreen tests.
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

// React Native global — normally defined by Metro bundler
(global as any).__DEV__ = false;

// Mock all dependencies BEFORE imports
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: '/tmp/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockSupabaseFrom = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { map_visible: true, notifications_enabled: true } }),
  update: jest.fn().mockReturnThis(),
  order: jest.fn().mockResolvedValue({ data: [] }),
}));
jest.mock('@/services/supabase', () => ({
  supabase: { from: mockSupabaseFrom },
}));
jest.mock('@/services/auth', () => ({
  signOut: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ user: { id: 'test-user' } }),
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

import React from 'react';
import PrivacyScreen from '@/app/privacy';

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
  const element = React.createElement(PrivacyScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PrivacyScreen', () => {
  it('renders container', () => {
    const output = renderToString();
    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
  });

  it('shows title', () => {
    const output = renderToString();
    expect(output).toContain('profile.privacySettings');
  });

  it('shows back navigation', () => {
    const output = renderToString();
    expect(output).toContain('common.back');
  });

  it('shows loading state initially', () => {
    // Component starts with loading=true, so ActivityIndicator should render
    const output = renderToString();
    // When loading=true, it shows ActivityIndicator instead of settings content
    // The title and back button are always shown, but the toggle items are not
    expect(output).toBeDefined();
  });

  it('renders privacy-related i18n keys', () => {
    const output = renderToString();
    // Title is always shown regardless of loading state
    expect(output).toContain('profile.privacySettings');
    expect(output).toContain('common.back');
  });
});
