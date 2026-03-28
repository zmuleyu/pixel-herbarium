# Codex Task 13: Integration Smoke Tests

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (unit project)

## Objective
Write 2 integration test files that test cross-module data flows. Target: ~10 tests.

## Prerequisites
1. Read `src/stores/auth-store.ts`
2. Read `src/stores/checkin-store.ts`
3. Read `src/services/auth.ts`
4. Read `src/utils/deep-link.ts`
5. Read `collab/specs/mock-catalog.md`

## Output Files
- `__tests__/integration/auth-flow.test.ts`
- `__tests__/integration/checkin-flow.test.ts`

Note: Create `__tests__/integration/` directory.

## Test Cases

### auth-flow (~5 tests)
1. Auth store hydrates session from Supabase getSession
2. Auth store clears on signOut
3. Auth store user is null before login
4. Auth store updates user after successful sign-in mock
5. onAuthStateChange callback updates store

### checkin-flow (~5 tests)
1. Checkin store starts with empty history
2. addCheckin adds item to history
3. loadHistory populates from Supabase
4. History persists across store calls (getState roundtrip)
5. Total count reflects history length

## Important Notes
- These test real store interactions with mocked Supabase.
- Import stores directly and use `getState()` / `setState()` for testing.
- Mock Supabase at module level as usual.
- Reset stores in `beforeEach`.

## Acceptance
```bash
npx jest __tests__/integration/ --ci
```
