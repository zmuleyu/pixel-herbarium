# LINE Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add LINE Login as a third auth method, add deep link handling, and prepare OA infrastructure so every LINE Login user can be bridged to the Official Account.

**Architecture:** Custom Supabase Edge Function verifies LINE id_token (with nonce), creates/matches Supabase user, and returns session tokens. App uses `expo-auth-session` for OAuth PKCE flow. Deep links handled via Expo Router file-based routing + `getInitialURL()` cold-start check.

**Tech Stack:** Expo SDK 55 + expo-auth-session + expo-web-browser, Supabase Edge Functions (Deno), LINE Login API v2.1

**Spec:** `docs/superpowers/specs/2026-03-19-line-promotion-roadmap-design.md`

**Task classification:** Sync 监督型 (auth/core logic) — requires step-by-step review.

**Parallel note:** Task 9 (OA setup) is an operations task — start it on Day 1 in parallel with engineering tasks. LINE Login Channel review takes 1-2 weeks.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/migrations/022_line_metadata.sql` | Create | Add `line_uid` column, extend trigger |
| `supabase/functions/auth-line/index.ts` | Create | Verify LINE id_token+nonce, create/match user, return session |
| `src/services/auth.ts` | Modify | Add `signInWithLine()` |
| `src/app/(auth)/login.tsx` | Modify | Add LINE Login button |
| `src/app/_layout.tsx` | Modify | Add deep link handler |
| `src/app/invite/[code].tsx` | Create | Referral landing route |
| `src/utils/deep-link.ts` | Create | Deep link URL parser |
| `app.json` | Modify | Add plugins + LSApplicationQueriesSchemes |
| `src/i18n/ja.json` | Modify | Add LINE-related UI strings |
| `src/types/database.ts` | Regenerate | Add `line_uid` to profiles type |
| `__tests__/services/auth-line.test.ts` | Create | Unit tests for LINE auth flow |
| `__tests__/utils/deep-link.test.ts` | Create | Unit tests for deep link parsing |

---

## Task 1: Database Migration — `line_uid` Column

**Files:**
- Create: `supabase/migrations/022_line_metadata.sql`

- [ ] **Step 1: Read current trigger definition**

Run: `npx supabase db execute "SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'"`
Verify the current trigger body before extending it.

- [ ] **Step 2: Write the migration**

```sql
-- Migration 022: LINE OAuth metadata
-- Adds line_uid to profiles for bridging app users to LINE Official Account.
-- IMPORTANT: Extends handle_new_user() — preserves existing full_name extraction.

ALTER TABLE profiles ADD COLUMN line_uid TEXT UNIQUE;
CREATE INDEX idx_profiles_line_uid ON profiles(line_uid);

-- Extend (not replace) trigger to also extract line_uid from user metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, line_uid)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    NEW.raw_user_meta_data->>'line_uid'
  )
  ON CONFLICT (id) DO UPDATE SET
    line_uid = COALESCE(EXCLUDED.line_uid, profiles.line_uid);
  RETURN NEW;
END;
$$;
```

Note: `ON CONFLICT ... DO UPDATE` handles the case where a profile already exists (e.g., account linking). `line_uid` is nullable — only populated for LINE Login users.

- [ ] **Step 3: Apply migration**

Run: `cd D:/projects/Games/gardern/pixel-herbarium && npx supabase migration up`
Expected: Migration 022 applied.

- [ ] **Step 4: Verify**

Run: `npx supabase db execute "SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='line_uid'"`
Expected: `line_uid` row returned.

- [ ] **Step 5: Regenerate TypeScript types**

Run: `npx supabase gen types typescript --project-id uwdgnueaycatmkzkbxwo > src/types/database.ts`
Verify `line_uid` appears in the generated `profiles` type.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/022_line_metadata.sql src/types/database.ts
git commit -m "feat(db): add line_uid column to profiles for LINE OAuth bridge"
```

---

## Task 2: Auth-LINE Edge Function

**Files:**
- Create: `supabase/functions/auth-line/index.ts`

- [ ] **Step 1: Create the edge function**

