# Codex Task 4: Layout + Simple Screen Tests

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (screens project)
- **Pattern**: shallowRender (see `collab/specs/screen-test-pattern.md`)

## Objective
Write 5 test files for layout screens and simple pages. Target: ~22 tests total.

## Prerequisites
1. Read `collab/specs/screen-test-pattern.md`
2. Read `collab/specs/mock-catalog.md`
3. Read `src/app/(tabs)/_layout.tsx` — tab layout
4. Read `src/app/privacy.tsx`
5. Read `src/app/invite/[code].tsx`
6. Read `src/app/friend/[id].tsx`
7. Read `src/app/settings.tsx` — standalone settings (NOT the tab one)

## Output Files
- `__tests__/screens/TabLayout.test.tsx`
- `__tests__/screens/SettingsScreen.test.tsx`
- `__tests__/screens/PrivacyScreen.test.tsx`
- `__tests__/screens/InviteScreen.test.tsx`
- `__tests__/screens/FriendScreen.test.tsx`

## Test Cases

### TabLayout (~5 tests)
1. renders without crash
2. renders tab configuration (Tabs.Screen elements)
3. renders home tab
4. renders checkin tab
5. renders settings tab

Mock expo-router Tabs heavily:
```typescript
jest.mock('expo-router', () => ({
  Tabs: Object.assign(({ children }: any) => children, { Screen: (props: any) => JSON.stringify(props) }),
  useRouter: () => ({ push: jest.fn() }),
  useSegments: () => ['(tabs)'],
}));
```

### SettingsScreen (~4 tests)
Note: Check if `src/app/settings.tsx` exists as a standalone route (separate from tab settings). If it's just a redirect, test the redirect. If it has content, test that.
1. renders container
2. shows title
3. shows settings items
4. renders navigation back

### PrivacyScreen (~5 tests)
1. renders container
2. shows title (privacy/settings related i18n key)
3. shows data export button
4. shows account deletion section
5. shows loading state

### InviteScreen (~4 tests)
1. renders container
2. shows welcome/invite message
3. reads code from useLocalSearchParams
4. handles invalid/missing code gracefully

Mock:
```typescript
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ code: 'ABC123' }),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  Redirect: 'Redirect',
}));
```

### FriendScreen (~4 tests)
1. renders container
2. shows loading state initially
3. renders friend name when loaded
4. renders herbarium/collection grid

Mock:
```typescript
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'friend-1' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock('@/hooks/useFriends', () => ({
  useFriends: () => ({ friends: [{ id: 'friend-1', display_name: '花子' }], loading: false }),
}));
```

## Acceptance
```bash
npx jest __tests__/screens/TabLayout.test.tsx __tests__/screens/SettingsScreen.test.tsx __tests__/screens/PrivacyScreen.test.tsx __tests__/screens/InviteScreen.test.tsx __tests__/screens/FriendScreen.test.tsx --ci
```
