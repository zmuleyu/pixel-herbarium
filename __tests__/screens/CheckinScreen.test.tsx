/**
 * CheckinScreen tests.
 * Uses shallowRender to exercise the component without react-test-renderer.
 */

// React Native global — normally defined by Metro bundler
(global as any).__DEV__ = false;

// ── Mutable mocks (declared before jest.mock) ────────────────────────────────

const mockStep = jest.fn<string, []>(() => 'photo');
const mockPhotoUri = jest.fn<string | null, []>(() => null);
const mockSelectedSpot = jest.fn<any, []>(() => null);
const mockShowSuccess = jest.fn<boolean, []>(() => false);

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
  shadows: {
    card: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
    cardSubtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardLifted: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 6 },
  },
  getSeasonTheme: () => ({ primary: '#f5d5d0', bgTint: '#fff8f5' }),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

jest.mock('@/hooks/useCheckinPhoto', () => ({
  useCheckinPhoto: () => ({
    pickFromCamera: jest.fn(),
    pickFromLibrary: jest.fn(),
    requesting: false,
  }),
}));

jest.mock('@/stores/checkin-store', () => ({
  useCheckinStore: () => ({
    addCheckin: jest.fn(),
    history: [],
  }),
}));

jest.mock('@/constants/seasons', () => ({
  getActiveSeason: () => ({ id: 'sakura', iconEmoji: '🌸' }),
}));

jest.mock('@/services/content-pack', () => ({
  loadSpotsData: () => ({
    spots: [{ id: 'spot-1', name: 'Test Spot', lat: 35.0, lng: 139.0 }],
  }),
}));

jest.mock('@/utils/stamp-position', () => ({
  getPreviousVisitYears: jest.fn(() => []),
}));

jest.mock('@/constants/guide-steps', () => ({
  STAMP_STEPS: [],
}));

jest.mock('@/components/guide', () => ({
  GuideWrapper: ({ children }: { children: any }) => children,
  MeasuredView: ({ children, style }: { children: any; style?: any }) => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return React.createElement(View, { style }, children);
  },
}));

jest.mock('@/components/checkin/SpotSelector', () => ({
  SpotSelector: 'SpotSelector',
}));

jest.mock('@/components/stamps', () => ({
  StampPreview: 'StampPreview',
}));

jest.mock('@/components/CheckinSuccessOverlay', () => 'CheckinSuccessOverlay');

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  saveToLibraryAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
}));

// Override useState to inject mutable mock state for step, photoUri, selectedSpot, showSuccess
const actualReact = jest.requireActual('react');
let useStateCalls = 0;
jest.spyOn(actualReact, 'useState').mockImplementation((init: any) => {
  const callIndex = useStateCalls++;
  // CheckinScreen useState call order:
  // 0: step, 1: photoUri, 2: selectedSpot, 3: feedback, 4: showSuccess, 5: lastStampPosition
  switch (callIndex) {
    case 0: return [mockStep(), jest.fn()];
    case 1: return [mockPhotoUri(), jest.fn()];
    case 2: return [mockSelectedSpot(), jest.fn()];
    case 3: return [null, jest.fn()]; // feedback
    case 4: return [mockShowSuccess(), jest.fn()];
    case 5: return ['bottom-right', jest.fn()]; // lastStampPosition
    default: return [init, jest.fn()];
  }
});

// ── Imports (after all jest.mock) ─────────────────────────────────────────────

import React from 'react';
import CheckinScreen from '@/app/(tabs)/checkin';

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
  const element = React.createElement(CheckinScreen);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CheckinScreen', () => {
  beforeEach(() => {
    useStateCalls = 0;
    mockStep.mockReturnValue('photo');
    mockPhotoUri.mockReturnValue(null);
    mockSelectedSpot.mockReturnValue(null);
    mockShowSuccess.mockReturnValue(false);
  });

  it('renders container', () => {
    const output = renderToString();
    expect(output).toContain('checkin.container');
  });

  it('shows step title for photo selection step', () => {
    const output = renderToString();
    expect(output).toContain('checkin.stepPhoto');
  });

  it('shows camera button', () => {
    const output = renderToString();
    expect(output).toContain('checkin.pickCamera');
  });

  it('shows library button', () => {
    const output = renderToString();
    expect(output).toContain('checkin.pickLibrary');
  });

  it('shows back button disabled on first step', () => {
    const output = renderToString();
    // On photo step, back button is disabled and no back text is rendered
    expect(output).toContain('"disabled":true');
  });

  it('shows spot selector step when photo selected', () => {
    mockStep.mockReturnValue('spot');
    mockPhotoUri.mockReturnValue('file:///photo.jpg');
    const output = renderToString();
    expect(output).toContain('SpotSelector');
    expect(output).toContain('checkin.stepSpot');
  });

  it('shows stamp preview step', () => {
    mockStep.mockReturnValue('preview');
    mockPhotoUri.mockReturnValue('file:///photo.jpg');
    mockSelectedSpot.mockReturnValue({ id: 'spot-1', name: 'Test Spot' });
    const output = renderToString();
    expect(output).toContain('StampPreview');
    expect(output).toContain('checkin.stepPreview');
  });

  it('shows success overlay after completion', () => {
    mockStep.mockReturnValue('preview');
    mockPhotoUri.mockReturnValue('file:///photo.jpg');
    mockSelectedSpot.mockReturnValue({ id: 'spot-1', name: 'Test Spot' });
    mockShowSuccess.mockReturnValue(true);
    const output = renderToString();
    expect(output).toContain('CheckinSuccessOverlay');
  });

  it('renders guide wrapper', () => {
    // GuideWrapper is mocked to pass-through children; the component wraps with it.
    // We verify the container still renders (GuideWrapper does not block).
    const output = renderToString();
    expect(output).toContain('checkin.container');
  });

  it('shows back text on non-photo steps', () => {
    mockStep.mockReturnValue('spot');
    mockPhotoUri.mockReturnValue('file:///photo.jpg');
    const output = renderToString();
    expect(output).toContain('common.back');
  });
});
