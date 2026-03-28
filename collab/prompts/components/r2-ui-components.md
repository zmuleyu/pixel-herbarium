# Codex Task 7: UI Components — PressableCard, TabBarIcon, CheckinSuccessOverlay

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (unit project)
- **Pattern**: shallowRender for components (same as stamp tests)

## Objective
Write 3 test files. Target: ~15 tests total.

## Prerequisites
1. Read `collab/specs/mock-catalog.md`
2. Read `src/components/PressableCard.tsx`
3. Read `src/components/TabBarIcon.tsx`
4. Read `src/components/CheckinSuccessOverlay.tsx`
5. Read `__tests__/components/stamps/PixelStamp.test.tsx` — shallowRender reference

## Output Files
- `__tests__/components/PressableCard.test.tsx`
- `__tests__/components/TabBarIcon.test.tsx`
- `__tests__/components/CheckinSuccessOverlay.test.tsx`

## Test Cases

### PressableCard (~5 tests)
1. renders children content
2. calls onPress callback
3. applies custom style
4. respects disabled state
5. exports as a function (typeof check)

Mock: `expo-haptics` (already in moduleNameMapper).

### TabBarIcon (~4 tests)
1. renders icon element
2. passes color prop
3. passes size prop
4. handles focused state

Read source to determine if it uses vector icons or custom SVG.

### CheckinSuccessOverlay (~6 tests)
1. renders overlay container
2. shows spot name
3. shows congratulation text (i18n key)
4. shows dismiss/close button
5. shows stamp preview
6. shows milestone badge when count is a milestone (5, 10, etc.)

Mock: `react-i18next`, `@/constants/theme`, `expo-haptics`.

## Acceptance
```bash
npx jest __tests__/components/PressableCard.test.tsx __tests__/components/TabBarIcon.test.tsx __tests__/components/CheckinSuccessOverlay.test.tsx --ci
```
