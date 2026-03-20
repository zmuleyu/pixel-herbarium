/**
 * StampDecoration tests.
 * Verifies SVG elements render for each decorationKey.
 */

jest.mock('react-native-svg', () => {
  const React = jest.requireActual('react');
  const mock = (name: string) => (props: any) =>
    React.createElement(name, props);
  return {
    __esModule: true,
    default: mock('Svg'),
    Svg: mock('Svg'),
    Ellipse: mock('Ellipse'),
    Path: mock('Path'),
    Circle: mock('Circle'),
  };
});

import React from 'react';
import { StampDecoration } from '@/components/stamps/StampDecoration';

function shallowRender(element: any, depth = 12): any {
  if (element == null || typeof element !== 'object') return element;
  if (Array.isArray(element)) return element.map((e) => shallowRender(e, depth));
  if (!element.type) return element;
  if (typeof element.type === 'function' && depth > 0) {
    try {
      return shallowRender(element.type({ ...element.props }), depth - 1);
    } catch { return null; }
  }
  const children = element.props?.children;
  return {
    type: typeof element.type === 'string' ? element.type : (element.type?.name ?? 'Unknown'),
    props: { ...element.props, children: undefined },
    children: children != null ? shallowRender(children, depth) : undefined,
  };
}

describe('StampDecoration', () => {
  const baseProps = { color: '#e8a5b0', styleId: 'classic' as const };

  it('renders an Svg element for petals', () => {
    const tree = shallowRender(
      React.createElement(StampDecoration, { ...baseProps, decorationKey: 'petals' })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('Ellipse');
  });

  it('renders an Svg element for branch', () => {
    const tree = shallowRender(
      React.createElement(StampDecoration, { ...baseProps, decorationKey: 'branch' })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('Path');
  });

  it('renders an Svg element for stars', () => {
    const tree = shallowRender(
      React.createElement(StampDecoration, { ...baseProps, decorationKey: 'stars' })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('Svg');
  });

  it('uses the provided color for fill', () => {
    const tree = shallowRender(
      React.createElement(StampDecoration, { ...baseProps, decorationKey: 'petals' })
    );
    const json = JSON.stringify(tree);
    expect(json).toContain('#e8a5b0');
  });

  it('renders for medallion styleId', () => {
    const tree = shallowRender(
      React.createElement(StampDecoration, { ...baseProps, styleId: 'medallion', decorationKey: 'stars' })
    );
    expect(tree).not.toBeNull();
  });
});
