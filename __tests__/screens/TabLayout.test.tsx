/**
 * TabLayout tests.
 * Uses shallowRender to exercise the tab layout component.
 */

// React Native global — normally defined by Metro bundler
(global as any).__DEV__ = false;

// Mock all dependencies BEFORE imports
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('expo-router', () => ({
  Tabs: Object.assign(
    ({ children }: any) => children,
    { Screen: (props: any) => JSON.stringify(props) },
  ),
  useRouter: () => ({ push: jest.fn() }),
  useSegments: () => ['(tabs)'],
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
jest.mock('@/components/TabBarIcon', () => ({
  __esModule: true,
  default: 'TabBarIcon',
}));
jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1',
    textSecondary: '#7a7a7a',
    border: '#e8e6e1',
    text: '#3a3a3a',
    white: '#ffffff',
    plantPrimary: '#9fb69f',
    rarity: { common: '#9fb69f', uncommon: '#d4e4f7', rare: '#f5d5d0' },
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
    lineHeight: 1.7,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
  getSeasonTheme: () => ({ primary: '#9fb69f', secondary: '#c1e8d8' }),
}));
jest.mock('@/constants/seasons', () => ({
  getActiveSeason: () => ({ id: 'spring', name: 'Spring' }),
}));

import React from 'react';
import TabLayout from '@/app/(tabs)/_layout';

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
  const element = React.createElement(TabLayout);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TabLayout', () => {
  it('renders without crash', () => {
    const output = renderToString();
    expect(output).toBeDefined();
  });

  it('renders home tab', () => {
    const output = renderToString();
    expect(output).toContain('\\"name\\":\\"home\\"');
  });

  it('renders checkin tab', () => {
    const output = renderToString();
    expect(output).toContain('\\"name\\":\\"checkin\\"');
  });

  it('renders settings tab', () => {
    const output = renderToString();
    expect(output).toContain('\\"name\\":\\"settings\\"');
  });

  it('renders tab configuration with Tabs.Screen elements', () => {
    const output = renderToString();
    // All visible tabs should have their i18n label keys (double-escaped in JSON)
    expect(output).toContain('tabs.home');
    // checkin tab now uses tabs.diary label key
    expect(output).toContain('tabs.diary');
    expect(output).toContain('tabs.settings');
  });
});
