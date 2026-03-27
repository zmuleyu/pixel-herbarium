/**
 * Tests for auth service: email auth, Apple sign-in, sign-out, and LINE link confirmation.
 * signInWithLine is covered in auth-line.test.ts — not duplicated here.
 */

jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn().mockResolvedValue({
    identityToken: 'mock-apple-id-token',
    fullName: { givenName: 'Test' },
  }),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'https://redirect'),
  AuthRequest: jest.fn().mockImplementation(() => ({
    codeVerifier: 'verifier',
    promptAsync: jest.fn().mockResolvedValue({
      type: 'success',
      params: { code: 'line-code' },
    }),
  })),
  exchangeCodeAsync: jest.fn().mockResolvedValue({ idToken: 'line-id-tok' }),
  ResponseType: { Code: 'code' },
}));

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'u2' } }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      signInWithIdToken: jest.fn().mockResolvedValue({ data: { user: { id: 'u3' } }, error: null }),
      setSession: jest.fn().mockResolvedValue({ error: null }),
    },
    functions: {
      invoke: jest.fn().mockResolvedValue({
        data: { access_token: 'at', refresh_token: 'rt' },
        error: null,
      }),
    },
  },
}));

import { supabase } from '@/services/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  signInWithApple,
  confirmLinkLine,
} from '@/services/auth';

const mockAuth = supabase.auth as any;
const mockFunctions = supabase.functions as any;

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------- Email auth ----------

describe('signInWithEmail', () => {
  it('calls auth.signInWithPassword with email and password', async () => {
    await signInWithEmail('a@b.com', 'pass123');

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'pass123',
    });
  });

  it('returns data on success', async () => {
    const result = await signInWithEmail('a@b.com', 'pass123');
    expect(result).toEqual({ user: { id: 'u1' } });
  });

  it('throws on error', async () => {
    mockAuth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: new Error('Invalid credentials'),
    });

    await expect(signInWithEmail('a@b.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });
});

describe('signUpWithEmail', () => {
  it('calls auth.signUp with email and password', async () => {
    await signUpWithEmail('new@b.com', 'pass456');

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'new@b.com',
      password: 'pass456',
    });
  });

  it('returns data on success', async () => {
    const result = await signUpWithEmail('new@b.com', 'pass456');
    expect(result).toEqual({ user: { id: 'u2' } });
  });

  it('throws on error', async () => {
    mockAuth.signUp.mockResolvedValueOnce({
      data: null,
      error: new Error('Email taken'),
    });

    await expect(signUpWithEmail('dup@b.com', 'pass')).rejects.toThrow('Email taken');
  });
});

// ---------- Sign out ----------

describe('signOut', () => {
  it('calls auth.signOut', async () => {
    await signOut();
    expect(mockAuth.signOut).toHaveBeenCalled();
  });

  it('throws on error', async () => {
    mockAuth.signOut.mockResolvedValueOnce({ error: new Error('Session expired') });

    await expect(signOut()).rejects.toThrow('Session expired');
  });
});

// ---------- Apple auth ----------

describe('signInWithApple', () => {
  it('calls signInWithIdToken with apple provider and identity token', async () => {
    await signInWithApple();

    expect(mockAuth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'apple',
      token: 'mock-apple-id-token',
    });
  });

  it('returns data on success', async () => {
    const result = await signInWithApple();
    expect(result).toEqual({ user: { id: 'u3' } });
  });

  it('throws when no identity token from Apple', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValueOnce({
      identityToken: null,
      fullName: { givenName: 'Test' },
    });

    await expect(signInWithApple()).rejects.toThrow('No identity token from Apple');
  });

  it('throws when signInWithIdToken returns error', async () => {
    mockAuth.signInWithIdToken.mockResolvedValueOnce({
      data: null,
      error: new Error('Apple auth failed'),
    });

    await expect(signInWithApple()).rejects.toThrow('Apple auth failed');
  });
});

// ---------- confirmLinkLine ----------

describe('confirmLinkLine', () => {
  it('calls functions.invoke with confirm_link payload', async () => {
    await confirmLinkLine('id-token-abc', 'user-123');

    expect(mockFunctions.invoke).toHaveBeenCalledWith('auth-line', {
      body: {
        id_token: 'id-token-abc',
        confirm_link: true,
        existing_user_id: 'user-123',
      },
    });
  });

  it('sets session after successful linking', async () => {
    await confirmLinkLine('id-token-abc', 'user-123');

    expect(mockAuth.setSession).toHaveBeenCalledWith({
      access_token: 'at',
      refresh_token: 'rt',
    });
  });

  it('throws on invoke error', async () => {
    mockFunctions.invoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Linking failed' },
    });

    await expect(confirmLinkLine('tok', 'uid')).rejects.toThrow('Linking failed');
  });

  it('throws when no access_token returned', async () => {
    mockFunctions.invoke.mockResolvedValueOnce({
      data: { some_other_field: true },
      error: null,
    });

    await expect(confirmLinkLine('tok', 'uid')).rejects.toThrow('LINE account linking failed');
  });

  it('throws on setSession error', async () => {
    mockAuth.setSession.mockResolvedValueOnce({ error: new Error('Session set failed') });

    await expect(confirmLinkLine('tok', 'uid')).rejects.toThrow('Session set failed');
  });
});
