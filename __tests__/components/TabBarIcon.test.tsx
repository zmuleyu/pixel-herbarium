// __tests__/components/TabBarIcon.test.tsx
// Unit tests for TabBarIcon — custom SVG tab icons.

import React from 'react';

function shallowRender(element: React.ReactElement) {
  const { type, props } = element;
  if (typeof type === 'function') {
    return (type as Function)(props);
  }
  return element;
}

describe('TabBarIcon', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const TabBarIcon = require('@/components/TabBarIcon').default;

  it('exports as a function', () => {
    expect(typeof TabBarIcon).toBe('function');
  });

  it('renders home icon as an SVG element', () => {
    const tree = shallowRender(
      <TabBarIcon name="home" focused={false} color="#333" size={24} />,
    );
    // The sub-icon returns an Svg element
    const svg = shallowRender(tree);
    expect(svg).toBeTruthy();
    expect(svg.type).toBeDefined();
    // Svg component from mock receives width/height
    expect(svg.props.width).toBe(24);
    expect(svg.props.height).toBe(24);
  });

  it('passes color prop through to icon strokes', () => {
    const tree = shallowRender(
      <TabBarIcon name="checkin" focused={false} color="#ff0000" size={28} />,
    );
    const svg = shallowRender(tree);
    // First child should have stroke=color
    const children = React.Children.toArray(svg.props.children);
    const hasColor = children.some(
      (child: any) => child?.props?.stroke === '#ff0000',
    );
    expect(hasColor).toBe(true);
  });

  it('passes size prop to SVG dimensions', () => {
    const tree = shallowRender(
      <TabBarIcon name="settings" focused={true} color="#000" size={32} />,
    );
    const svg = shallowRender(tree);
    expect(svg.props.width).toBe(32);
    expect(svg.props.height).toBe(32);
  });

  it('handles focused state — home icon fills with color', () => {
    const unfocused = shallowRender(
      shallowRender(
        <TabBarIcon name="home" focused={false} color="#333" size={24} />,
      ),
    );
    const focused = shallowRender(
      shallowRender(
        <TabBarIcon name="home" focused={true} color="#333" size={24} />,
      ),
    );

    // The first Rect child has fill that differs based on focused
    const unfocusedChildren = React.Children.toArray(unfocused.props.children);
    const focusedChildren = React.Children.toArray(focused.props.children);

    const unfocusedRect = unfocusedChildren.find((c: any) => c?.type?.displayName === 'Rect') as any;
    const focusedRect = focusedChildren.find((c: any) => c?.type?.displayName === 'Rect') as any;

    expect(unfocusedRect.props.fill).toBe('none');
    expect(focusedRect.props.fill).toBe('#333');
  });
});
