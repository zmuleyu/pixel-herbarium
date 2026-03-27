/**
 * SpotSelector component tests.
 * Uses shallowRender helper (ts-jest / node env, no fiber dispatcher).
 */

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    default: { ...actual },
    __esModule: true,
    useState: (init: any) => [typeof init === 'function' ? init() : init, jest.fn()],
  };
});

import React from 'react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@/constants/theme', () => ({
  colors: {
    text: '#333',
    textSecondary: '#999',
    white: '#fff',
    border: '#eee',
  },
  typography: {
    fontFamily: { display: 'System' },
    fontSize: { xs: 10, md: 14 },
  },
  spacing: { sm: 8, md: 16, xl: 24 },
  borderRadius: { sm: 4, md: 8 },
  getSeasonTheme: () => ({ primary: '#e8a5b0' }),
}));

jest.mock('@/constants/seasons', () => ({
  getActiveSeason: () => ({ id: 'sakura' }),
}));

jest.mock('@/utils/bloom', () => ({
  getBloomStatus: jest.fn(() => 'blooming'),
  getBloomStatusLabel: jest.fn(() => 'bloom.blooming'),
  getBloomStatusColor: jest.fn(() => '#f48fb1'),
}));

import { SpotSelector } from '@/components/checkin/SpotSelector';
import type { FlowerSpot } from '@/types/hanami';

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
    type: typeof element.type === 'string' ? element.type : (element.type?.name ?? element.type?.displayName ?? 'Unknown'),
    props: { ...element.props, children: undefined },
    children: children != null ? shallowRender(children, depth) : undefined,
  };
}

function renderToJson(spots: FlowerSpot[], onSelect = jest.fn()): string {
  const element = React.createElement(SpotSelector, { spots, onSelect });
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Fixtures ─────────────────────────────────────────────────────────

const makeSpot = (overrides: Partial<FlowerSpot> = {}): FlowerSpot => ({
  id: 1,
  regionId: 'jp',
  seasonId: 'sakura',
  nameJa: '哲学の道',
  nameEn: 'Philosophers Path',
  prefecture: '京都府',
  prefectureCode: 26,
  city: '京都市',
  category: 'park',
  bloomTypical: { earlyStart: '03-20', peakStart: '03-28', peakEnd: '04-05', lateEnd: '04-15' },
  latitude: 35.02,
  longitude: 135.79,
  tags: ['sakura'],
  ...overrides,
});

const spots: FlowerSpot[] = [
  makeSpot({ id: 1, nameJa: '哲学の道', nameEn: 'Philosophers Path', prefecture: '京都府', city: '京都市' }),
  makeSpot({ id: 2, nameJa: '上野恩賜公園', nameEn: 'Ueno Park', prefecture: '東京都', city: '台東区' }),
];

// ── Tests ─────────────────────────────────────────────────────────────

describe('SpotSelector', () => {
  it('renders search input', () => {
    const output = renderToJson(spots);
    expect(output).toContain('checkin.spotSearchPlaceholder');
  });

  it('renders spot list items', () => {
    const output = renderToJson(spots);
    expect(output).toContain('哲学の道');
    expect(output).toContain('上野恩賜公園');
  });

  it('renders spot prefecture and city', () => {
    const output = renderToJson(spots);
    expect(output).toContain('京都府');
    expect(output).toContain('京都市');
  });

  it('handles empty spot list', () => {
    const output = renderToJson([]);
    // Should still render the container with search input
    expect(output).toContain('checkin.spotSearchPlaceholder');
    // Should not contain any spot names
    expect(output).not.toContain('哲学の道');
  });
});
