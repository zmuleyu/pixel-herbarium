# Codex Task 3: OnboardingScreen + GuideScreen + RecapScreen Tests

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (screens project)
- **Pattern**: shallowRender (see `collab/specs/screen-test-pattern.md`)

## Objective
Write 3 test files. Target: ~18 tests total.

## Prerequisites
1. Read `collab/specs/screen-test-pattern.md`
2. Read `collab/specs/mock-catalog.md`
3. Read `src/app/onboarding.tsx`
4. Read `src/app/guide.tsx`
5. Read `src/app/recap.tsx`
6. Read `__tests__/screens/DiscoverScreen.test.tsx` — reference

## Output Files
- `__tests__/screens/OnboardingScreen.test.tsx`
- `__tests__/screens/GuideScreen.test.tsx`
- `__tests__/screens/RecapScreen.test.tsx`

## Test Cases

### OnboardingScreen (~7 tests)
1. renders container
2. shows skip button text
3. renders slide content (first slide)
4. renders dot indicators
5. shows Next button
6. shows Get Started / finish button on last slide (use mutable mock for page index)
7. renders gradient background

Mock:
```typescript
jest.mock('@/hooks/useOnboardingControls', () => ({
  useOnboardingControls: () => ({
    page: 0, scrollRef: { current: null },
    slideAnims: [{ opacity: 1, transform: [] }],
    dotAnim: { width: 10 },
    goNext: jest.fn(), goBack: jest.fn(), finish: jest.fn(),
    onSwipeEnd: jest.fn(),
  }),
}));
```

### GuideScreen (~5 tests)
1. renders container
2. shows feature cards (check for guide-related i18n keys)
3. shows reset single guide button
4. shows reset all guides button
5. renders navigation header

Mock: `@/utils/guide-storage`, `expo-router` Stack.

### RecapScreen (~6 tests)
1. shows loading indicator when loading=true
2. renders season section with emoji
3. renders plant list when plants exist
4. shows share/save button
5. handles empty plants (no items message)
6. shows season label

Mock:
```typescript
const mockRecap = jest.fn(() => ({ plants: [{ id: 1, name_ja: '桜' }], loading: false, season: { emoji: '🌸', label: '桜の季節' } }));
jest.mock('@/hooks/useSeasonRecap', () => ({
  useSeasonRecap: () => mockRecap(),
}));
```

## Acceptance
```bash
npx jest __tests__/screens/OnboardingScreen.test.tsx __tests__/screens/GuideScreen.test.tsx __tests__/screens/RecapScreen.test.tsx --ci
```
