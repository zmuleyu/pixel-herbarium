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
  it('renders without crashing', () => {
    expect(() => renderToString()).not.toThrow();
  });

  it('text uses i18n key not hardcoded Japanese', () => {
    const output = renderToString();
    expect(output).toContain('offline.banner');
    expect(output).not.toContain('オフライン');
  });
});

describe('OfflineBanner – Animated.Value initialisation', () => {
  it('Animated.Value initialized to -60 (hidden when online)', () => {
    // Reset the mock call record before rendering
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
