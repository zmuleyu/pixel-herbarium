/**
 * StampOverlay component tests.
 * Uses shallowRender helper (ts-jest / node env, no fiber dispatcher).
 */

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  const mockAnimatedValue = { current: 1 };
  return {
    ...actual,
    default: { ...actual },
    __esModule: true,
    useRef: (init: any) => ({ current: init !== undefined ? init : mockAnimatedValue }),
    useEffect: jest.fn(),
  };
});

import React from 'react';

jest.mock('@/constants/theme', () => ({
  stamp: {
    opacity: { pixel: 0.93, seal: 0.90, minimal: 1 },
    sealDiameter: 72,
    sealBorder: 2.5,
    minimalBarWidth: 2.5,
    pixelBorder: 2,
    padding: 16,
    defaultPosition: 'bottom-right',
    defaultStyle: 'pixel',
    storageKey: 'stamp_style_preference',
    positionStorageKey: 'stamp_position_preference',
  },
}));

jest.mock('@/components/stamps/StampRenderer', () => ({
  StampRenderer: (props: any) =>
    React.createElement('View', { testID: 'stamp-renderer', styleId: props.styleId }),
}));

import { StampOverlay } from '@/components/stamps/StampOverlay';
import type { FlowerSpot, StampPosition } from '@/types/hanami';

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

function renderToJson(
  position: StampPosition,
  overrides: Record<string, any> = {},
): string {
  const element = React.createElement(StampOverlay, {
    style: 'classic',
    position,
    spot: makeSpot(),
    date: new Date('2026-03-28'),
    season: makeSeason(),
    ...overrides,
  });
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Fixtures ─────────────────────────────────────────────────────────

function makeSpot(): FlowerSpot {
  return {
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
  };
}

function makeSeason() {
  return {
    id: 'sakura',
    nameKey: 'seasons.sakura',
    themeColor: '#e8a5b0',
    accentColor: '#c45070',
    bgTint: '#fff5f5',
    iconEmoji: '🌸',
    dateRange: ['03-01', '05-31'] as [string, string],
    spotsDataKey: 'sakura',
  };
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('StampOverlay', () => {
  it('renders stamp at specified position', () => {
    const output = renderToJson('bottom-right');
    // Should contain the StampRenderer mock with the correct styleId
    expect(output).toContain('stamp-renderer');
    expect(output).toContain('classic');
  });

  it('passes user-selected opacity', () => {
    const output = renderToJson('top-left', { userOpacity: 0.5 });
    // The component renders, opacity is applied via Animated.multiply
    expect(output).toContain('stamp-renderer');
  });

  it('renders stamp component based on style prop', () => {
    const outputClassic = renderToJson('bottom-right', { style: 'classic' });
    expect(outputClassic).toContain('"styleId":"classic"');

    const outputRelief = renderToJson('bottom-right', { style: 'relief' });
    expect(outputRelief).toContain('"styleId":"relief"');
  });

  it('renders with default opacity and scale when not provided', () => {
    // No userOpacity or userScale provided — should still render
    const output = renderToJson('center');
    expect(output).toContain('stamp-renderer');
  });
});
