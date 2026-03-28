# Codex Task 2: CheckinScreen + SettingsTabScreen Tests

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (screens project)
- **Pattern**: shallowRender (see `collab/specs/screen-test-pattern.md`)

## Objective
Write 2 test files. Target: ~20 tests total.

## Prerequisites
1. Read `collab/specs/screen-test-pattern.md` — MUST follow shallowRender pattern
2. Read `collab/specs/mock-catalog.md` — available mocks
3. Read `src/app/(tabs)/checkin.tsx` — source
4. Read `src/app/(tabs)/settings.tsx` — source
5. Read `__tests__/screens/DiscoverScreen.test.tsx` — reference

## Output Files
- `__tests__/screens/CheckinScreen.test.tsx`
- `__tests__/screens/SettingsTabScreen.test.tsx`

## Test Cases

### CheckinScreen (~10 tests)
1. renders container
2. shows step title for photo selection step
3. shows camera button
4. shows library/gallery button
5. shows back button (disabled on first step)
6. shows spot selector step when photo selected
7. shows stamp preview step
8. shows success overlay after completion
9. renders guide wrapper
10. shows cancel/close button

Use mutable mock for a step state (photo → spot → stamp → success).

### SettingsTabScreen (~10 tests)
1. renders container
2. shows screen title
3. shows version number (from expo-constants)
4. shows login button when no session
5. shows account info when session present
6. shows language selector (ja/en)
7. shows privacy policy link
8. shows sign out button when logged in
9. shows delete account button when logged in
10. shows export data option

Use mutable mock for auth-store toggling session presence.

## Key Mocks for CheckinScreen
```typescript
const mockStep = jest.fn(() => 'photo');
jest.mock('@/hooks/useCheckinPhoto', () => ({
  useCheckinPhoto: () => ({ pickFromCamera: jest.fn(), pickFromLibrary: jest.fn(), requesting: false, uri: null }),
}));
jest.mock('@/components/checkin/SpotSelector', () => ({ SpotSelector: 'SpotSelector' }));
jest.mock('@/components/stamps', () => ({ StampPreview: 'StampPreview' }));
jest.mock('@/components/CheckinSuccessOverlay', () => ({ CheckinSuccessOverlay: 'CheckinSuccessOverlay' }));
```

## Key Mocks for SettingsTabScreen
```typescript
const mockSession = jest.fn(() => ({ access_token: 'tok' }));
jest.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({ session: mockSession(), user: mockSession() ? { id: 'u1', email: 'test@test.com' } : null }),
}));
jest.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.1.0' } } }));
```

## Acceptance
```bash
npx jest __tests__/screens/CheckinScreen.test.tsx __tests__/screens/SettingsTabScreen.test.tsx --ci
```
