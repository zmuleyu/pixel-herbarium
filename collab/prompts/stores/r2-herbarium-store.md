# Codex Task 11: herbarium-store Tests

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (unit project)
- **Pattern**: Direct Zustand store testing (see `__tests__/stores/checkin-store.test.ts`)

## Objective
Write 1 test file. Target: ~5 tests.

## Prerequisites
1. Read `src/stores/herbarium-store.ts` — the source
2. Read `__tests__/stores/checkin-store.test.ts` — canonical store test reference
3. Read `__tests__/stores/auth-store.test.ts` — another reference

## Output File
- `__tests__/stores/herbarium-store.test.ts`

## Test Cases
Read the source to confirm the exact API. Expected: a minimal Zustand store with a tick counter for triggering re-renders.

1. Initial state has tick = 0 (or similar initial value)
2. triggerRefresh increments tick by 1
3. Multiple triggerRefresh calls increment sequentially
4. State can be read via getState()
5. Store exports useHerbariumStore hook

## Pattern
```typescript
import { useHerbariumStore } from '@/stores/herbarium-store';

// Zustand stores can be tested by calling getState() / setState() directly
const { getState } = useHerbariumStore;

beforeEach(() => {
  // Reset store between tests
  useHerbariumStore.setState({ /* initial state */ });
});
```

## Acceptance
```bash
npx jest __tests__/stores/herbarium-store.test.ts --ci
```