```typescript
// supabase/functions/auth-line/index.ts
// Verifies LINE id_token + nonce, creates or matches a Supabase user,
// returns {access_token, refresh_token} for the app to call setSession().

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SignJWT, importPKCS8 } from 'https://deno.land/x/jose@v5.2.0/index.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET')!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface LineTokenPayload {
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
}

async function verifyLineToken(idToken: string, nonce?: string): Promise<LineTokenPayload> {
  const channelId = Deno.env.get('LINE_CHANNEL_ID');
  if (!channelId) throw new Error('LINE_CHANNEL_ID not configured');

  const params: Record<string, string> = { id_token: idToken, client_id: channelId };
  if (nonce) params.nonce = nonce;

  const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LINE token verification failed: ${err}`);
  }

  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const { id_token, nonce } = await req.json();
    if (!id_token) {
      return Response.json(
        { error: 'id_tokenが必要です' },
        { status: 400 },
      );
    }

    // 1. Verify LINE token (with nonce if provided)
    const payload = await verifyLineToken(id_token, nonce);
    const lineUid = payload.sub;

    // 2. Check if user with this line_uid already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('line_uid', lineUid)
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      // Returning LINE user
      userId = existingProfile.id;
    } else {
      // Check if a user with matching verified email already exists (account linking)
      if (payload.email && payload.email_verified) {
        const { data: emailUser } = await supabase.auth.admin.listUsers();
        const matchedUser = emailUser?.users?.find(
          (u) => u.email === payload.email
        );

        if (matchedUser) {
          // Email match found — return special response for client-side confirmation
          return Response.json({
            requires_linking: true,
            existing_user_id: matchedUser.id,
            line_uid: lineUid,
            line_name: payload.name,
            message: 'このメールアドレスのアカウントが見つかりました。統合しますか？',
          });
        }
      }

      // No match — create new user
      const email = (payload.email && payload.email_verified)
        ? payload.email
        : `line_${lineUid}@line.users.noreply`;

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: payload.name ?? '',
          avatar_url: payload.picture ?? '',
          line_uid: lineUid,
          provider: 'line',
        },
      });

      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // 3. Generate session via custom JWT (no fragile magic link parsing)
    const now = Math.floor(Date.now() / 1000);
    const secret = new TextEncoder().encode(JWT_SECRET);

    const accessToken = await new SignJWT({
      sub: userId,
      role: 'authenticated',
      aud: 'authenticated',
      iss: `${SUPABASE_URL}/auth/v1`,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600) // 1 hour
      .sign(secret);

    // For refresh, generate a magic link and extract hashed_token
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userData.user?.email ?? '';

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });
    if (linkError) throw linkError;

    // Use hashed_token directly (available in Supabase v2.40+)
    const hashedToken = linkData.properties?.hashed_token;

    return Response.json({
      access_token: accessToken,
      refresh_token: hashedToken ?? '', // client can re-auth if empty
      user: { id: userId, email: userEmail },
    });
  } catch (err: any) {
    console.error('auth-line error:', err);
    return Response.json(
      { error: '接続できませんでした。もう一度お試しください' },
      { status: 401 },
    );
  }
});
```

- [ ] **Step 2: Set secrets**

```bash
npx supabase secrets set LINE_CHANNEL_ID=<channel-id>
npx supabase secrets set SUPABASE_JWT_SECRET=<jwt-secret-from-supabase-dashboard>
```

- [ ] **Step 3: Test locally**

Run: `npx supabase functions serve auth-line`
```bash
curl -X POST http://localhost:54321/functions/v1/auth-line \
  -H "Content-Type: application/json" \
  -d '{"id_token": "invalid"}'
```
Expected: 401 with `"接続できませんでした。もう一度お試しください"`

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/auth-line/index.ts
git commit -m "feat(auth): add auth-line edge function with nonce validation and account linking"
```

---

## Task 3: App Dependencies + app.json Config

**Files:**
- Modify: `app.json`
- Modify: `package.json` (via expo install)

- [ ] **Step 1: Install dependencies**

Run: `cd D:/projects/Games/gardern/pixel-herbarium && npx expo install expo-auth-session expo-web-browser`

- [ ] **Step 2: Update app.json**

Add to `plugins` array (after `"expo-font"`):
```json
"expo-auth-session",
"expo-web-browser"
```

Add `"LSApplicationQueriesSchemes": ["line"]` to `ios.infoPlist` (alongside existing entries).

- [ ] **Step 3: Verify**

Run: `npx expo config --type public 2>&1 | head -5`
Expected: No parse errors.

- [ ] **Step 4: Commit**

```bash
git add package.json app.json
git commit -m "feat(deps): add expo-auth-session and expo-web-browser for LINE Login"
```

---

## Task 4: LINE Login Service Function

