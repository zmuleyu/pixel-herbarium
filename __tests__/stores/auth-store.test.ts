// Mock Supabase before importing the store
jest.mock('../../src/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signOut: jest.fn(),
    },
  },
}));

import { useAuthStore } from '../../src/stores/auth-store';

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useAuthStore.setState({ user: null, session: null, loading: false, error: null });
  });

  it('starts with null user and session', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
  });

  it('starts with loading false', () => {
    const state = useAuthStore.getState();
    expect(state.loading).toBe(false);
  });

  it('starts with no error', () => {
    const state = useAuthStore.getState();
    expect(state.error).toBeNull();
  });

  it('setUser updates user in state', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    useAuthStore.getState().setUser(mockUser as never);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('setLoading updates loading state', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().loading).toBe(true);
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('setError updates error state', () => {
    useAuthStore.getState().setError('Something went wrong');
    expect(useAuthStore.getState().error).toBe('Something went wrong');
  });

  it('clearAuth resets user and session to null', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    useAuthStore.setState({ user: mockUser as never, session: {} as never });
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
  });
});
