/**
 * Tests for useFlipCard hook.
 * Mocks expo-secure-store, expo-haptics, and relies on the existing
 * react-native Animated mock in __mocks__/react-native.js.
 */

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { Animated } from 'react-native';
import { useFlipCard } from '@/hooks/useFlipCard';

/** Flush all pending microtasks (promises) inside act */
async function flushPromises() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
}

describe('useFlipCard – initial state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('1'); // hint already seen
  });

  it('starts with isFlipped=false', async () => {
    const { result } = renderHook(() => useFlipCard());
    await flushPromises();
    expect(result.current.isFlipped).toBe(false);
  });

  it('returns all expected fields', async () => {
    const { result } = renderHook(() => useFlipCard());
    await flushPromises();
    expect(result.current).toHaveProperty('isFlipped');
    expect(result.current).toHaveProperty('frontRotation');
    expect(result.current).toHaveProperty('backRotation');
    expect(result.current).toHaveProperty('frontOpacity');
    expect(result.current).toHaveProperty('backOpacity');
    expect(result.current).toHaveProperty('handleFlip');
    expect(result.current).toHaveProperty('showHint');
    expect(result.current).toHaveProperty('hintOpacity');
  });
});

describe('useFlipCard – showHint behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('showHint=true when SecureStore returns null', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useFlipCard());
    await flushPromises();
    expect(result.current.showHint).toBe(true);
  });

  it('showHint=false when SecureStore returns "1"', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('1');
    const { result } = renderHook(() => useFlipCard());
    await flushPromises();
    expect(result.current.showHint).toBe(false);
  });

  it('starts Animated.loop when hint not seen', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const loopSpy = Animated.loop as jest.Mock;
    loopSpy.mockClear();
    renderHook(() => useFlipCard());
    await flushPromises();
    expect(loopSpy).toHaveBeenCalled();
  });
});

describe('useFlipCard – handleFlip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('1');
  });

  it('toggles isFlipped from false to true', async () => {
    const { result } = renderHook(() => useFlipCard());
    await flushPromises();
    act(() => { result.current.handleFlip(); });
    expect(result.current.isFlipped).toBe(true);
  });

  it('toggles isFlipped back to false on second flip', async () => {
    const { result } = renderHook(() => useFlipCard());
    await flushPromises();
    act(() => { result.current.handleFlip(); });
    act(() => { result.current.handleFlip(); });
    expect(result.current.isFlipped).toBe(false);
  });

  it('calls Animated.spring with correct params', async () => {
    const springSpy = Animated.spring as jest.Mock;
    springSpy.mockClear();
    const { result } = renderHook(() => useFlipCard());
    await flushPromises();
    act(() => { result.current.handleFlip(); });
    expect(springSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    );
  });

  it('calls Haptics.impactAsync on flip', async () => {
    const { result } = renderHook(() => useFlipCard());
    await flushPromises();
    act(() => { result.current.handleFlip(); });
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });
});

describe('useFlipCard – hint dismissal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('first flip dismisses hint and calls SecureStore.setItemAsync', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const { result } = renderHook(() => useFlipCard());
    await flushPromises();
    expect(result.current.showHint).toBe(true);
    act(() => { result.current.handleFlip(); });
    expect(result.current.showHint).toBe(false);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('hanakotoba_hint_seen_v1', '1');
  });

  it('does not call SecureStore.setItemAsync when hint already dismissed', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('1');
    const { result } = renderHook(() => useFlipCard());
    await flushPromises();
    act(() => { result.current.handleFlip(); });
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
