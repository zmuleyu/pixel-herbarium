/**
 * ShareSheet component tests.
 * Uses a recursive render helper + mock for React hooks
 * since react-test-renderer is broken in React 19 and ShareSheet uses hooks.
 *
 * Strategy: mock useState/useRef/Animated so the recursive renderer can call
 * the function component without a React fiber context.
 */

import React from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
    white: '#ffffff', border: '#e8e6e1', plantPrimary: '#9fb69f',
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

jest.mock('@/constants/plants', () => ({
  RARITY_LABELS: { 1: '★', 2: '★★', 3: '★★★ 限定' },
}));

jest.mock('@/utils/plant-gradient', () => ({
  getPlantGradientColors: jest.fn((r: number) =>
    r === 3 ? ['#f5e0dd', '#f5f4f1'] : r === 2 ? ['#e0eaf5', '#f5f4f1'] : ['#e8f0e8', '#f5f4f1'],
  ),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn().mockResolvedValue('file://mock-capture.png'),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  saveToLibraryAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'share.storyLabel': 'Instagram Stories',
        'share.lineLabel': 'LINE Card',
        'share.save': 'Save to Photos',
        'share.share': 'Share',
        'share.saved': 'Saved ✓',
        'share.permissionRequired': 'Please allow',
      };
      return map[key] ?? key;
    },
  }),
}));

// Mock React hooks so the component can be called outside a fiber
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const mockAnimatedValue = { current: 300 };
  return {
    ...actual,
    useState: jest.fn((initial: any) => [initial, jest.fn()]),
    useRef: jest.fn((initial: any) => ({ current: initial ?? null })),
  };
});

// Mock Animated so that new Animated.Value() works outside fiber
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return {
    ...rn,
    Animated: {
      ...rn.Animated,
      Value: jest.fn().mockImplementation((val: number) => ({ _value: val })),
    },
  };
});

import { ShareSheet, type ShareSheetProps } from '@/components/ShareSheet';
import type { SharePosterPlant } from '@/components/SharePoster';

// ── Recursive render helper ────────────────────────────────────────────────

function shallowRender(element: any, depth = 15): any {
  if (element == null || typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') {
    return element;
  }
  if (Array.isArray(element)) {
    return element.map(e => shallowRender(e, depth));
  }
  if (!element.type) return element;

  // Function component — call it to get its output
  if (typeof element.type === 'function' && depth > 0) {
    try {
      const output = element.type({ ...element.props });
      return shallowRender(output, depth - 1);
    } catch {
      return null;
    }
  }

  // Host component (string type)
  const children = element.props?.children;
  return {
    type: typeof element.type === 'string' ? element.type : element.type?.name ?? 'Unknown',
    props: { ...element.props, children: undefined },
    children: children != null ? shallowRender(children, depth) : undefined,
  };
}

function renderToString(props: ShareSheetProps): string {
  const element = React.createElement(ShareSheet, props);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Fixtures ──────────────────────────────────────────────────────────────

const basePlant: SharePosterPlant = {
  name_ja: 'サクラ',
  name_latin: 'Prunus serrulata',
  rarity: 1,
  hanakotoba: '優しさ',
  pixel_sprite_url: 'https://example.com/sprite.png',
  cityRank: null,
  bloom_months: [3, 4],
};

const defaultProps: ShareSheetProps = {
  visible: true,
  onClose: jest.fn(),
  plant: basePlant,
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ShareSheet – format labels', () => {
  it('renders Instagram Stories label when visible', () => {
    const output = renderToString(defaultProps);
    expect(output).toContain('Instagram Stories');
  });

  it('renders LINE Card label when visible', () => {
    const output = renderToString(defaultProps);
    expect(output).toContain('LINE Card');
  });
});

describe('ShareSheet – action buttons', () => {
  it('contains save button text', () => {
    const output = renderToString(defaultProps);
    expect(output).toContain('Save to Photos');
  });

  it('contains share button text', () => {
    const output = renderToString(defaultProps);
    expect(output).toContain('Share');
  });
});

describe('ShareSheet – off-screen posters for capture', () => {
  it('renders story format poster content with plant name', () => {
    const output = renderToString({ ...defaultProps, plant: basePlant });
    expect(output).toContain('サクラ');
  });

  it('renders line format poster gift copy', () => {
    const output = renderToString({ ...defaultProps, plant: basePlant });
    expect(output).toContain('この花をあなたに贈ります');
  });

  it('passes discovery date and city to posters', () => {
    const output = renderToString({
      ...defaultProps,
      discoveryDate: '2024-04-01',
      discoveryCity: '東京',
    });
    expect(output).toContain('東京');
    expect(output).toContain('2024');
  });
});

describe('ShareSheet – Modal visible prop', () => {
  it('passes visible=true to Modal', () => {
    const output = renderToString({ ...defaultProps, visible: true });
    expect(output).toContain('"visible":true');
  });

  it('passes visible=false to Modal when not visible', () => {
    const output = renderToString({ ...defaultProps, visible: false });
    expect(output).toContain('"visible":false');
  });
});
