/**
 * StampRenderer dispatch tests.
 * Verifies that StampRenderer routes each styleId to the correct stamp component.
 * Uses the shallowRender helper pattern (plain function calls, no fiber dispatcher).
 */

// ── Mocks (must be declared before any imports) ───────────────────────

jest.mock('react-native-svg', () => {
  const React = require('react');
  const stub = (name: string) => (props: any) => React.createElement(name, props);
  return {
    __esModule: true,
    default: stub('Svg'),
    Svg: stub('Svg'),
    Path: stub('Path'),
    Circle: stub('Circle'),
    G: stub('G'),
    Rect: stub('Rect'),
    Text: stub('SvgText'),
    Defs: stub('Defs'),
    LinearGradient: stub('LinearGradient'),
    Stop: stub('Stop'),
  };
});

jest.mock('@/utils/stamp-colors', () => ({
  getStampColors: jest.fn(() => ({
    brandDeep: '#c45070',
    brandMid: '#d46080',
  })),
}));

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

// ── Imports ───────────────────────────────────────────────────────────

import React from 'react';
import { StampRenderer } from '../../../src/components/stamps/StampRenderer';
import type { FlowerSpot } from '../../../src/types/hanami';
import type { SeasonConfig } from '../../../src/constants/seasons';

// ── Recursive render helper ───────────────────────────────────────────

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

function renderToJson(props: Parameters<typeof StampRenderer>[0]): string {
  const element = React.createElement(StampRenderer, props);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Fixtures ──────────────────────────────────────────────────────────

const mockSpot: FlowerSpot = {
  id: 1,
  regionId: 'jp',
  seasonId: 'sakura',
  nameJa: '哲学の道',
  nameEn: "Philosopher's Path",
  prefecture: '京都府',
  prefectureCode: 26,        // → KYOTO
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
  tags: ['sakura'],
};

const mockSeason: SeasonConfig = {
  id: 'sakura',
  nameKey: 'season.sakura.name',
  themeColor: '#e8a5b0',
  accentColor: '#f5d5d0',
  bgTint: '#FFF5F3',
  iconEmoji: '🌸',
  dateRange: ['03-15', '04-20'],
  spotsDataKey: 'sakura',
};

const baseProps = {
  spot: mockSpot,
  date: new Date('2026-03-28'),
  season: mockSeason,
};

// ── Tests ─────────────────────────────────────────────────────────────

describe('StampRenderer', () => {
  describe('styleId=classic', () => {
    it('renders ClassicStamp — shows spot name and city', () => {
      const json = renderToJson({ ...baseProps, styleId: 'classic' });
      expect(json).toContain('哲学の道');
      expect(json).toContain('KYOTO');
    });

    it('renders ClassicStamp — shows formatted date', () => {
      const json = renderToJson({ ...baseProps, styleId: 'classic' });
      expect(json).toContain('2026.03.28');
    });
  });

  describe('styleId=minimal', () => {
    it('renders MinimalStamp — shows spot name and city', () => {
      const json = renderToJson({ ...baseProps, styleId: 'minimal' });
      expect(json).toContain('哲学の道');
      expect(json).toContain('KYOTO');
    });

    it('renders MinimalStamp — shows formatted date', () => {
      const json = renderToJson({ ...baseProps, styleId: 'minimal' });
      expect(json).toContain('2026.03.28');
    });
  });

  describe('styleId=medallion', () => {
    it('renders MedallionStamp — shows spot name', () => {
      const json = renderToJson({ ...baseProps, styleId: 'medallion' });
      expect(json).toContain('哲学の道');
    });

    it('renders MedallionStamp — shows season label', () => {
      // season label format: `${year}${SEASON_LABELS[season.id]}` → '2026春'
      const json = renderToJson({ ...baseProps, styleId: 'medallion' });
      expect(json).toContain('2026春');
    });
  });

  describe('legacy migration', () => {
    it('styleId=pixel migrates to ClassicStamp — shows spot name and city', () => {
      const json = renderToJson({ ...baseProps, styleId: 'pixel' });
      expect(json).toContain('哲学の道');
      expect(json).toContain('KYOTO');
      // ClassicStamp renders date; MedallionStamp renders season label instead
      expect(json).toContain('2026.03.28');
    });

    it('styleId=seal migrates to MedallionStamp — shows spot name and season label', () => {
      const json = renderToJson({ ...baseProps, styleId: 'seal' });
      expect(json).toContain('哲学の道');
      expect(json).toContain('2026春');
    });
  });

  describe('unknown styleId fallback', () => {
    it('falls back to ClassicStamp — shows spot name and city', () => {
      const json = renderToJson({ ...baseProps, styleId: 'nonexistent-style' });
      expect(json).toContain('哲学の道');
      expect(json).toContain('KYOTO');
      expect(json).toContain('2026.03.28');
    });
  });
});