**Files:**
- Modify: `src/services/auth.ts`
- Create: `__tests__/services/auth-line.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// __tests__/services/auth-line.test.ts
import { supabase } from '@/services/supabase';

// Must mock before importing auth module
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
    (supabase.functions.invoke as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid token' },
    });

    await expect(signInWithLine()).rejects.toThrow('Invalid token');
  });

  it('throws when user cancels LINE Login', async () => {
    const { AuthRequest } = require('expo-auth-session');
    AuthRequest.mockImplementationOnce(() => ({
      codeVerifier: 'v',
      promptAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
    }));

    await expect(signInWithLine()).rejects.toThrow('LINE Login cancelled or failed');
  });
});
```

- [ ] **Step 2: Run test — verify fails**

Run: `cd D:/projects/Games/gardern/pixel-herbarium && npx jest __tests__/services/auth-line.test.ts --no-cache`
Expected: FAIL — `signInWithLine` not exported

- [ ] **Step 3: Implement signInWithLine()**

Add to top of `src/services/auth.ts`:
```typescript
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
```

Add after existing imports, before functions:
```typescript
const LINE_CHANNEL_ID = process.env.EXPO_PUBLIC_LINE_CHANNEL_ID;

const LINE_AUTH_DISCOVERY = {
  authorizationEndpoint: 'https://access.line.me/oauth2/v2.1/authorize',
  tokenEndpoint: 'https://api.line.me/oauth2/v2.1/token',
};
```

Add after `signOut()`:
```typescript
export async function signInWithLine() {
  if (!LINE_CHANNEL_ID) {
    throw new Error('LINE_CHANNEL_ID is not configured');
  }

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'pixelherbarium',
    path: 'auth/line/callback',
  });

  const request = new AuthSession.AuthRequest({
    clientId: LINE_CHANNEL_ID,
    redirectUri,
    scopes: ['profile', 'openid', 'email'],
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

  // Verify token via edge function and get Supabase session
  const { data, error } = await supabase.functions.invoke('auth-line', {
    body: { id_token: tokenResult.idToken },
  });

  if (error || !data?.access_token) {
    throw new Error(error?.message ?? 'LINE authentication failed');
  }

  // Account linking: if edge function says linking is needed, throw with context
  if (data.requires_linking) {
    throw new Error(`LINK_REQUIRED:${data.existing_user_id}:${data.line_uid}`);
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  if (sessionError) throw sessionError;
  return data;
}
```

Note: `WebBrowser.maybeCompleteAuthSession()` should be called in `login.tsx`, not here.

- [ ] **Step 4: Run test — verify passes**

Run: `npx jest __tests__/services/auth-line.test.ts --no-cache`
Expected: PASS (4 tests)

- [ ] **Step 5: Run all tests**

Run: `npx jest --no-cache`
Expected: All pass.

- [ ] **Step 6: Commit**

```bash
git add src/services/auth.ts __tests__/services/auth-line.test.ts
git commit -m "feat(auth): add signInWithLine() with LINE OAuth PKCE flow"
```

---

## Task 5: Login Screen — LINE Button

**Files:**
- Modify: `src/app/(auth)/login.tsx`
- Modify: `src/i18n/ja.json`

- [ ] **Step 1: Add i18n keys**

Add to `src/i18n/ja.json` under `"auth"`:
```json
"lineLogin": "LINEで続ける",
"lineError": "LINE接続に失敗しました"
```

- [ ] **Step 2: Update login.tsx**

Add imports:
```typescript
import { signInWithLine } from '@/services/auth';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
```

Add handler after `handleEmail`:
```typescript
async function handleLine() {
  try {
    setSubmitting(true);
    await signInWithLine();
  } catch (e: any) {
    if (e.message !== 'LINE Login cancelled or failed') {
      setError(e.message);
      Alert.alert(t('auth.lineError'), e.message);
    }
    setSubmitting(false);
  }
}
```

Add LINE button in JSX — **after Apple button on iOS, LINE is first on Android**:
```tsx
{/* LINE Login */}
<TouchableOpacity
  style={[styles.lineButton, submitting && styles.buttonDisabled]}
  onPress={handleLine}
  disabled={submitting}
  testID="auth.line"
>
  <Text style={styles.lineButtonText}>{t('auth.lineLogin')}</Text>
</TouchableOpacity>
```

Final JSX order in the `inner` View:
1. title + subtitle
2. Apple button (iOS only, already wrapped in `Platform.OS === 'ios'`)
3. **LINE button** (always visible — appears first on Android since Apple is hidden)
4. divider
5. email/password fields + sign in button

Add styles:
```typescript
lineButton: {
  width: '100%',
  height: 48,
  backgroundColor: '#06C755',
  borderRadius: borderRadius.md,
  alignItems: 'center',
  justifyContent: 'center',
},
lineButtonText: {
  color: '#ffffff',
  fontFamily: typography.fontFamily.display,
  fontSize: typography.fontSize.md,
  fontWeight: '600' as const,
},
```

