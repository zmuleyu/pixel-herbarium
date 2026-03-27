// __tests__/components/guide/GuideMeasureContext.test.tsx
import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { LayoutChangeEvent } from 'react-native';
import {
  GuideMeasureContext,
  GuideMeasureProvider,
  useGuideMeasure,
} from '@/components/guide/GuideMeasureContext';

/** Helper: build a minimal LayoutChangeEvent with given layout values. */
function makeLayoutEvent(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}): LayoutChangeEvent {
  return { nativeEvent: { layout: rect } } as LayoutChangeEvent;
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GuideMeasureProvider>{children}</GuideMeasureProvider>
);

describe('GuideMeasureContext', () => {
  // 1. Default context (no provider) returns no-op register and null getRect
  it('default context register is no-op and getRect returns null', () => {
    const { result } = renderHook(() => React.useContext(GuideMeasureContext));
    // register should not throw
    expect(() =>
      result.current.register('key', makeLayoutEvent({ x: 0, y: 0, width: 10, height: 10 })),
    ).not.toThrow();
    expect(result.current.getRect('key')).toBeNull();
  });

  // 2. Provider register stores layout rect correctly
  it('register stores layout rect via provider', () => {
    const { result } = renderHook(() => useGuideMeasure(), { wrapper });
    const event = makeLayoutEvent({ x: 10, y: 20, width: 100, height: 50 });

    act(() => {
      result.current.register('header', event);
    });

    const rect = result.current.getRect('header');
    expect(rect).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  // 3. Provider getRect retrieves stored rect
  it('getRect retrieves previously registered rect', () => {
    const { result } = renderHook(() => useGuideMeasure(), { wrapper });
    const event = makeLayoutEvent({ x: 5, y: 15, width: 200, height: 80 });

    act(() => {
      result.current.register('card', event);
    });

    expect(result.current.getRect('card')).toEqual({
      x: 5,
      y: 15,
      width: 200,
      height: 80,
    });
  });

  // 4. Provider getRect returns null for unknown key
  it('getRect returns null for unknown key', () => {
    const { result } = renderHook(() => useGuideMeasure(), { wrapper });
    expect(result.current.getRect('nonexistent')).toBeNull();
  });

  // 5. Multiple keys stored independently
  it('stores multiple keys independently', () => {
    const { result } = renderHook(() => useGuideMeasure(), { wrapper });

    act(() => {
      result.current.register('a', makeLayoutEvent({ x: 0, y: 0, width: 10, height: 10 }));
      result.current.register('b', makeLayoutEvent({ x: 50, y: 60, width: 70, height: 80 }));
    });

    expect(result.current.getRect('a')).toEqual({ x: 0, y: 0, width: 10, height: 10 });
    expect(result.current.getRect('b')).toEqual({ x: 50, y: 60, width: 70, height: 80 });
    // Updating 'a' should not affect 'b'
    act(() => {
      result.current.register('a', makeLayoutEvent({ x: 1, y: 1, width: 11, height: 11 }));
    });
    expect(result.current.getRect('a')).toEqual({ x: 1, y: 1, width: 11, height: 11 });
    expect(result.current.getRect('b')).toEqual({ x: 50, y: 60, width: 70, height: 80 });
  });

  // 6. useGuideMeasure hook returns context value from provider
  it('useGuideMeasure returns register and getRect from provider', () => {
    const { result } = renderHook(() => useGuideMeasure(), { wrapper });
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.getRect).toBe('function');
  });
});
