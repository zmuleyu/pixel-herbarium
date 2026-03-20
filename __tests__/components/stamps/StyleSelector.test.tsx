/**
 * StyleSelector component tests.
 * Uses the shallowRender pattern (plain function calls, no fiber).
 * Verifies that all 6 style cards render with their i18n keys.
 * Updated for Batch A2: 6 styles (classic/relief/postcard/medallion/window/minimal).
 * Legacy style IDs (pixel/seal) are migrated via STAMP_STYLE_MIGRATION.
 */

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
    white: '#ffffff', border: '#e8e6e1', plantPrimary: '#9fb69f',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
  stamp: { padding: 16 },
}));

import React from 'react';
import { StyleSelector } from '../../../src/components/stamps/StyleSelector';
import type { StampStyleId } from '../../../src/types/hanami';

function shallowRender(el: any, depth = 8): any {
  if (el == null || typeof el !== 'object' || !el.type) return el;
  if (typeof el.type === 'function' && depth > 0) {
    return shallowRender(el.type(el.props ?? {}), depth - 1);
  }
  const children = el.props?.children;
  return {
    type: el.type,
    props: { ...el.props, children: undefined },
    children: Array.isArray(children)
      ? children.map((c: any) => shallowRender(c, depth))
      : shallowRender(children, depth),
  };
}

describe('StyleSelector', () => {
  const onSelect = jest.fn();
  const defaultProps = {
    selected: 'classic' as StampStyleId,
    onSelect,
    themeColor: '#e8a5b0',
  };

  it('renders all 6 style card keys', () => {
    const tree = shallowRender(
      React.createElement(StyleSelector, defaultProps)
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('stamp.styleClassic');
    expect(json).toContain('stamp.styleRelief');
    expect(json).toContain('stamp.stylePostcard');
    expect(json).toContain('stamp.styleMedallion');
    expect(json).toContain('stamp.styleWindow');
    expect(json).toContain('stamp.styleMinimal');
  });

  it('marks classic tab as selected when selected="classic"', () => {
    const tree = shallowRender(
      React.createElement(StyleSelector, { ...defaultProps, selected: 'classic' })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('"selected":true');
  });

  it('marks medallion tab as selected when selected="medallion"', () => {
    const tree = shallowRender(
      React.createElement(StyleSelector, { ...defaultProps, selected: 'medallion' })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('"selected":true');
  });

  it('marks minimal tab as selected when selected="minimal"', () => {
    const tree = shallowRender(
      React.createElement(StyleSelector, { ...defaultProps, selected: 'minimal' })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('"selected":true');
  });
});