- [ ] **Step 3: Verify**

Run: `npx expo start` → open login screen
Expected: LINE green button visible with "LINEで続ける" text.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(auth\)/login.tsx src/i18n/ja.json
git commit -m "feat(ui): add LINE Login button to login screen"
```

---

## Task 6: Deep Link Handler

**Files:**
- Create: `src/utils/deep-link.ts`
- Create: `__tests__/utils/deep-link.test.ts`
- Modify: `src/app/_layout.tsx`

- [ ] **Step 1: Write tests**

```typescript
// __tests__/utils/deep-link.test.ts
import { parseDeepLink } from '@/utils/deep-link';

describe('parseDeepLink', () => {
  it('parses custom scheme plant link', () => {
    expect(parseDeepLink('pixelherbarium://plant/42')).toEqual({ type: 'plant', id: '42' });
  });

  it('parses custom scheme spot link', () => {
    expect(parseDeepLink('pixelherbarium://spot/5')).toEqual({ type: 'spot', id: '5' });
  });

  it('parses custom scheme invite link', () => {
    expect(parseDeepLink('pixelherbarium://invite/abc123')).toEqual({ type: 'invite', code: 'abc123' });
  });

  it('parses universal link (https)', () => {
    expect(parseDeepLink('https://pixelherbarium.app/plant/42')).toEqual({ type: 'plant', id: '42' });
  });

  it('strips query params', () => {
    expect(parseDeepLink('pixelherbarium://plant/42?ref=line')).toEqual({ type: 'plant', id: '42' });
  });

  it('returns null for unknown type', () => {
    expect(parseDeepLink('pixelherbarium://unknown/path')).toBeNull();
  });

  it('returns null for empty/null', () => {
    expect(parseDeepLink(null)).toBeNull();
    expect(parseDeepLink('')).toBeNull();
    expect(parseDeepLink(undefined)).toBeNull();
  });

  it('returns null for malformed URL', () => {
    expect(parseDeepLink('pixelherbarium://')).toBeNull();
    expect(parseDeepLink('not-a-url')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test — verify fails**

Run: `npx jest __tests__/utils/deep-link.test.ts --no-cache`
Expected: FAIL — module not found

- [ ] **Step 3: Implement parseDeepLink**

Create `src/utils/deep-link.ts`:

```typescript
export type DeepLinkTarget =
  | { type: 'plant'; id: string }
  | { type: 'spot'; id: string }
  | { type: 'invite'; code: string };

export function parseDeepLink(url: string | null | undefined): DeepLinkTarget | null {
  if (!url) return null;

  try {
    const normalized = url
      .replace('pixelherbarium://', 'https://pixelherbarium.app/')
      .replace(/\?.*$/, '');

    const { pathname } = new URL(normalized);
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length < 2) return null;

    const [type, value] = segments;

    switch (type) {
      case 'plant': return { type: 'plant', id: value };
      case 'spot':  return { type: 'spot', id: value };
      case 'invite': return { type: 'invite', code: value };
      default: return null;
    }
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test — verify passes**

Run: `npx jest __tests__/utils/deep-link.test.ts --no-cache`
Expected: PASS (8 tests)

- [ ] **Step 5: Add deep link handler to _layout.tsx**

Add imports:
```typescript
import * as Linking from 'expo-linking';
import { parseDeepLink } from '@/utils/deep-link';
```

Add handler function inside `RootLayout`, after `usePushToken()`:
```typescript
function handleDeepLinkTarget(target: ReturnType<typeof parseDeepLink>) {
  if (!target) return;
  switch (target.type) {
    case 'plant':
      router.push(`/plant/${target.id}` as any);
      break;
    case 'spot':
      router.push('/(tabs)/map' as any);
      break;
    case 'invite':
      router.push(`/invite/${target.code}` as any);
      break;
  }
}
```

Add useEffect after the push notification handler (after line 48):
```typescript
useEffect(() => {
  Linking.getInitialURL().then((url) => {
    const target = parseDeepLink(url);
    if (target) handleDeepLinkTarget(target);
  });

  const sub = Linking.addEventListener('url', ({ url }) => {
    const target = parseDeepLink(url);
    if (target) handleDeepLinkTarget(target);
  });

  return () => sub.remove();
}, []);
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/deep-link.ts __tests__/utils/deep-link.test.ts src/app/_layout.tsx
git commit -m "feat(nav): add deep link handler for plant/spot/invite URLs"
```

---

## Task 7: Invite Route

**Files:**
- Create: `src/app/invite/[code].tsx`
- Modify: `src/i18n/ja.json`

- [ ] **Step 1: Create route + i18n key**

Create `src/app/invite/[code].tsx`:
```typescript
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing } from '@/constants/theme';

export default function InviteScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    // TODO Phase 2: Record referral in share_records
    const timer = setTimeout(() => router.replace('/(tabs)/home'), 2000);
    return () => clearTimeout(timer);
  }, [code]);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🌸</Text>
      <Text style={styles.message}>{t('invite.welcome')}</Text>
      <ActivityIndicator color={colors.plantPrimary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  message: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text, textAlign: 'center', lineHeight: typography.fontSize.lg * typography.lineHeight },
  spinner: { marginTop: spacing.lg },
});
```

Add to `src/i18n/ja.json`:
```json
"invite": {
  "welcome": "花めぐりへようこそ\n素敵な花との出会いが\nあなたを待っています"
}
```

- [ ] **Step 2: Verify**

Run: `npx expo start` → deep link to `pixelherbarium://invite/test123`
Expected: Welcome screen → redirect to home after 2s.

