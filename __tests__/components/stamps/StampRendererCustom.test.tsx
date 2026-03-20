/**
 * StampRenderer — customOptions behavior tests.
 * Verifies wrapper View, resolvedColor, customText derivation, effect styles, and decoration rendering.
 */

jest.mock('@/utils/stamp-colors', () => ({
  getStampColors: jest.fn(() => ({ brandDeep: '#c45070', brandMid: '#d46080' })),
}));

jest.mock('@/constants/stamp-styles', () => ({
  STAMP_STYLE_MIGRATION: { pixel: 'classic', seal: 'medallion' },
  DEFAULT_STAMP_STYLE_ID: 'classic',
}));

jest.mock('@/constants/prefecture-en', () => ({
  PREFECTURE_EN: { 26: 'KYOTO' },
}));

jest.mock('react-native-svg', () => {
  const React = jest.requireActual('react');
  const mock = (name: string) => (props: any) => React.createElement(name, props);
  return {
    __esModule: true, default: mock('Svg'), Svg: mock('Svg'),
    Path: mock('Path'), Circle: mock('Circle'), Ellipse: mock('Ellipse'),
  };
});

import React from 'react';
import { StampRenderer } from '@/components/stamps/StampRenderer';
import { DEFAULT_CUSTOM_OPTIONS } from '@/types/hanami';
import type { CustomOptions } from '@/types/hanami';

function shallowRender(element: any, depth = 12): any {
  if (element == null || typeof element !== 'object') return element;
  if (Array.isArray(element)) return element.map((e) => shallowRender(e, depth));
  if (!element.type) return element;
  if (typeof element.type === 'function' && depth > 0) {
    try { return shallowRender(element.type({ ...element.props }), depth - 1); }
    catch { return null; }
  }
  const children = element.props?.children;
  return {
    type: typeof element.type === 'string' ? element.type : (element.type?.name ?? 'Unknown'),
    props: { ...element.props, children: undefined },
    children: children != null ? shallowRender(children, depth) : undefined,
  };
}

const mockSeason = {
  id: 'sakura', themeColor: '#e8a5b0', accentColor: '#f5d5d0',
  bgTint: '#FFF5F3',
  nameKey: 'season.sakura.name', iconEmoji: '🌸',
  dateRange: ['03-15', '04-20'] as [string, string], spotsDataKey: 'sakura',
};

const mockSpot = {
  id: 1, regionId: 'jp', seasonId: 'sakura', nameJa: '哲学の道', nameEn: "Philosopher's Path",
  prefecture: '京都府', prefectureCode: 26, city: 'Kyoto', category: 'river' as const,
  bloomTypical: { earlyStart: '03-25', peakStart: '04-01', peakEnd: '04-07', lateEnd: '04-15' },
  latitude: 35.027, longitude: 135.794, tags: [],
  hanakotoba: '清らかな心',
};

const defaultProps = {
  styleId: 'classic' as const,
  spot: mockSpot,
  date: new Date('2026-03-28'),
  season: mockSeason,
};

describe('StampRenderer – customOptions', () => {
  it('renders wrapper View with position relative style by default', () => {
    const tree = shallowRender(React.createElement(StampRenderer, defaultProps));
    const json = JSON.stringify(tree);
    // Wrapper View should carry position:relative
    expect(json).toContain('"position":"relative"');
  });

  it('applies shadow style when effectType=shadow', () => {
    const opts: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, effectType: 'shadow' };
    const tree = shallowRender(
      React.createElement(StampRenderer, { ...defaultProps, customOptions: opts })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('"shadowOpacity":0.13');
    expect(json).toContain('"elevation":3');
  });

  it('applies glow style when effectType=glow', () => {
    const opts: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, effectType: 'glow' };
    const tree = shallowRender(
      React.createElement(StampRenderer, { ...defaultProps, customOptions: opts })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('"shadowOpacity":0.4');
    expect(json).toContain('"elevation":6');
  });

  it('passes custom color to ClassicStamp when customColor is set', () => {
    const opts: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, customColor: '#7B9FCC' };
    const tree = shallowRender(
      React.createElement(StampRenderer, { ...defaultProps, customOptions: opts })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('#7B9FCC');
  });

  it('falls back to season themeColor when customColor is undefined', () => {
    const tree = shallowRender(React.createElement(StampRenderer, defaultProps));
    const json = JSON.stringify(tree);
    expect(json).toContain('#e8a5b0');
  });

  it('renders StampDecoration when decorationKey is petals', () => {
    const opts: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, decorationKey: 'petals' };
    const tree = shallowRender(
      React.createElement(StampRenderer, { ...defaultProps, customOptions: opts })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('Ellipse');
  });

  it('does not render StampDecoration when decorationKey is none', () => {
    const tree = shallowRender(React.createElement(StampRenderer, defaultProps));
    const json = JSON.stringify(tree);
    expect(json).not.toContain('Ellipse');
  });

  it('passes hanakotoba as customText when textMode=hanakotoba', () => {
    const opts: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, textMode: 'hanakotoba' };
    const tree = shallowRender(
      React.createElement(StampRenderer, { ...defaultProps, customOptions: opts })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('清らかな心');
  });

  it('passes customTextValue as customText when textMode=custom', () => {
    const opts: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, textMode: 'custom', customTextValue: '春の記憶' };
    const tree = shallowRender(
      React.createElement(StampRenderer, { ...defaultProps, customOptions: opts })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('春の記憶');
  });
});
