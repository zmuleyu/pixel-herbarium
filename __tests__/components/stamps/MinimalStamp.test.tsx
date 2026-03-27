/**
 * MinimalStamp component tests.
 * Uses shallowRender helper (ts-jest / node env, no fiber dispatcher).
 * MinimalStamp uses accentColor (not themeColor) and does NOT use getStampColors.
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

import { MinimalStamp } from '@/components/stamps/MinimalStamp';

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

function renderToJson(props: Parameters<typeof MinimalStamp>[0]): string {
  const element = React.createElement(MinimalStamp, props);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Fixtures ─────────────────────────────────────────────────────────

const props = {
  spotName: '金閣寺',
  cityEn: 'KYOTO',
  date: new Date('2026-03-28'),
  accentColor: '#e8a5b0',
};

// ── Tests ─────────────────────────────────────────────────────────────

describe('MinimalStamp', () => {
  it('renders spot name', () => {
    const output = renderToJson(props);
    expect(output).toContain('金閣寺');
  });

  it('renders city name', () => {
    const output = renderToJson(props);
    expect(output).toContain('KYOTO');
  });

  it('renders formatted date', () => {
    const output = renderToJson(props);
    expect(output).toContain('2026.03.28');
  });

  it('renders custom text when provided', () => {
    const output = renderToJson({ ...props, customText: 'Golden pavilion' });
    expect(output).toContain('Golden pavilion');
  });

  it('omits custom text when absent', () => {
    const output = renderToJson(props);
    expect(output).not.toContain('Golden pavilion');
  });
});
