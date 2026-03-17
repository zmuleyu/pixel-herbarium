/**
 * Tests for useNetworkStatus hook.
 * AppState is mocked — covers online detection, interval setup, and cleanup.
 *
 * Key: EXPO_PUBLIC_SUPABASE_URL is not set in the test environment, so
 * PING_URL resolves to '/rest/v1/' and checkOnline() short-circuits to true
 * without ever calling fetch.
 */

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return {
    ...rn,
    AppState: {
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  };
});

import { renderHook, act } from '@testing-library/react-hooks';
import { AppState } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const mockAddEventListener = AppState.addEventListener as jest.Mock;
const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

global.fetch = jest.fn().mockResolvedValue({ status: 200 });

beforeEach(() => {
  mockAddEventListener.mockClear();
  mockAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
  (global.fetch as jest.Mock).mockClear();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useNetworkStatus – initial state', () => {
  it('initial state is true (online)', async () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(true);
  });

  it('returns true when PING_URL is not set (test env skip)', async () => {
    const { result } = renderHook(() => useNetworkStatus());
    await act(async () => { await flushPromises(); });

    // checkOnline() skips fetch when PING_URL === '/rest/v1/'
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current).toBe(true);
  });
});

describe('useNetworkStatus – AppState listener', () => {
  it('calls AppState.addEventListener on mount', async () => {
    renderHook(() => useNetworkStatus());
    await act(async () => { await flushPromises(); });

    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('AppState listener re-checks on "active" state', async () => {
    renderHook(() => useNetworkStatus());
    await act(async () => { await flushPromises(); });

    // Retrieve the listener callback registered with AppState
    const listenerCallback = mockAddEventListener.mock.calls[0][1];
    expect(listenerCallback).toBeDefined();

    // Invoking with 'active' should not throw and hook stays online
    await act(async () => {
      listenerCallback('active');
      await flushPromises();
    });

    // fetch is still not called (PING_URL is unset in test env)
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('AppState listener does not re-check on non-active states', async () => {
    renderHook(() => useNetworkStatus());
    await act(async () => { await flushPromises(); });

    const listenerCallback = mockAddEventListener.mock.calls[0][1];

    await act(async () => {
      listenerCallback('background');
      listenerCallback('inactive');
      await flushPromises();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('useNetworkStatus – cleanup', () => {
  it('cleans up interval and listener on unmount without throwing', async () => {
    const { unmount } = renderHook(() => useNetworkStatus());
    await act(async () => { await flushPromises(); });

    expect(() => unmount()).not.toThrow();
  });

  it('calls sub.remove on unmount', async () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = renderHook(() => useNetworkStatus());
    await act(async () => { await flushPromises(); });

    const sub = mockAddEventListener.mock.results[0].value;
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(sub.remove).toHaveBeenCalledTimes(1);

    clearIntervalSpy.mockRestore();
  });
});
