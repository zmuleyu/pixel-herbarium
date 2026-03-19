import { supabase } from './supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';

const LINE_AUTH_DISCOVERY = {
  authorizationEndpoint: 'https://access.line.me/oauth2/v2.1/authorize',
  tokenEndpoint: 'https://api.line.me/oauth2/v2.1/token',
};

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) throw new Error('No identity token from Apple');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signInWithLine() {
  const LINE_CHANNEL_ID = process.env.EXPO_PUBLIC_LINE_CHANNEL_ID;
  if (!LINE_CHANNEL_ID) {
    throw new Error('LINE_CHANNEL_ID is not configured');
  }

  // LINE console requires an HTTPS callback URL.
  // auth-line-callback edge function receives LINE's redirect and bounces to the custom scheme.
  const redirectUri = 'https://uwdgnueaycatmkzkbxwo.supabase.co/functions/v1/auth-line-callback';

  const request = new AuthSession.AuthRequest({
    clientId: LINE_CHANNEL_ID,
    redirectUri,
    scopes: ['profile', 'openid'],
    responseType: AuthSession.ResponseType.Code,
    extraParams: { bot_prompt: 'normal' },
  });

  const result = await request.promptAsync(LINE_AUTH_DISCOVERY);
  if (result.type !== 'success' || !result.params.code) {
    throw new Error('LINE Login cancelled or failed');
  }

  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: LINE_CHANNEL_ID,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    LINE_AUTH_DISCOVERY,
  );

  if (!tokenResult.idToken) {
    throw new Error('No id_token received from LINE');
  }

  const idToken = tokenResult.idToken;

  // Verify token via edge function and get Supabase session
  const { data, error } = await supabase.functions.invoke('auth-line', {
    body: { id_token: idToken },
  });

  if (error) throw new Error(error.message ?? 'LINE authentication failed');

  // Account linking required — return context for the caller to show confirmation UI
  if (data?.requires_linking) {
    return {
      requires_linking: true as const,
      id_token: idToken,
      existing_user_id: data.existing_user_id as string,
      line_uid: data.line_uid as string,
    };
  }

  if (!data?.access_token) throw new Error('LINE authentication failed');

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  if (sessionError) throw sessionError;
  return { requires_linking: false as const };
}

/** Confirms account linking after user approval in the UI. */
export async function confirmLinkLine(idToken: string, existingUserId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('auth-line', {
    body: { id_token: idToken, confirm_link: true, existing_user_id: existingUserId },
  });

  if (error || !data?.access_token) {
    throw new Error(error?.message ?? 'LINE account linking failed');
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  if (sessionError) throw sessionError;
}
