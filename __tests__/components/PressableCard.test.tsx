// __tests__/components/PressableCard.test.tsx
// Unit tests for PressableCard — spring press animation wrapper.

// Patch React hooks so shallowRender works without a fiber dispatcher
jest.mock('react', () => {
  const actual = jest.requireActual<typeof import('react')>('react');
  return {
    ...actual,
    __esModule: true,
    default: actual,
    useState: (init: any) => [typeof init === 'function' ? init() : init, jest.fn()],
    useRef: (init: any) => ({ current: init !== undefined ? init : null }),
    useEffect: jest.fn(),
    useLayoutEffect: jest.fn(),
    useMemo: (fn: () => any) => fn(),
    useCallback: (fn: any) => fn,
  };
});

import React from 'react';

function shallowRender(element: React.ReactElement) {
  const { type, props } = element;
  if (typeof type === 'function') {
    return (type as Function)(props);
  }
  return element;
}

function findByType(tree: any, targetType: string): any {
  if (!tree) return null;
  if (tree.type === targetType) return tree;
  const children = tree.props?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findByType(child, targetType);
      if (found) return found;
    }
  } else if (children && typeof children === 'object') {
    return findByType(children, targetType);
  }
  return null;
}

describe('PressableCard', () => {
  const { PressableCard } = require('@/components/PressableCard');

  it('exports as a function', () => {
    expect(typeof PressableCard).toBe('function');
  });

  it('renders children content', () => {
    const tree = shallowRender(
      <PressableCard>
        <span>Hello</span>
      </PressableCard>,
    );
    expect(tree).toBeTruthy();
    const animatedView = findByType(tree, 'Animated.View');
    expect(animatedView).toBeTruthy();
    expect(animatedView.props.children).toBeTruthy();
  });

  it('calls onPress callback', () => {
    const onPress = jest.fn();
    const tree = shallowRender(
      <PressableCard onPress={onPress}>
        <span>Click</span>
      </PressableCard>,
    );
    expect(tree.props.onPress).toBe(onPress);
  });

  it('applies custom style to Animated.View', () => {
    const customStyle = { backgroundColor: 'red' };
    const tree = shallowRender(
      <PressableCard style={customStyle}>
        <span>Styled</span>
      </PressableCard>,
    );
    const animatedView = findByType(tree, 'Animated.View');
    const styles = animatedView.props.style;
    expect(Array.isArray(styles)).toBe(true);
    expect(styles[0]).toBe(customStyle);
  });

  it('passes testID to Pressable', () => {
    const tree = shallowRender(
      <PressableCard testID="card-1">
        <span>Test</span>
      </PressableCard>,
    );
    expect(tree.props.testID).toBe('card-1');
  });

  it('triggers haptic on pressIn by default', () => {
    const Haptics = require('expo-haptics');
    Haptics.impactAsync.mockClear();

    const tree = shallowRender(
      <PressableCard>
        <span>Haptic</span>
      </PressableCard>,
    );
    tree.props.onPressIn();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });
});
