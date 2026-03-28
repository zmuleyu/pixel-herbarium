# Codex Task 1: HomeScreen + FootprintScreen Tests

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (screens project)
- **Pattern**: shallowRender (see `collab/specs/screen-test-pattern.md`)

## Objective
Write 2 test files for the Home and Footprint tab screens. Target: ~18 tests total.

## Prerequisites
1. Read `collab/specs/project-context.md` — understand Jest dual-project config
2. Read `collab/specs/screen-test-pattern.md` — the shallowRender pattern (MUST follow exactly)
3. Read `collab/specs/mock-catalog.md` — available mock stanzas
4. Read `src/app/(tabs)/home.tsx` — source to test
5. Read `src/app/(tabs)/footprint.tsx` — source to test
6. Read `__tests__/screens/DiscoverScreen.test.tsx` — canonical reference

**Existing tests NOT to duplicate**: DiscoverScreen, HerbariumScreen, LoginScreen, MapScreen, PlantDetail, ProfileScreen, SocialScreen.

## Output Files
- `__tests__/screens/HomeScreen.test.tsx`
- `__tests__/screens/FootprintScreen.test.tsx`

## Test Cases

### HomeScreen (~10 tests)
1. renders container (output is not null/empty)
2. shows season emoji from getActiveSeason
3. shows CTA text (i18n key like `home.captureCta` or similar — check source)
4. shows diary section title
5. shows empty state when checkin history is empty
6. shows diary count when history has items
7. calls loadHistory on mount (verify mock was set up — since useEffect is no-op in screens, just verify the mock structure)
8. renders seasonal background/gradient
9. shows greeting text
10. renders navigation elements (discover button / capture button)

### FootprintScreen (~8 tests)
1. renders container
2. shows title (i18n key `footprint.title` or similar)
3. shows empty state emoji + message when no history
4. shows CTA button in empty state
5. shows grid/list when history has items
6. shows total count badge
7. renders season filter if present
8. renders stamp thumbnail items

## Mock Setup Pattern

For both screens, you'll likely need:
```typescript
jest.mock('@/stores/checkin-store', () => {
  const mockHistory: any[] = [];
  return {
    useCheckinStore: () => ({
      history: mockHistory,
      loadHistory: jest.fn(),
      totalCount: mockHistory.length,
    }),
  };
});
```

Use **mutable mock** pattern (like `mockUseCapture` in DiscoverScreen) to toggle between empty and populated states per test.

Also mock: `@/constants/seasons`, `@/constants/theme`, `expo-linear-gradient`, `@/components/guide`, `react-i18next`, `expo-router`.

## Acceptance
```bash
npx jest __tests__/screens/HomeScreen.test.tsx __tests__/screens/FootprintScreen.test.tsx --ci
```
Expected: all tests pass, 0 failures.

## sessions.jsonl
```json
{"date":"2026-03-28","task":"screens-r1-home-footprint","tests":18,"passed":18,"duration_s":0,"agent":"codex","file":"__tests__/screens/HomeScreen.test.tsx,__tests__/screens/FootprintScreen.test.tsx","status":"pass"}
```
