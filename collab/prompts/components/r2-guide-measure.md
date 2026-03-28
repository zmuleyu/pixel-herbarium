# Codex Task 9: GuideMeasureContext Tests

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (unit project)
- **Pattern**: renderHook with provider wrapper

## Objective
Write 1 test file. Target: ~6 tests.

## Prerequisites
1. Read `src/components/guide/GuideMeasureContext.tsx`
2. Read `__tests__/hooks/useHerbarium.test.ts` — renderHook reference pattern

## Output File
- `__tests__/components/guide/GuideMeasureContext.test.tsx`

## Test Cases
1. Default context returns no-op register and null getRect
2. Provider register stores layout rect correctly
3. Provider getRect retrieves stored rect
4. Provider getRect returns null for unknown key
5. Multiple keys stored independently
6. useGuideMeasure hook returns context value from provider

## Pattern
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { GuideMeasureProvider, useGuideMeasure } from '@/components/guide/GuideMeasureContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GuideMeasureProvider>{children}</GuideMeasureProvider>
);

// Test with: renderHook(() => useGuideMeasure(), { wrapper })
```

Read the source to understand the exact API (register, getRect, etc.) and adjust test cases accordingly.

## Acceptance
```bash
npx jest __tests__/components/guide/GuideMeasureContext.test.tsx --ci
```
