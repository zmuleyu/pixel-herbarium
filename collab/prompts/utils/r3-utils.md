# Codex Task 12: Missing Utils — guide-storage, plant-image, haptics

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (unit project)

## Objective
Write 3 test files. Target: ~15 tests total.

## Prerequisites
1. Read `src/utils/guide-storage.ts`
2. Read `src/utils/plant-image.ts`
3. Read `src/utils/haptics.ts`
4. Read `collab/specs/mock-catalog.md`

## Output Files
- `__tests__/utils/guide-storage.test.ts`
- `__tests__/utils/plant-image.test.ts`
- `__tests__/utils/haptics.test.ts`

## Test Cases

### guide-storage (~5 tests)
1. resetGuide removes the correct AsyncStorage key
2. resetAllGuides removes all guide keys
3. hasSeenGuide returns false when key not in storage
4. hasSeenGuide returns true when key exists
5. markGuideSeen stores the key

Mock: `@react-native-async-storage/async-storage`

### plant-image (~5 tests)
1. Returns pixel_sprite_url when available
2. Returns bundled fallback when no URL
3. Returns correct path for rarity-based sprites
4. Returns null when neither URL nor fallback exists
5. Handles missing plant object gracefully

### haptics (~5 tests)
1. plantCollected calls impactAsync with Heavy
2. cardFlip calls selectionAsync
3. rarePlantFound calls impactAsync multiple times
4. Functions don't throw when haptics module fails
5. Exports expected function names

Mock: `expo-haptics` is in moduleNameMapper.

## Acceptance
```bash
npx jest __tests__/utils/guide-storage.test.ts __tests__/utils/plant-image.test.ts __tests__/utils/haptics.test.ts --ci
```
