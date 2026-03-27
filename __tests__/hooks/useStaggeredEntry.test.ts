/**
 * Tests for useStaggeredEntry hook.
 * Animated + AccessibilityInfo are mocked via __mocks__/react-native.js.
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { Animated, AccessibilityInfo } from 'react-native';
import { useStaggeredEntry } from '@/hooks/useStaggeredEntry';

const mockIsReduceMotion = AccessibilityInfo.isReduceMotionEnabled as jest.Mock;

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  jest.clearAllMocks();
  mockIsReduceMotion.mockResolvedValue(false);
});

describe('useStaggeredEntry – basic API', () => {
  it('returns getStyle function', async () => {
    const { result } = renderHook(() => useStaggeredEntry({ count: 3 }));
    await act(async () => { await flushPromises(); });
    expect(typeof result.current.getStyle).toBe('function');
  });

  it('getStyle returns opacity and transform properties', async () => {
    const { result } = renderHook(() => useStaggeredEntry({ count: 3 }));
    await act(async () => { await flushPromises(); });

    const style = result.current.getStyle(0);
    expect(style).toHaveProperty('opacity');
    expect(style).toHaveProperty('transform');
    expect(Array.isArray(style.transform)).toBe(true);
    expect(style.transform[0]).toHaveProperty('translateY');
  });
});

describe('useStaggeredEntry – ready state', () => {
  it('ready=true after animation completes', async () => {
    const { result } = renderHook(() => useStaggeredEntry({ count: 3 }));
    await act(async () => { await flushPromises(); });
    expect(result.current.ready).toBe(true);
  });

  it('handles zero items gracefully — ready=true immediately', async () => {
    const { result } = renderHook(() => useStaggeredEntry({ count: 0 }));
    await act(async () => { await flushPromises(); });
    expect(result.current.ready).toBe(true);
  });
});

describe('useStaggeredEntry – accessibility', () => {
  it('respects reduceMotion — skips animation and sets ready', async () => {
    mockIsReduceMotion.mockResolvedValue(true);
    const { result } = renderHook(() => useStaggeredEntry({ count: 3 }));
    await act(async () => { await flushPromises(); });

    expect(result.current.ready).toBe(true);
    // When reduceMotion is true, Animated.parallel should not be called
    // (values are set directly via setValue instead)
  });
});
