/**
 * OfflineBanner component tests.
 * Uses a recursive shallowRender helper + mocked React hooks
 * since OfflineBanner uses useRef/useEffect which require a fiber context.
 *
 * Strategy: mock useRef/useEffect/Animated so the recursive renderer can call
 * the function component without a React fiber context.
 */

import React from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn().mockReturnValue(true),
}));

jest.mock('@/constants/theme', () => ({
  colors: { white: '#ffffff' },
  typography: { fontSize: { xs: 11 }, fontFamily: { display: 'HiraginoMaruGothicProN' } },
  spacing: { xs: 4, md: 16 },
}));

// Mock Animated so new Animated.Value() works outside fiber
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return {
    ...rn,
    Animated: {
      ...rn.Animated,
      Value: jest.fn().mockImplementation((v: number) => ({ _value: v })),
      timing: jest.fn().mockReturnValue({ start: jest.fn() }),
    },
  };
});

// Mock React hooks so the component can be called outside a fiber
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useRef: jest.fn((initial: any) => ({ current: initial })),
    useEffect: jest.fn(),
  };
});

import { OfflineBanner } from '@/components/OfflineBanner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Animated } from 'react-native';

// ── Recursive render helper ────────────────────────────────────────────────────

function shallowRender(element: any, depth = 15): any {
  if (
    element == null ||
    typeof element === 'string' ||
    typeof element === 'number' ||
    typeof element === 'boolean'
  ) {
    return element;
  }
  if (Array.isArray(element)) {
    return element.map((e) => shallowRender(e, depth));
  }
  if (!element.type) return element;

  // Function component — call it to get its output
  if (typeof element.type === 'function' && depth > 0) {
    try {
      const output = element.type({ ...element.props });
      return shallowRender(output, depth - 1);
    } catch {
      return null;
    }
  }

  // Host component (string type)
  const children = element.props?.children;
  return {
    type:
      typeof element.type === 'string'
        ? element.type
        : element.type?.name ?? 'Unknown',
    props: { ...element.props, children: undefined },
    children: children != null ? shallowRender(children, depth) : undefined,
  };
}

function renderToString(): string {
  const element = React.createElement(OfflineBanner, null);
  const tree = shallowRender(element);
  return JSON.stringify(tree);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('OfflineBanner – rendering', () => {
  it('renders the banner element', () => {
    // Component must render Animated.View and a Text child without throwing
    let tree: any;
    expect(() => {
      tree = shallowRender(React.createElement(OfflineBanner, null));
    }).not.toThrow();
    // Top-level node should be Animated.View
    expect(tree).not.toBeNull();
    const output = JSON.stringify(tree);
    expect(output).toContain('Animated.View');
    expect(output).toContain('Text');
  });

  it('text uses t("offline.banner") key', () => {
    // Mock t returns key as-is, so the rendered text node is 'offline.banner'
    const output = renderToString();
    expect(output).toContain('offline.banner');
    expect(output).not.toContain('オフライン');
  });

  it('renders without crashing', () => {
    expect(() => renderToString()).not.toThrow();
  });
});

describe('OfflineBanner – Animated.timing', () => {
  beforeEach(() => {
    (Animated.timing as jest.Mock).mockClear();
  });

  it('calls Animated.timing when online (toValue -60)', () => {
    (useNetworkStatus as jest.Mock).mockReturnValue(true);
    // useEffect is mocked; capture and invoke the callback manually
    const { useEffect } = jest.requireMock('react');
    let capturedEffect: (() => void) | null = null;
    (useEffect as jest.Mock).mockImplementationOnce((cb: () => void) => {
      capturedEffect = cb;
    });
    renderToString();
    if (capturedEffect) (capturedEffect as () => void)();
    expect(Animated.timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: -60, duration: 280, useNativeDriver: true }),
    );
  });

  it('calls Animated.timing when offline (toValue 0)', () => {
    (useNetworkStatus as jest.Mock).mockReturnValue(false);
    const { useEffect } = jest.requireMock('react');
    let capturedEffect: (() => void) | null = null;
    (useEffect as jest.Mock).mockImplementationOnce((cb: () => void) => {
      capturedEffect = cb;
    });
    renderToString();
    if (capturedEffect) (capturedEffect as () => void)();
    expect(Animated.timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 0, duration: 280, useNativeDriver: true }),
    );
  });
});

describe('OfflineBanner – Animated.Value initialisation', () => {
  it('Animated.Value initialized to -60 (hidden when online)', () => {
    (Animated.Value as jest.Mock).mockClear();
    renderToString();
    expect(Animated.Value).toHaveBeenCalledWith(-60);
  });
});

describe('OfflineBanner – hook integration', () => {
  it('uses useNetworkStatus hook', () => {
    (useNetworkStatus as jest.Mock).mockClear();
    renderToString();
    expect(useNetworkStatus).toHaveBeenCalled();
  });
});
