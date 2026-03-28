# Codex Task 5: analytics.ts + auth.ts Service Tests

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (unit project — NOT screens)
- **Pattern**: Standard Jest mock + async (see `__tests__/services/antiCheat.test.ts` for reference)

## Objective
Write 2 test files for the analytics and auth services. Target: ~20 tests total.

## Prerequisites
1. Read `collab/specs/project-context.md` — note this is "unit" project, NOT "screens"
2. Read `collab/specs/mock-catalog.md` — Supabase mock stanza
3. Read `src/services/analytics.ts` — source
4. Read `src/services/auth.ts` — source
5. Read `__tests__/services/antiCheat.test.ts` — canonical service test reference
6. Read `__mocks__/supabase-js.js` — understand the chained mock

**Existing service tests**: antiCheat.test.ts, auth-line.test.ts, content-pack.test.ts — do NOT duplicate.

## Output Files
- `__tests__/services/analytics.test.ts`
- `__tests__/services/auth.test.ts`

## Test Cases

### analytics.ts (~5 tests)
Read the source first. Expected exports: `trackEvent(eventType, properties?)` or similar.
1. trackEvent calls supabase.from('analytics_events').insert()
2. trackEvent includes event_type in the insert payload
3. trackEvent includes properties object in payload
4. trackEvent defaults to empty object when no properties provided
5. trackEvent does not throw on insert error (fire-and-forget pattern)

Mock pattern:
```typescript
jest.mock('@/services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));
```

### auth.ts (~15 tests)
Read the source. Expected exports: signInWithEmail, signUpWithEmail, signOut, signInWithApple, signInWithLine, confirmLinkLine, etc.

**Email auth tests:**
1. signInWithEmail calls auth.signInWithPassword
2. signInWithEmail returns data on success
3. signInWithEmail throws on error
4. signUpWithEmail calls auth.signUp
5. signUpWithEmail returns data on success
6. signUpWithEmail throws on error

**Sign out:**
7. signOut calls auth.signOut
8. signOut throws on error

**Apple auth:**
9. signInWithApple calls signInWithIdToken with 'apple' provider
10. signInWithApple throws when no identity token provided

**LINE auth:**
11. signInWithLine calls exchangeCodeAsync (or similar OAuth flow)
12. signInWithLine throws when LINE_CHANNEL_ID not configured

**Link confirmation:**
13. confirmLinkLine calls supabase functions.invoke
14. confirmLinkLine throws on invoke error

**General:**
15. getCurrentSession returns supabase auth session

Mock patterns:
```typescript
// For Apple auth
jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn().mockResolvedValue({ identityToken: 'mock-token', fullName: { givenName: 'Test' } }),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

// For LINE auth
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'https://redirect'),
  exchangeCodeAsync: jest.fn().mockResolvedValue({ accessToken: 'line-tok' }),
  AuthRequest: jest.fn().mockImplementation(() => ({
    promptAsync: jest.fn().mockResolvedValue({ type: 'success', params: { code: 'line-code' } }),
  })),
}));
```

## Important Notes
- These are "unit" project tests (no shallowRender, no react-screen-test.js).
- Use `import { supabase } from '@/services/supabase'` after mock.
- Use standard `async/await` with `expect(...).resolves` / `expect(...).rejects`.
- Check the actual export names and function signatures in the source files before writing tests.

## Acceptance
```bash
npx jest __tests__/services/analytics.test.ts __tests__/services/auth.test.ts --ci
```