- [ ] **Step 3: Commit**

```bash
git add src/app/invite/\[code\].tsx src/i18n/ja.json
git commit -m "feat(nav): add invite route for referral deep links"
```

---

## Task 8: EAS Build + Env Config

- [ ] **Step 1: Add env var locally**

Create/update `.env.local`:
```
EXPO_PUBLIC_LINE_CHANNEL_ID=<channel-id-from-task-9>
```

- [ ] **Step 2: Add to EAS secrets**

Run: `npx eas secret:create --name EXPO_PUBLIC_LINE_CHANNEL_ID --value <channel-id> --scope project`

- [ ] **Step 3: Run all tests**

Run: `npx jest --no-cache`
Expected: All pass (existing + 4 auth-line + 8 deep-link).

- [ ] **Step 4: EAS preview build**

Run: `npx eas build --profile preview --platform ios`
Required because `expo-auth-session` and `expo-web-browser` have native code.

- [ ] **Step 5: Commit**

```bash
git add .env.local
git commit -m "chore: add LINE env config for EAS builds"
```

---

## Task 9 (Operations — Start Day 1): LINE Official Account Setup

**This is NOT a coding task.** Run in parallel with Tasks 1-8.

- [ ] **Step 1**: Create LINE Official Account at https://manager.line.biz/
  - Name: `花めぐり — Pixel Herbarium` · Category: Lifestyle > Hobby · Plan: Free

- [ ] **Step 2**: Create LINE Login Channel at https://developers.line.biz/
  - Link to OA · Enable OpenID Connect
  - Callback: `pixelherbarium://auth/line/callback`
  - **Copy Channel ID → use in Task 2 (secret) and Task 8 (env var)**

- [ ] **Step 3**: Create Messaging API Channel (same provider)
  - Link to OA · Note Channel Access Token for Phase 2

- [ ] **Step 4**: Design Rich Menu (2500x843px)
  - BG: `#f5f4f1` · Text: `#3a3a3a` · Accent: `#9fb69f`
  - 3 zones: 今日の桜 | アプリを開く | 花言葉辞典

- [ ] **Step 5**: Set welcome message:
  ```
  花めぐりへようこそ 🌸
  季節の花を見つけて、足跡を残す小さな旅。
  桜の便りや花言葉を時々お届けします。
  📱 アプリはこちら → [App Store link]
  ```

---

## Verification Checklist

- [ ] `profiles.line_uid` column exists and is unique-indexed
- [ ] `src/types/database.ts` includes `line_uid` in profiles type
- [ ] `auth-line` edge function returns 401 for invalid tokens (Japanese error message)
- [ ] `auth-line` returns `requires_linking` for matching verified email
- [ ] `signInWithLine()` exported and tested (4 tests pass)
- [ ] `parseDeepLink()` tested (8 tests pass)
- [ ] Login screen: LINE green button visible (iOS: after Apple; Android: first)
- [ ] Deep link `pixelherbarium://plant/1` → plant detail
- [ ] Deep link `pixelherbarium://invite/test` → welcome → home
- [ ] EAS preview build installs and LINE button tappable
- [ ] LINE Login OAuth completes on test device (LINE app required)
- [ ] After LINE Login, `profiles.line_uid` populated
- [ ] All tests pass: `npx jest --no-cache`

---

## Next Phase

Phase 1 complete → proceed to Phase 2 plan:
- Enhanced ShareSheet with LINE direct share + deep link URLs
- `share_records` migration + tracking
- OA Flex Message templates
- Viral loop referral attribution
