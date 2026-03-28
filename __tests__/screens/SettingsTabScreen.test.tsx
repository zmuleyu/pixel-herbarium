/**
 * SettingsTabScreen tests.
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

// React Native global — normally defined by Metro bundler
(global as any).__DEV__ = false;

// ── Mutable mocks (declared before jest.mock) ────────────────────────────────

const mockSession = jest.fn<any, []>(() => null);
const mockUser = jest.fn<any, []>(() => null);

// ── jest.mock BEFORE imports ──────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ja' },
  }),
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
  shadows: {
    card: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
    cardSubtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardLifted: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 6 },
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('expo-constants', () => ({
  default: { expoConfig: { version: '1.1.0' } },
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    session: mockSession(),
    user: mockUser(),
  }),
}));

jest.mock('@/stores/checkin-store', () => ({
  useCheckinStore: Object.assign(
    () => ({ history: [] }),
    { getState: () => ({ history: [] }), setState: jest.fn() },
  ),
}));

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: { signOut: jest.fn() },
    functions: { invoke: jest.fn() },
  },
}));

jest.mock('@/i18n', () => ({
  setLanguage: jest.fn(),
}));

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: '/tmp/',
  writeAsStringAsync: jest.fn(),
  EncodingType: { UTF8: 'utf8' },
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  default: { clear: jest.fn() },
}));

// ── Imports (after all jest.mock) ─────────────────────────────────────────────

import React from 'react';
import SettingsTabScreen from '@/app/(tabs)/settings';

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
  const element = React.createElement(SettingsTabScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SettingsTabScreen', () => {
  beforeEach(() => {
    mockSession.mockReturnValue(null);
    mockUser.mockReturnValue(null);
  });

  it('renders container', () => {
    const output = renderToString();
    expect(output).toContain('settings.container');
  });

  it('shows screen title', () => {
    const output = renderToString();
    expect(output).toContain('settings.title');
  });

  it('shows version number', () => {
    const output = renderToString();
    expect(output).toContain('settings.version');
    expect(output).toContain('1.1.0');
  });

  it('shows login button when no session', () => {
    const output = renderToString();
    expect(output).toContain('settings.login');
  });

  it('shows account info when session present', () => {
    mockSession.mockReturnValue({ access_token: 'tok' });
    mockUser.mockReturnValue({ id: 'u1', email: 'test@test.com', user_metadata: { display_name: 'Tester' } });
    const output = renderToString();
    expect(output).toContain('test@test.com');
    expect(output).toContain('Tester');
  });

  it('shows language selector', () => {
    const output = renderToString();
    expect(output).toContain('settings.language');
    expect(output).toContain('English');
  });

  it('shows privacy settings link (privacy policy moved inside privacy screen)', () => {
    const output = renderToString();
    // Privacy Policy link was moved into /privacy screen to consolidate privacy UI.
    // Settings should still have the Privacy Settings entry.
    expect(output).toContain('profile.privacySettings');
  });

  it('shows sign out button when logged in', () => {
    mockSession.mockReturnValue({ access_token: 'tok' });
    mockUser.mockReturnValue({ id: 'u1', email: 'test@test.com' });
    const output = renderToString();
    expect(output).toContain('settings.signOut');
  });

  it('shows delete account button when logged in', () => {
    mockSession.mockReturnValue({ access_token: 'tok' });
    mockUser.mockReturnValue({ id: 'u1', email: 'test@test.com' });
    const output = renderToString();
    expect(output).toContain('settings.deleteAccount');
  });

  it('shows export data option', () => {
    const output = renderToString();
    expect(output).toContain('settings.exportData');
  });
});
