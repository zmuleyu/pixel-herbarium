/**
 * SealStamp component tests.
 * Uses shallowRender helper (ts-jest / node env, no fiber dispatcher).
 */

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

jest.mock('@/utils/stamp-colors', () => ({
  getStampColors: jest.fn(() => ({
    brandDeep: '#c45070',
    brandMid: '#d46080',
  })),
}));

import { SealStamp } from '@/components/stamps/SealStamp';

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

function renderToJson(props: Parameters<typeof SealStamp>[0]): string {
  const element = React.createElement(SealStamp, props);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Fixtures ─────────────────────────────────────────────────────────

const props = {
  spotName: '東大寺',
  seasonEmoji: '🌸',
  year: 2026,
  seasonLabel: '桜の季節',
  themeColor: '#e8a5b0',
};

// ── Tests ─────────────────────────────────────────────────────────────

describe('SealStamp', () => {
  it('renders spot name', () => {
    const output = renderToJson(props);
    expect(output).toContain('東大寺');
  });

  it('renders year', () => {
    const output = renderToJson(props);
    expect(output).toContain('2026');
  });

  it('renders season emoji', () => {
    const output = renderToJson(props);
    expect(output).toContain('🌸');
  });

  it('renders season label', () => {
    const output = renderToJson(props);
    expect(output).toContain('桜の季節');
  });
});
