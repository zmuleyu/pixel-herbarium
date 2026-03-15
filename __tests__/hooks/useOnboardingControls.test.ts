// __tests__/hooks/useOnboardingControls.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useOnboardingControls, ONBOARDING_KEY } from '@/hooks/useOnboardingControls';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light' },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ONBOARDING_KEY', () => {
  it('equals the versioned storage key', () => {
    expect(ONBOARDING_KEY).toBe('onboarding_done_v1');
  });
});

describe('useOnboardingControls — initial state', () => {
  it('starts on page 0', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    expect(result.current.page).toBe(0);
  });

  it('returns slideAnims array of length equal to slideCount', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    expect(result.current.slideAnims).toHaveLength(3);
  });

  it('returns scrollRef and dotAnim', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    expect(result.current.scrollRef).toBeDefined();
    expect(result.current.dotAnim).toBeDefined();
  });
});

describe('useOnboardingControls — goNext', () => {
  it('increments page by 1', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    act(() => { result.current.goNext(); });
    expect(result.current.page).toBe(1);
  });

  it('triggers haptic feedback', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    act(() => { result.current.goNext(); });
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it('calls finish (not increment) when already on last slide', async () => {
    // slideCount=1 means page 0 is the last slide
    const { result } = renderHook(() => useOnboardingControls(1));
    await act(async () => { result.current.goNext(); });
    expect(result.current.page).toBe(0); // page did not increment
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(ONBOARDING_KEY, '1');
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/discover');
  });

  it('triggers haptic when calling finish via goNext on last slide', async () => {
    const { result } = renderHook(() => useOnboardingControls(1));
    await act(async () => { result.current.goNext(); });
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });
});

describe('useOnboardingControls — goBack', () => {
  it('decrements page by 1', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    act(() => { result.current.goNext(); }); // advance to page 1
    act(() => { result.current.goBack(); });
    expect(result.current.page).toBe(0);
  });

  it('triggers haptic feedback', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    act(() => { result.current.goNext(); }); // advance to page 1
    jest.clearAllMocks();
    act(() => { result.current.goBack(); });
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it('is a no-op on page 0 — page stays 0', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    act(() => { result.current.goBack(); });
    expect(result.current.page).toBe(0);
  });

  it('is a no-op on page 0 — no haptic fires', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    act(() => { result.current.goBack(); });
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe('useOnboardingControls — finish', () => {
  it('writes onboarding key to SecureStore', async () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    await act(async () => { result.current.finish(); });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(ONBOARDING_KEY, '1');
  });

  it('navigates to discover tab', async () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    await act(async () => { result.current.finish(); });
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/discover');
  });

  it('triggers haptic feedback', async () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    await act(async () => { result.current.finish(); });
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });
});

describe('useOnboardingControls — onSwipeEnd', () => {
  function makeSwipeEvent(x: number) {
    return { nativeEvent: { contentOffset: { x } } } as any;
  }

  it('does not throw when called', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    expect(() => {
      act(() => { result.current.onSwipeEnd(makeSwipeEvent(0)); });
    }).not.toThrow();
  });

  it('is a no-op (no extra haptic) when isProgrammaticScroll guard is active', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    // goNext sets isProgrammaticScroll = true internally
    act(() => { result.current.goNext(); });
    const hapticCallCount = (Haptics.impactAsync as jest.Mock).mock.calls.length;
    // The programmatic scroll event fires — should be swallowed by guard
    act(() => { result.current.onSwipeEnd(makeSwipeEvent(375)); });
    // No additional haptic should have fired
    expect((Haptics.impactAsync as jest.Mock).mock.calls.length).toBe(hapticCallCount);
  });
});
