/**
 * Tests for useProfile hook.
 * useAuthStore, antiCheat.checkQuota, and auth.signOut are mocked.
 */

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/services/antiCheat', () => ({
  checkQuota: jest.fn(),
}));

jest.mock('@/services/auth', () => ({
  signOut: jest.fn(),
}));

// Mock supabase — profiles table returns null so hook falls back to user_metadata
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from '@/stores/auth-store';
import { checkQuota } from '@/services/antiCheat';
import { signOut } from '@/services/auth';
import { useProfile } from '@/hooks/useProfile';
import { MONTHLY_QUOTA } from '@/constants/plants';

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockCheckQuota = checkQuota as jest.Mock;
const mockSignOut = signOut as jest.Mock;

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const MOCK_CLEAR_AUTH = jest.fn();

const MOCK_USER = {
  id: 'user-abc',
  email: 'hanako@example.com',
  user_metadata: {
    full_name: '花子',
    avatar_url: null,
  },
};

function setupMocks(remaining = 3) {
  mockUseAuthStore.mockReturnValue({ user: MOCK_USER, clearAuth: MOCK_CLEAR_AUTH });
  mockCheckQuota.mockResolvedValue({ allowed: remaining > 0, remaining });
  mockSignOut.mockResolvedValue(undefined);
}

beforeEach(() => {
  mockUseAuthStore.mockReset();
  mockCheckQuota.mockReset();
  mockSignOut.mockReset();
  MOCK_CLEAR_AUTH.mockReset();
});

describe('useProfile – loading state', () => {
  it('starts with loading=true before checkQuota resolves', () => {
    mockUseAuthStore.mockReturnValue({ user: MOCK_USER, clearAuth: MOCK_CLEAR_AUTH });
    mockCheckQuota.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useProfile());
    expect(result.current.loading).toBe(true);
  });

  it('sets loading=false after checkQuota resolves', async () => {
    setupMocks();
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.loading).toBe(false);
  });
});

describe('useProfile – user info', () => {
  it('returns email from user', async () => {
    setupMocks();
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.email).toBe('hanako@example.com');
  });

  it('returns displayName from user_metadata.full_name', async () => {
    setupMocks();
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.displayName).toBe('花子');
  });

  it('falls back to email prefix when full_name is missing', async () => {
    mockUseAuthStore.mockReturnValue({
      user: { ...MOCK_USER, user_metadata: { avatar_url: null } },
      clearAuth: MOCK_CLEAR_AUTH,
    });
    mockCheckQuota.mockResolvedValue({ allowed: true, remaining: 5 });
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.displayName).toBe('hanako');
  });

  it('returns avatarUrl as null when not set', async () => {
    setupMocks();
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.avatarUrl).toBeNull();
  });
});

describe('useProfile – quota', () => {
  it('computes quotaUsed = MONTHLY_QUOTA - remaining', async () => {
    setupMocks(3); // remaining=3 → used=2
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.quotaUsed).toBe(MONTHLY_QUOTA - 3);
    expect(result.current.quotaTotal).toBe(MONTHLY_QUOTA);
  });

  it('quotaUsed=0 when remaining equals MONTHLY_QUOTA', async () => {
    setupMocks(MONTHLY_QUOTA);
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.quotaUsed).toBe(0);
  });

  it('quotaUsed=MONTHLY_QUOTA when remaining=0', async () => {
    setupMocks(0);
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    expect(result.current.quotaUsed).toBe(MONTHLY_QUOTA);
  });
});

describe('useProfile – sign out', () => {
  it('calls signOut and clearAuth when handleSignOut is invoked', async () => {
    setupMocks();
    const { result } = renderHook(() => useProfile());
    await act(async () => { await flushPromises(); });
    await act(async () => { await result.current.handleSignOut(); });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(MOCK_CLEAR_AUTH).toHaveBeenCalledTimes(1);
  });
});
