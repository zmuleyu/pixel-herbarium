jest.mock('@/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/services/antiCheat', () => ({
  checkQuota: jest.fn(),
}));

jest.mock('@/services/auth', () => ({
  signOut: jest.fn(),
}));

jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from '@/stores/auth-store';
import { checkQuota } from '@/services/antiCheat';
import { signOut } from '@/services/auth';
import { supabase } from '@/services/supabase';
import { useProfile } from '@/hooks/useProfile';
import { MONTHLY_QUOTA } from '@/constants/plants';

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockCheckQuota = checkQuota as jest.Mock;
const mockSignOut = signOut as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const MOCK_CLEAR_AUTH = jest.fn();

const MOCK_USER = {
  id: 'user-abc',
  email: 'hanako@example.com',
  user_metadata: {
    full_name: 'Hanako',
    avatar_url: null,
  },
};

function makeProfileQuery(data: any, error: any = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
  };
}

function makeUpdateQuery(error: any = null) {
  return {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: null, error }),
  };
}

function setupMocks(remaining = 3, data: any = null, error: any = null) {
  mockUseAuthStore.mockReturnValue({ user: MOCK_USER, clearAuth: MOCK_CLEAR_AUTH });
  mockCheckQuota.mockResolvedValue({ allowed: remaining > 0, remaining });
  mockSignOut.mockResolvedValue(undefined);
  mockFrom.mockReturnValueOnce(makeProfileQuery(data, error));
}

beforeEach(() => {
  mockUseAuthStore.mockReset();
  mockCheckQuota.mockReset();
  mockSignOut.mockReset();
  mockFrom.mockReset();
  MOCK_CLEAR_AUTH.mockReset();
});

describe('useProfile', () => {
  it('starts with loading=true before quota resolves', () => {
    mockUseAuthStore.mockReturnValue({ user: MOCK_USER, clearAuth: MOCK_CLEAR_AUTH });
    mockFrom.mockReturnValueOnce(makeProfileQuery(null));
    mockCheckQuota.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useProfile());
    expect(result.current.loading).toBe(true);
  });

  it('sets loading=false after data loads', async () => {
    setupMocks();
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.loading).toBe(false);
  });

  it('returns display name from profile row when available', async () => {
    setupMocks(3, { display_name: 'Profile Name' });
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.displayName).toBe('Profile Name');
  });

  it('falls back to user metadata when profile row is empty', async () => {
    setupMocks();
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.displayName).toBe('Hanako');
  });

  it('computes quota usage from the remaining count', async () => {
    setupMocks(3);
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.quotaUsed).toBe(MONTHLY_QUOTA - 3);
    expect(result.current.quotaTotal).toBe(MONTHLY_QUOTA);
  });

  it('calls signOut and clearAuth when handleSignOut is invoked', async () => {
    setupMocks();
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    await act(async () => { await result.current.handleSignOut(); });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(MOCK_CLEAR_AUTH).toHaveBeenCalledTimes(1);
  });

  it('reverts display name when updateDisplayName fails', async () => {
    setupMocks(3, { display_name: 'Stable Name' });
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });

    mockFrom.mockReturnValueOnce(makeUpdateQuery({ message: 'update failed' }));

    await expect(result.current.updateDisplayName('Changed Name')).rejects.toEqual({ message: 'update failed' });
    expect(result.current.displayName).toBe('Stable Name');
  });

  it('resolves to empty state when user is missing', async () => {
    mockUseAuthStore.mockReturnValue({ user: null, clearAuth: MOCK_CLEAR_AUTH });
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.displayName).toBe('');
    expect(result.current.quotaUsed).toBe(0);
  });
});
