/**
 * StampPreview component tests.
 * Uses shallowRender helper (ts-jest / node env, no fiber dispatcher).
 * Verifies CTA button and StyleSelector rendering.
 *
 * StampPreview uses hooks (useState/useRef/useCallback/useEffect).
 * We stub React's dispatcher by overriding hooks via jest.mock('react', ...)
 * using the same pattern as __mocks__/react-screen-test.js.
 */

// Patch React hooks before any imports so shallowRender can call
// StampPreview as a plain function without a live fiber dispatcher.
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const mock = Object.assign({}, actual, {
    useState: (init: any) => [typeof init === 'function' ? init() : init, jest.fn()],
    useRef: (init: any) => ({ current: init !== undefined ? init : null }),
    useEffect: () => {},
    useLayoutEffect: () => {},
    useMemo: (factory: () => any) => factory(),
    useCallback: (fn: any) => fn,
    useContext: () => undefined,
  });
  mock.default = mock;
  mock.__esModule = true;
  return mock;
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn().mockResolvedValue('/mock/path.png'),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
    white: '#ffffff', border: '#e8e6e1', plantPrimary: '#9fb69f',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
  stamp: {
    padding: 16,
    opacity: { pixel: 0.93, seal: 0.90, minimal: 1 },
    pixelBorder: 2,
    sealDiameter: 72,
    sealBorder: 2.5,
    minimalBarWidth: 2.5,
    defaultPosition: 'bottom-right',
    defaultStyle: 'pixel',
    storageKey: 'stamp_style_preference',
    positionStorageKey: 'stamp_position_preference',
  },
}));

jest.mock('@/constants/seasons', () => ({
  SEASONS: [
    {
      id: 'sakura',
      nameKey: 'season.sakura.name',
      themeColor: '#e8a5b0',
      accentColor: '#f5d5d0',
      bgTint: '#FFF5F3',
      iconEmoji: '🌸',
      dateRange: ['03-15', '04-20'],
      spotsDataKey: 'sakura',
    },
  ],
  getActiveSeason: () => ({
    id: 'sakura',
    nameKey: 'season.sakura.name',
    themeColor: '#e8a5b0',
    accentColor: '#f5d5d0',
    bgTint: '#FFF5F3',
    iconEmoji: '🌸',
    dateRange: ['03-15', '04-20'],
    spotsDataKey: 'sakura',
  }),
}));

jest.mock('@/components/stamps/StampOverlay', () => ({
  StampOverlay: () => null,
}));

jest.mock('@/components/stamps/PositionSelector', () => ({
  PositionSelector: () => null,
}));

import React from 'react';
import { StampPreview } from '../../../src/components/stamps/StampPreview';
import type { FlowerSpot } from '../../../src/types/hanami';

// ── Recursive render helper ──────────────────────────────────────────

function shallowRender(element: any, depth = 15): any {
  if (element == null || typeof element === 'string' || typeof element === 'number' || typeof element === 'boolean') {
    return element;
  }
  if (Array.isArray(element)) {
    return element.map((e) => shallowRender(e, depth));
  }
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
    type: typeof element.type === 'string' ? element.type : (element.type?.name ?? 'Unknown'),
    props: { ...element.props, children: undefined },
    children: children != null ? shallowRender(children, depth) : undefined,
  };
}

// ── Fixtures ─────────────────────────────────────────────────────────

const mockSpot: FlowerSpot = {
  id: 1,
  regionId: 'jp',
  seasonId: 'sakura',
  nameJa: '哲学の道',
  nameEn: 'Philosopher\'s Path',
  prefecture: '京都府',
  prefectureCode: 26,
  city: 'Kyoto',
  category: 'river',
  bloomTypical: {
    earlyStart: '03-25',
    peakStart: '04-01',
    peakEnd: '04-07',
    lateEnd: '04-15',
  },
  latitude: 35.027,
  longitude: 135.794,
  tags: ['sakura', 'canal'],
};

const defaultProps = {
  photoUri: 'file:///mock/photo.jpg',
  spot: mockSpot,
  date: new Date('2026-03-28'),
  seasonId: 'sakura',
  onSave: jest.fn(),
  onShare: jest.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────

describe('StampPreview', () => {
  it('renders CTA button with stamp.share i18n key', () => {
    const tree = shallowRender(React.createElement(StampPreview, defaultProps));
    const json = JSON.stringify(tree);
    expect(json).toContain('stamp.share');
  });

  it('renders StyleSelector with stamp.pixel text', () => {
    const tree = shallowRender(React.createElement(StampPreview, defaultProps));
    const json = JSON.stringify(tree);
    expect(json).toContain('stamp.pixel');
  });
});
