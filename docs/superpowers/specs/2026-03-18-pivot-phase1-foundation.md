# Pivot Phase 1: Foundation — Implementation Spec

**Date**: 2026-03-18
**Status**: Implemented
**Plan**: `~/.claude/plans/velvety-brewing-elephant.md` (v2)

## Scope

Phase 1 of the 花めぐり check-in pivot. Establishes:
- Season abstraction layer (data model + config + bloom utilities)
- Guest-first auth flow (no forced login)
- 4-tab navigation shell (home / checkin / footprint / settings)
- Legacy tabs hidden via `href: null` (code preserved)
- Home screen with season-driven UI + bloom status

## Design Decisions

### Season Theme Colors
Used existing `colors.seasonal.*` as `accent`, introduced slightly more vivid `primary` for interactive elements. #FF8FAB (plan) too vivid for Adult Kawaii; settled on #e8a5b0 (muted rose).

### Guest-First Auth
Removed forced login redirect. Unauthenticated users go directly to `/(tabs)/home`. Login available optionally via Settings tab.

### getCurrentSeason Name Collision
`src/utils/date.ts` has `getCurrentSeason()` → `Season` type. New `src/constants/seasons.ts` has `getCurrentSeason()` → `SeasonConfig | null`. Different purposes, disambiguated by explicit imports.

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/constants/features.ts` | 14 | Feature flags (CHECKIN_MODE, IDENTIFICATION_MODE) |
| `src/types/hanami.ts` | 57 | FlowerSpot, BloomWindow, CheckinRecord, BloomStatus |
| `src/constants/seasons.ts` | 72 | SeasonConfig, SEASONS, getCurrentSeason, getActiveSeason |
| `src/utils/bloom.ts` | 82 | Bloom status, labels, colors, featured spot |
| `src/data/seasons/sakura.json` | 99 | 5 sample spots (dev; 100 for production) |
| `src/stores/checkin-store.ts` | 42 | Zustand + AsyncStorage history |
| `src/app/(tabs)/home.tsx` | 242 | Season-driven home screen |
| `src/app/(tabs)/settings.tsx` | 124 | Tab-level settings |
| `src/app/(tabs)/checkin.tsx` | 30 | Placeholder |
| `src/app/(tabs)/footprint.tsx` | 28 | Placeholder |

## Files Modified

| File | Change |
|------|--------|
| `src/constants/theme.ts` | +SEASON_THEMES, +getSeasonTheme() |
| `src/i18n/ja.json` | +tabs.home/checkin/footprint/settings, +bloom.*, +season.sakura.*, +checkin.*, +footprint.*, +home.*, +settings.title/login |
| `src/i18n/en.json` | Same structure, English translations |
| `src/app/(tabs)/_layout.tsx` | CHECKIN_TABS + LEGACY_TABS, href:null hidden tabs, season theme active tint |
| `src/app/_layout.tsx` | Guest-first redirect, notification target → footprint |
| `src/app/index.tsx` | Redirect → /(tabs)/home |
| `__tests__/i18n/i18n.test.ts` | Fix type cast for nested season keys |

## Dependencies Added

- `@react-native-async-storage/async-storage` (native module, requires dev build)

## Tests Added

- `__tests__/constants/features.test.ts` (5 tests)
- `__tests__/constants/seasons.test.ts` (16 tests)
- `__tests__/constants/theme-seasons.test.ts` (8 tests)
- `__tests__/utils/bloom.test.ts` (20 tests)
- `__tests__/stores/checkin-store.test.ts` (10 tests)

**Total**: 417 tests passing (350 existing + 59 new + 8 from fixed i18n suite)

## Verification

```
npm test        → 417 passed, 0 failed
```

## Next Steps (Phase 2)

- Check-in wizard (photo → spot → template → preview → share)
- SpotSelector, TemplateSelector, CompositionPreview components
- Card/Watermark/Pixel template implementations
- Full sakura.json (100 spots)
