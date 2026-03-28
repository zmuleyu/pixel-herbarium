# Codex Task 6: Stamp Variant Tests (7 components)

## Project
- **App**: Pixel Herbarium (Expo + React Native + TypeScript)
- **Test framework**: Jest 29 + ts-jest (unit project)
- **Pattern**: shallowRender + renderToJson (see `collab/specs/stamp-template.md`)

## Objective
Write 7 test files for all untested stamp variants. Target: ~28 tests (4 per variant).

## Prerequisites
1. Read `collab/specs/stamp-template.md` — template with props per variant
2. Read `__tests__/components/stamps/PixelStamp.test.tsx` — **canonical reference** (follow this EXACTLY)
3. Read each source file before writing its test

## Output Files
- `__tests__/components/stamps/ClassicStamp.test.tsx`
- `__tests__/components/stamps/MedallionStamp.test.tsx`
- `__tests__/components/stamps/MinimalStamp.test.tsx`
- `__tests__/components/stamps/PostcardStamp.test.tsx`
- `__tests__/components/stamps/ReliefStamp.test.tsx`
- `__tests__/components/stamps/SealStamp.test.tsx`
- `__tests__/components/stamps/WindowStamp.test.tsx`

## Pattern
Every file follows the same structure:
1. `import React from 'react'`
2. `jest.mock('@/constants/theme', ...)` — stamp config
3. `jest.mock('@/utils/stamp-colors', ...)` — color getter (skip for MinimalStamp)
4. Import the component
5. Copy shallowRender + renderToJson helpers from PixelStamp.test.tsx
6. Define props (see stamp-template.md for each variant)
7. Write 4 tests: renders spotName, renders date/season/year, renders city/brand, renders optional customText

## Important Notes
- SVG variants (Medallion, Postcard, Relief, Window) — `react-native-svg` is already mapped in jest.config.js moduleNameMapper to `__mocks__/react-native-svg.js`. No inline mock needed.
- MinimalStamp uses `accentColor` not `themeColor`, and does NOT use `getStampColors`.
- SealStamp uses `seasonEmoji`, `year`, `seasonLabel` — different prop shape.
- If shallowRender throws for any variant, wrap in try/catch and test that the export is a function instead.

## Acceptance
```bash
npx jest __tests__/components/stamps/ --ci
```
Expected: all stamp tests pass (existing PixelStamp + 7 new).
