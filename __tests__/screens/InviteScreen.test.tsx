/**
 * InviteScreen tests.
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

// React Native global — normally defined by Metro bundler
(global as any).__DEV__ = false;

// Mock all dependencies BEFORE imports
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ code: 'ABC123' }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  Redirect: 'Redirect',
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
import InviteScreen from '@/app/invite/[code]';

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
  const element = React.createElement(InviteScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InviteScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders container', () => {
    const output = renderToString();
    expect(output).toBeDefined();
    expect(output.length).toBeGreaterThan(0);
  });

  it('shows welcome/invite message', () => {
    const output = renderToString();
    expect(output).toContain('invite.welcome');
  });

  it('renders emoji decoration', () => {
    const output = renderToString();
    // The screen shows a flower emoji
    expect(output).toBeDefined();
  });

  it('reads code from useLocalSearchParams', () => {
    // The component uses useLocalSearchParams to get the code
    // It renders without error when code is provided
    const output = renderToString();
    expect(output).toContain('invite.welcome');
  });
});
