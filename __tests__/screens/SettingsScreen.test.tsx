/**
 * SettingsScreen tests (standalone route at src/app/settings.tsx).
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

// React Native global — normally defined by Metro bundler
(global as any).__DEV__ = false;

// Mock all dependencies BEFORE imports
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ja' },
  }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.2.3' } },
}));
jest.mock('@/i18n', () => ({
  setLanguage: jest.fn(),
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
import SettingsScreen from '@/app/settings';

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
  const element = React.createElement(SettingsScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SettingsScreen', () => {
  it('renders container', () => {
    const output = renderToString();
    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
  });

  it('shows title', () => {
    const output = renderToString();
    expect(output).toContain('profile.settings');
  });

  it('shows language settings', () => {
    const output = renderToString();
    expect(output).toContain('settings.language');
  });

  it('shows privacy settings link', () => {
    const output = renderToString();
    expect(output).toContain('profile.privacySettings');
  });

  it('shows version info', () => {
    const output = renderToString();
    expect(output).toContain('settings.version');
  });

  it('renders back navigation', () => {
    const output = renderToString();
    expect(output).toContain('common.back');
  });
});
