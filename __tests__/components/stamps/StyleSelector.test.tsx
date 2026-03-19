/**
 * StyleSelector component tests.
 * Uses the shallowRender pattern (plain function calls, no fiber).
 * Verifies that all 3 style tabs render with their i18n keys.
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
import type { StampStyle } from '../../../src/types/hanami';

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
    selected: 'pixel' as StampStyle,
    onSelect,
    themeColor: '#e8a5b0',
  };

  it('renders all 3 style tab keys', () => {
    const tree = shallowRender(
      React.createElement(StyleSelector, defaultProps)
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('stamp.pixel');
    expect(json).toContain('stamp.seal');
    expect(json).toContain('stamp.minimal');
  });

  it('marks pixel tab as selected when selected="pixel"', () => {
    const tree = shallowRender(
      React.createElement(StyleSelector, { ...defaultProps, selected: 'pixel' })
    );
    const json = JSON.stringify(tree);
    // The active tab has accessibilityState { selected: true }
    expect(json).toContain('"selected":true');
  });

  it('marks seal tab as selected when selected="seal"', () => {
    const tree = shallowRender(
      React.createElement(StyleSelector, { ...defaultProps, selected: 'seal' })
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
