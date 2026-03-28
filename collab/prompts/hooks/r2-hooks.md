# Codex Task 10: Missing Hooks — useCheckinPhoto, useGuideState, useStaggeredEntry

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (unit project)
- **Pattern**: renderHook + act (see `__tests__/hooks/useHerbarium.test.ts`)

## Objective
Write 3 test files. Target: ~18 tests total.

## Prerequisites
1. Read `collab/specs/mock-catalog.md`
2. Read `src/hooks/useCheckinPhoto.ts`
3. Read `src/hooks/useGuideState.ts`
4. Read `src/hooks/useStaggeredEntry.ts`
5. Read `__tests__/hooks/useHerbarium.test.ts` — reference pattern

**Excluded hooks** (screenshot pipeline — no Store value):
- useScreenshotMode, useScreenshotSequence — skip these entirely.

## Output Files
- `__tests__/hooks/useCheckinPhoto.test.ts`
- `__tests__/hooks/useGuideState.test.ts`
- `__tests__/hooks/useStaggeredEntry.test.ts`

## Test Cases

### useCheckinPhoto (~7 tests)
1. Returns null uri initially
2. pickFromCamera returns URI on success
3. pickFromCamera returns null when permission denied
4. pickFromCamera returns null when user cancels
5. pickFromLibrary returns URI on success
6. pickFromLibrary returns null when cancelled
7. requesting flag toggles during operation

Mock:
```typescript
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///photo.jpg' }] }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///lib.jpg' }] }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  MediaTypeOptions: { Images: 'Images' },
}));
```

### useGuideState (~6 tests)
1. Starts with loading=true
2. Returns seen=false when nothing in storage
3. Returns seen=true when stored value is 'true'
4. markSeen persists 'true' to AsyncStorage
5. reset removes the key from storage
6. Uses correct storage key per guide ID

Mock:
```typescript
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));
```

### useStaggeredEntry (~5 tests)
1. Returns getStyle function
2. ready=true after items loaded (or when count=0)
3. getStyle returns opacity and transform properties
4. Respects reduceMotion accessibility setting
5. Handles zero items gracefully

Mock: react-native AccessibilityInfo is already in `__mocks__/react-native.js`.

## Acceptance
```bash
npx jest __tests__/hooks/useCheckinPhoto.test.ts __tests__/hooks/useGuideState.test.ts __tests__/hooks/useStaggeredEntry.test.ts --ci
```
