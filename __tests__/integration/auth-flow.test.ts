// __tests__/integration/auth-flow.test.ts
// Integration smoke tests: auth store ↔ Supabase session hydration

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
      signInWithPassword: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  },
}));

import { useAuthStore } from '../../src/stores/auth-store';
import { supabase } from '../../src/services/supabase';
import type { Session, User } from '@supabase/supabase-js';

// ── Helpers ────────────────────────────────────────────────────────────────────

const makeMockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-001',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }) as User;

const makeMockSession = (overrides: Partial<Session> = {}): Session =>
  ({
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    user: makeMockUser(),
    ...overrides,
  }) as Session;

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Auth Flow Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      loading: true,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('user is null before login', () => {
    const { user, session } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(session).toBeNull();
  });

  it('hydrates session from Supabase getSession', async () => {
    const mockSession = makeMockSession();
    (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: mockSession },
      error: null,
    });

    // Simulate app bootstrap: fetch session then update store
    const { data } = await supabase.auth.getSession();
    const session = data.session as Session;
    useAuthStore.getState().setSession(session);
    useAuthStore.getState().setUser(session.user);
    useAuthStore.getState().setLoading(false);

    const state = useAuthStore.getState();
    expect(state.session).toBe(mockSession);
    expect(state.user?.id).toBe('user-001');
    expect(state.loading).toBe(false);
  });

  it('clears auth state on signOut', async () => {
    // Pre-populate auth state
    const mockSession = makeMockSession();
    useAuthStore.setState({
      user: mockSession.user,
      session: mockSession,
      loading: false,
      error: null,
    });

    (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({ error: null });

    await supabase.auth.signOut();
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.error).toBeNull();
  });

  it('updates user after successful sign-in mock', async () => {
    const mockUser = makeMockUser({ id: 'user-signin' });
    const mockSession = makeMockSession({ user: mockUser });

    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      data: { session: mockSession, user: mockUser },
      error: null,
    });

    const { data } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });

    useAuthStore.getState().setSession(data.session);
    useAuthStore.getState().setUser(data.user);
    useAuthStore.getState().setLoading(false);

    const state = useAuthStore.getState();
    expect(state.user?.id).toBe('user-signin');
    expect(state.session?.access_token).toBe('mock-access-token');
  });

  it('onAuthStateChange callback updates store', () => {
    const mockUser = makeMockUser({ id: 'user-callback' });
    const mockSession = makeMockSession({ user: mockUser });

    // Capture the callback passed to onAuthStateChange
    let capturedCallback: (event: string, session: Session | null) => void = () => {};
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    // Register listener (simulates app bootstrap)
    supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      if (session) {
        useAuthStore.getState().setSession(session);
        useAuthStore.getState().setUser(session.user);
      } else {
        useAuthStore.getState().clearAuth();
      }
    });

    // Simulate auth event firing
    capturedCallback('SIGNED_IN', mockSession);

    const state = useAuthStore.getState();
    expect(state.user?.id).toBe('user-callback');
    expect(state.session).toBe(mockSession);
  });
});
