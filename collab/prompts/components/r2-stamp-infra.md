# Codex Task 8: Stamp Infrastructure — SpotSelector, PositionSelector, StampOverlay

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (unit project)
- **Pattern**: shallowRender

## Objective
Write 3 test files. Target: ~12 tests total.

## Prerequisites
1. Read `src/components/checkin/SpotSelector.tsx`
2. Read `src/components/stamps/PositionSelector.tsx`
3. Read `src/components/stamps/StampOverlay.tsx`
4. Read `__tests__/components/stamps/PixelStamp.test.tsx` — reference

**Skip**: GestureStampOverlay (depends on react-native-gesture-handler + reanimated, too complex to mock).

## Output Files
- `__tests__/components/SpotSelector.test.tsx`
- `__tests__/components/stamps/PositionSelector.test.tsx`
- `__tests__/components/stamps/StampOverlay.test.tsx`

## Test Cases

### SpotSelector (~4 tests)
1. renders search input
2. renders spot list items
3. calls onSelect when spot tapped
4. handles empty spot list

Mock: `@/services/content-pack` or `@/utils/bloom` as needed, `react-i18next`.

### PositionSelector (~4 tests)
1. renders 3x3 grid (9 cells)
2. highlights selected position
3. calls onSelect with position key
4. default position is 'bottom-right'

Mock: `@/constants/theme` stamp config.

### StampOverlay (~4 tests)
1. renders stamp at specified position
2. applies user-selected opacity
3. renders stamp component based on style prop
4. handles missing/null stamp gracefully

Mock: `@/constants/theme` stamp config, `@/utils/stamp-position`.

## Acceptance
```bash
npx jest __tests__/components/SpotSelector.test.tsx __tests__/components/stamps/PositionSelector.test.tsx __tests__/components/stamps/StampOverlay.test.tsx --ci
```
