/**
 * Tests for usePushToken hook.
 * Notifications, supabase, and auth-store are mocked — covers permission
 * gating, token registration, and upsert payload correctness.
 */

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: jest.fn().mockReturnValue({ user: null }),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test]' }),
}));

jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'ios' },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: { eas: { projectId: '74427c7e-dba6-4061-9cc9-3651d09fae01' } },
    },
  },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/services/supabase';
import { usePushToken } from '@/hooks/usePushToken';

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockGetToken = Notifications.getExpoPushTokenAsync as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

/** Flush all pending promise microtasks by draining across multiple ticks */
async function flushPromises(ticks = 5): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}

function makeUpsertChain() {
  const upsertMock = jest.fn().mockResolvedValue({ data: null, error: null });
  return {
    upsert: upsertMock,
    _upsertMock: upsertMock,
  };
}

beforeEach(() => {
  mockUseAuthStore.mockReset();
  mockUseAuthStore.mockReturnValue({ user: null });
  mockGetPermissions.mockReset();
  mockGetPermissions.mockResolvedValue({ status: 'granted' });
  mockRequestPermissions.mockReset();
  mockRequestPermissions.mockResolvedValue({ status: 'granted' });
  mockGetToken.mockReset();
  mockGetToken.mockResolvedValue({ data: 'ExponentPushToken[test]' });
  mockFrom.mockReset();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('usePushToken – no user', () => {
  it('does nothing when user is null', async () => {
    mockUseAuthStore.mockReturnValue({ user: null });

    renderHook(() => usePushToken());
    await act(async () => { await flushPromises(); });

    expect(mockGetPermissions).not.toHaveBeenCalled();
    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(mockGetToken).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('usePushToken – permission handling', () => {
  it('does not request permission again when already granted', async () => {
    mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } });
    mockGetPermissions.mockResolvedValue({ status: 'granted' });

    const chain = makeUpsertChain();
    mockFrom.mockReturnValue(chain);

    renderHook(() => usePushToken());
    await act(async () => { await flushPromises(); });

    expect(mockGetPermissions).toHaveBeenCalledTimes(1);
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it('requests permission when not already granted', async () => {
    mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } });
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissions.mockResolvedValue({ status: 'granted' });

    const chain = makeUpsertChain();
    mockFrom.mockReturnValue(chain);

    renderHook(() => usePushToken());
    await act(async () => { await flushPromises(); });

    expect(mockGetPermissions).toHaveBeenCalledTimes(1);
    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('push_tokens');
    expect(chain._upsertMock).toHaveBeenCalledTimes(1);
  });

  it('does not register token when permission denied', async () => {
    mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } });
    mockGetPermissions.mockResolvedValue({ status: 'denied' });
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });

    renderHook(() => usePushToken());
    await act(async () => { await flushPromises(); });

    expect(mockGetToken).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('does not register token when request permission is denied after prompt', async () => {
    mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } });
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });

    renderHook(() => usePushToken());
    await act(async () => { await flushPromises(); });

    expect(mockGetToken).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('usePushToken – token registration', () => {
  it('registers token with supabase when permission granted', async () => {
    mockUseAuthStore.mockReturnValue({ user: { id: 'user-abc' } });
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetToken.mockResolvedValue({ data: 'ExponentPushToken[test]' });

    const chain = makeUpsertChain();
    mockFrom.mockReturnValue(chain);

    renderHook(() => usePushToken());
    await act(async () => { await flushPromises(); });

    expect(mockFrom).toHaveBeenCalledWith('push_tokens');
    expect(chain._upsertMock).toHaveBeenCalledTimes(1);

    const [payload, options] = chain._upsertMock.mock.calls[0];
    expect(payload.user_id).toBe('user-abc');
    expect(payload.token).toBe('ExponentPushToken[test]');
    expect(payload.platform).toBe('ios');
    expect(typeof payload.updated_at).toBe('string');
    expect(options).toEqual({ onConflict: 'user_id,token' });
  });

  it('calls getExpoPushTokenAsync with correct projectId', async () => {
    mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } });
    mockGetPermissions.mockResolvedValue({ status: 'granted' });

    const chain = makeUpsertChain();
    mockFrom.mockReturnValue(chain);

    renderHook(() => usePushToken());
    await act(async () => { await flushPromises(); });

    expect(mockGetToken).toHaveBeenCalledWith({ projectId: '74427c7e-dba6-4061-9cc9-3651d09fae01' });
  });

  it('re-registers when user id changes', async () => {
    mockUseAuthStore.mockReturnValue({ user: { id: 'user-1' } });
    mockGetPermissions.mockResolvedValue({ status: 'granted' });

    const chain1 = makeUpsertChain();
    const chain2 = makeUpsertChain();
    mockFrom
      .mockReturnValueOnce(chain1)
      .mockReturnValueOnce(chain2);

    const { rerender } = renderHook(() => usePushToken());
    await act(async () => { await flushPromises(); });

    expect(chain1._upsertMock).toHaveBeenCalledTimes(1);

    // Simulate user change
    mockUseAuthStore.mockReturnValue({ user: { id: 'user-2' } });
    rerender();
    await act(async () => { await flushPromises(); });

    expect(chain2._upsertMock).toHaveBeenCalledTimes(1);
    const [payload] = chain2._upsertMock.mock.calls[0];
    expect(payload.user_id).toBe('user-2');
  });
});
