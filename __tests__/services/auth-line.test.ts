// __tests__/services/auth-line.test.ts
import { supabase } from '@/services/supabase';

// Must mock before importing auth module
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'pixelherbarium://auth/line/callback'),
  AuthRequest: jest.fn().mockImplementation(() => ({
    codeVerifier: 'test-verifier',
    promptAsync: jest.fn().mockResolvedValue({
      type: 'success',
      params: { code: 'test-code' },
    }),
  })),
  exchangeCodeAsync: jest.fn().mockResolvedValue({
    idToken: 'test-id-token',
  }),
  ResponseType: { Code: 'code' },
}));
jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));
jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      setSession: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
    },
    functions: {
      invoke: jest.fn().mockResolvedValue({
        data: { access_token: 'at', refresh_token: 'rt', user: { id: '1' } },
        error: null,
      }),
    },
  },
}));

// Import after mocks
import { signInWithLine } from '@/services/auth';

describe('signInWithLine', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is exported as a function', () => {
    expect(typeof signInWithLine).toBe('function');
  });

  it('calls edge function with id_token and sets session', async () => {
    // Need to set env var for the function to work
    process.env.EXPO_PUBLIC_LINE_CHANNEL_ID = 'test-channel-id';

    await signInWithLine();

    expect(supabase.functions.invoke).toHaveBeenCalledWith('auth-line', {
      body: { id_token: 'test-id-token' },
    });
    expect(supabase.auth.setSession).toHaveBeenCalledWith({
      access_token: 'at',
      refresh_token: 'rt',
    });
  });

  it('throws on edge function error', async () => {
    process.env.EXPO_PUBLIC_LINE_CHANNEL_ID = 'test-channel-id';
    (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid token' },
    });

    await expect(signInWithLine()).rejects.toThrow('Invalid token');
  });

  it('throws when user cancels LINE Login', async () => {
    process.env.EXPO_PUBLIC_LINE_CHANNEL_ID = 'test-channel-id';
    const { AuthRequest } = require('expo-auth-session');
    AuthRequest.mockImplementationOnce(() => ({
      codeVerifier: 'v',
      promptAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
    }));

    await expect(signInWithLine()).rejects.toThrow('LINE Login cancelled or failed');
  });
});
