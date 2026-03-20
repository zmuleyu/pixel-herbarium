# Content Pack Architecture — Multi-Country Readiness

**Date:** 2026-03-19
**Status:** Draft
**Scope:** M1-M4 (architecture abstraction); M5 (camera dual reward) deferred to future iteration

## Context

Pixel Herbarium currently hardcodes Japan-specific content throughout the codebase:
- `sakura_spots` table name in Supabase
- `JAPAN_BOUNDS` in Edge Function `verify/index.ts`
- `import sakuraData` scattered across 4+ tab components
- `SEASONS` array in `constants/seasons.ts` with no country association

The app's core gameplay mechanics (check-in, collection, footprint, share) are inherently country-agnostic, but the implementation is tightly coupled to Japanese content. This design introduces a **Content Pack architecture** that cleanly separates universal gameplay from country-specific content, enabling future multi-country expansion with minimal code changes.

### Design Decisions (from brainstorm)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Expansion timeline | Japan first, long-term multi-country | Architecture预留, not immediate |
| App distribution | Single-country app per build | Each country = separate App Store listing |
| Data model | Hybrid: static base (JSON) + dynamic state (API) | Offline-capable + real-time bloom status |
| Architecture | A+C hybrid: Content Pack structure + simple config | Full build-time injection deferred |
| Camera dual reward | Deferred to M5 | Focus on architecture foundation first |
| Field renames | Deferred (YAGNI) | Keep `nameJa`/`prefecture`/`prefectureCode` until second country actually needed |

## Architecture

### Three-Layer Model

```
┌───────────────────────────────────────────────┐
│  Content Pack Layer (country-specific)         │
│  src/data/packs/jp/ → seasons, plants, i18n    │
├───────────────────────────────────────────────┤
│  Region Config Layer (new abstraction)         │
│  RegionConfig → bounds, seasons, locale        │
│  getActiveRegion() → currently returns jp      │
├───────────────────────────────────────────────┤
│  Gameplay Engine Layer (universal)             │
│  spot-store · checkin-store · herbarium-store   │
│  checkin.tsx · footprint.tsx · herbarium.tsx    │
│  bloom utils · offline queue · share           │
├───────────────────────────────────────────────┤
│  Platform Layer (Expo + Supabase + i18n)       │
└───────────────────────────────────────────────┘
```

### Type System

#### RegionConfig (new)

```typescript
// src/types/region.ts

export interface GeoBounds {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export interface RegionConfig {
  id: string;                      // 'jp', 'cn', 'kr', 'tw'
  nameKey: string;                 // i18n key: 'region.jp.name'
  bounds: GeoBounds;               // GPS fence (replaces hardcoded JAPAN_BOUNDS)
  seasons: SeasonConfig[];         // Seasons available in this region
  defaultLocale: string;           // 'ja', 'zh-Hans', 'ko'
  adminDivisionKey: string;        // 'prefecture' (JP) / 'province' (CN)
  adminDivisionStandard?: string;  // 'JIS-X-0401' / 'GB-T-2260'
  spotCategories: string[];        // Spot categories applicable to this region
}
```

#### FlowerSpot (additive only — no renames)

```typescript
// src/types/hanami.ts — only ONE change

export interface FlowerSpot {
  id: number;
  regionId: string;              // ← NEW: 'jp' (added, not renamed)
  seasonId: string;              // unchanged
  nameJa: string;                // unchanged (rename to nameLocal deferred to multi-country phase)
  nameEn: string;                // unchanged
  prefecture: string;            // unchanged (rename deferred)
  prefectureCode: number;        // unchanged (rename deferred)
  city: string;                  // unchanged
  category: SpotCategory;        // unchanged
  treeCount?: number;            // unchanged
  bloomTypical: BloomWindow;     // unchanged
  latitude: number;              // unchanged
  longitude: number;             // unchanged
  description?: string;          // unchanged
  tags: string[];                // unchanged
}
```

**Why no renames:** `nameJa`, `prefecture`, `prefectureCode` are referenced in 15+ files (components, tests, JSON data, seed scripts). Renaming them now would be high-cost, zero-benefit since only Japan is active. The only addition is `regionId: string` — a single new field with no ripple effect.

**sakura.json update:** Add `"regionId": "jp"` to each spot entry. All other fields unchanged.

#### SeasonConfig (unchanged)

`src/constants/seasons.ts` → `SeasonConfig` interface stays exactly as-is. The `SEASONS` array moves into `RegionConfig.seasons` and `getActiveSeason()` / `getCurrentSeason()` accept an optional `RegionConfig` parameter (defaulting to `getActiveRegion()`).

**Guard:** `getSeasons()` must never return empty array. `getActiveSeason()` should assert `seasons.length > 0` and throw descriptive error if violated.

#### types/sakura.ts → types/spot.ts (rename)

`src/types/sakura.ts` exports `SpotCheckinResult`, `SharePosterSpot`, `OfflineCheckinItem`. These types are season-agnostic (they work for any season's spot checkins), so the file should be renamed to `spot.ts`. Field names inside these types (`name_ja`, `prefecture` in `SharePosterSpot`) stay as-is — they match the DB column names.

**Consumers to update:**
- `src/stores/sakura-store.ts` (line 8)
- `src/components/SpotStampGrid.tsx`
- `src/components/SpotDetailSheet.tsx`
- `src/components/SpotCheckinAnimation.tsx`
- `src/components/SharePoster.tsx`

### Content Pack Directory Structure

```
src/data/packs/
  jp/                                 ← Japan content pack
    region.ts                         ← Exports RegionConfig for Japan
    seasons/
      sakura.json                     ← Moved from src/data/seasons/sakura.json
      ajisai.json                     ← Future (empty placeholder)
      himawari.json                   ← Future (empty placeholder)
      momiji.json                     ← Future (empty placeholder)
    i18n/
      content.ja.json                 ← Country-specific translations (flower names, place names)
      content.en.json                 ← English translations for JP content
```

**What stays in global i18n:** UI chrome (button labels, tab names, error messages) remains in `src/i18n/ja.json` and `src/i18n/en.json`. Only country-specific content (flower language, spot names, cultural references) moves to the pack.

**i18n key convention:** Existing `sakura.*` keys (e.g., `sakura.collection.progress`, `sakura.stampCard.mankai`) remain as-is. The prefix `sakura` here refers to the season ID, not the country — it is correct and should NOT be generalized. When `ajisai` season is added, its keys will be `ajisai.collection.progress` etc.

### Content Pack Loader

```typescript
// src/services/content-pack.ts

import jpRegion from '@/data/packs/jp/region';
import sakuraData from '@/data/packs/jp/seasons/sakura.json';
import type { RegionConfig } from '@/types/region';
import type { SpotsData } from '@/types/hanami';

// A+C phase: hardcoded jp
// Future: select based on REGION env var at build time
export function getActiveRegion(): RegionConfig {
  return jpRegion;
}

// Static registry — Metro bundler requires static imports
const SPOT_REGISTRY: Record<string, SpotsData> = {
  sakura: sakuraData as SpotsData,
  // ajisai: ajisaiData as SpotsData,  // uncomment when data ready
};

export function loadSpotsData(seasonId: string): SpotsData | null {
  return SPOT_REGISTRY[seasonId] ?? null;
}
```

**Why static registry over dynamic require:** Metro bundler (React Native) cannot resolve dynamic `require()` paths at build time. A static import + registry pattern is the standard React Native approach and matches the existing `SEASON_SPOTS` pattern already used in `checkin.tsx`.

### Japan RegionConfig

```typescript
// src/data/packs/jp/region.ts

import type { RegionConfig } from '@/types/region';
import type { SeasonConfig } from '@/constants/seasons';

const jpSeasons: SeasonConfig[] = [
  {
    id: 'sakura',
    nameKey: 'season.sakura.name',
    themeColor: '#e8a5b0',
    accentColor: '#f5d5d0',
    bgTint: '#FFF5F3',
    iconEmoji: '🌸',
    dateRange: ['03-15', '04-20'],
    spotsDataKey: 'sakura',
  },
  // Future seasons — uncomment when data is ready:
  // { id: 'ajisai',   nameKey: 'season.ajisai.name',   themeColor: '#7B9FCC', ... },
  // { id: 'himawari', nameKey: 'season.himawari.name', themeColor: '#d4a645', ... },
  // { id: 'momiji',   nameKey: 'season.momiji.name',   themeColor: '#c4764a', ... },
];

const jpRegion: RegionConfig = {
  id: 'jp',
  nameKey: 'region.jp.name',
  bounds: {
    latMin: 24.0,
    latMax: 46.0,
    lonMin: 122.0,
    lonMax: 154.0,
  },
  seasons: jpSeasons,
  defaultLocale: 'ja',
  adminDivisionKey: 'prefecture',
  adminDivisionStandard: 'JIS-X-0401',
  spotCategories: ['park', 'river', 'shrine', 'castle', 'mountain', 'street', 'garden'],
};

export default jpRegion;
```

**Timing for old SEASONS removal:** The `SEASONS` array in `constants/seasons.ts` is removed in M4 when `getSeasons()` starts delegating to `getActiveRegion().seasons`. During M1-M3, both exist (old SEASONS still works, new jpSeasons is defined but not consumed by production code yet).

## Database Migration

### 022_generalize_spots.sql

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- 022: Generalize sakura_spots → flower_spots for multi-season support
-- Risk: LOW (25 rows, 0 production checkins, app not yet launched)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Rename table: sakura_spots → flower_spots
ALTER TABLE sakura_spots RENAME TO flower_spots;

-- 2. Add region_id column (default 'jp' for existing data)
ALTER TABLE flower_spots ADD COLUMN region_id TEXT NOT NULL DEFAULT 'jp';

-- 3. Rename spatial index
ALTER INDEX idx_sakura_spots_location RENAME TO idx_flower_spots_location;

-- 4. Add season_id to spot_checkins for multi-season queries (NOT NULL with default)
ALTER TABLE spot_checkins ADD COLUMN season_id TEXT NOT NULL DEFAULT 'sakura';

-- 5. Update RLS policy names (cosmetic)
ALTER POLICY "spots are publicly readable" ON flower_spots
  RENAME TO "flower_spots_public_read";

-- 6. Update checkin_spot RPC to reference flower_spots
CREATE OR REPLACE FUNCTION checkin_spot(
  p_spot_id      INTEGER,
  p_is_peak      BOOLEAN,
  p_bloom_status TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid     UUID  := auth.uid();
  v_uid_txt TEXT  := v_uid::TEXT;
  v_is_new  BOOLEAN;
  v_json    JSON;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate spot exists in flower_spots (was sakura_spots)
  IF NOT EXISTS (SELECT 1 FROM flower_spots WHERE id = p_spot_id) THEN
    RAISE EXCEPTION 'Spot not found';
  END IF;

  INSERT INTO spot_checkins (user_id, spot_id, is_mankai, stamp_variant, bloom_status_at_checkin, season_id)
  VALUES (
    v_uid,
    p_spot_id,
    p_is_peak,
    CASE WHEN p_is_peak THEN 'mankai' ELSE 'normal' END,
    p_bloom_status,
    (SELECT season_id FROM flower_spots WHERE id = p_spot_id)
  )
  ON CONFLICT (user_id, spot_id) DO UPDATE
    SET checked_in_at = spot_checkins.checked_in_at
  RETURNING (xmax = 0) INTO v_is_new;

  SELECT row_to_json(sc) INTO v_json
  FROM spot_checkins sc
  WHERE sc.user_id = v_uid AND sc.spot_id = p_spot_id;

  IF v_is_new AND p_is_peak THEN
    INSERT INTO user_quotas (user_id, month, used, "limit")
    VALUES (v_uid_txt, to_char(now(), 'YYYY-MM'), 0, 5)
    ON CONFLICT (user_id, month) DO NOTHING;

    UPDATE user_quotas
    SET "limit" = "limit" + 1
    WHERE user_id = v_uid_txt
      AND month  = to_char(now(), 'YYYY-MM');
  END IF;

  RETURN json_build_object(
    'checkin',    v_json,
    'is_new_row', v_is_new
  );
END;
$$;
```

**Unique constraint note:** The existing `UNIQUE(user_id, spot_id)` on `spot_checkins` remains correct. Each season's spots have unique IDs in `flower_spots` — e.g., sakura-Ueno is ID 1, future momiji-Ueno would be ID 26+. So the same user CAN check in to both (different `spot_id` values). No constraint change needed.

**Rollback SQL:**
```sql
-- Order matters: drop column before rename, restore RPC first
-- 1. Restore original checkin_spot RPC from 021_sakura_spots.sql
-- (copy function body from 021_sakura_spots.sql)
-- 2. Drop added columns
ALTER TABLE spot_checkins DROP COLUMN IF EXISTS season_id;
ALTER TABLE flower_spots DROP COLUMN IF EXISTS region_id;
-- 3. Rename back
ALTER INDEX idx_flower_spots_location RENAME TO idx_sakura_spots_location;
ALTER POLICY "flower_spots_public_read" ON flower_spots RENAME TO "spots are publicly readable";
ALTER TABLE flower_spots RENAME TO sakura_spots;
```

## Store Generalization

### sakura-store.ts → spot-store.ts

**Changes:**
1. Rename file: `sakura-store.ts` → `spot-store.ts`
2. Rename exported hook: `useSakuraStore` → `useSpotStore`
3. Replace `import sakuraData from '@/data/seasons/sakura.json'` with `import { loadSpotsData } from '@/services/content-pack'`
4. `initSpots()` accepts optional `seasonId` parameter, calls `loadSpotsData(seasonId)`
5. Import types from `@/types/spot` (was `@/types/sakura`)

**What does NOT change:**
- Store interface shape (spots, checkins, loading, all methods)
- `performCheckin()` RPC call (function name `checkin_spot` stays the same)
- `loadCheckins()` query (table `spot_checkins` stays the same)
- Offline queue logic (identical)
- All test assertions (behavior unchanged)

### Complete Consumer Audit

Files that need changes, organized by migration phase:

#### M1: Types + Structure (new files only, no existing file changes)
| File | Change |
|------|--------|
| `src/types/region.ts` | **NEW**: RegionConfig, GeoBounds types |
| `src/data/packs/jp/region.ts` | **NEW**: Japan RegionConfig export |
| `src/data/seasons/sakura.json` | **MOVE** → `src/data/packs/jp/seasons/sakura.json` + add `regionId` field |

#### M2: Database (SQL only, no TS changes)
| File | Change |
|------|--------|
| `supabase/migrations/022_generalize_spots.sql` | **NEW**: Table rename + columns |
| `supabase/seed/seed-sakura-spots.ts` | Rename → `seed-flower-spots.ts`, update table name |

#### M3: Store + Loader + Types
| File | Change |
|------|--------|
| `src/services/content-pack.ts` | **NEW**: Content Pack Loader (getActiveRegion, loadSpotsData) |
| `src/stores/sakura-store.ts` | Rename → `spot-store.ts`, update imports |
| `src/types/sakura.ts` | Rename → `spot.ts`; add `season_id: string` to `SpotCheckinResult` to match new DB column |
| `src/components/SpotStampGrid.tsx` | Update import: `@/types/sakura` → `@/types/spot` |
| `src/components/SpotDetailSheet.tsx` | Update import: `@/types/sakura` → `@/types/spot` |
| `src/components/SpotCheckinAnimation.tsx` | Update import: `@/types/sakura` → `@/types/spot` |
| `src/components/SharePoster.tsx` | Update import: `@/types/sakura` → `@/types/spot` |
| `src/app/(tabs)/herbarium.tsx` | Update import: `@/types/sakura` → `@/types/spot` |
| `supabase/functions/notify-bloom/index.ts` | Update `.from('sakura_spots')` → `.from('flower_spots')` |

#### M4: Component Decoupling
| File | Change |
|------|--------|
| `src/app/(tabs)/checkin.tsx` | Remove `import sakuraData` + `SEASON_SPOTS`, use `loadSpotsData()` |
| `src/app/(tabs)/herbarium.tsx` | Remove `SEASON_SPOTS` + update store import: `useSakuraStore` → `useSpotStore`, use `loadSpotsData()` |
| `src/app/(tabs)/map.tsx` | Update store import: `useSakuraStore` → `useSpotStore` |
| `src/app/(tabs)/footprint.tsx` | Remove sakura import, use `loadSpotsData()` |
| `src/app/(tabs)/home.tsx` | Remove `import sakuraData` + `SEASON_SPOTS`, use `loadSpotsData()` |
| `src/constants/seasons.ts` | Move SEASONS array → delegates to `getActiveRegion().seasons` via `getSeasons()` |

#### Test Files (updated alongside their source in respective phases)
| File | Change |
|------|--------|
| `__tests__/stores/sakura-store.test.ts` | Rename → `spot-store.test.ts`, update import |
| `__tests__/screens/MapScreen.test.tsx` | Update mock: `@/stores/sakura-store` → `@/stores/spot-store` |
| `__tests__/screens/HerbariumScreen.test.tsx` | Update mock path |
| `__tests__/security/rls-spot-checkins.test.ts` | Update assertion: `sakura_spots` → `flower_spots` in migration check |

#### No Changes Needed (i18n keys stay as-is)
- `sakura.collection.progress`, `sakura.stampCard.mankai`, `sakura.checkinSheet.*` etc.
- These keys use `sakura` as a **season ID**, not a country reference — correct as-is
- Future seasons will add `ajisai.*`, `himawari.*`, `momiji.*` key groups

#### Post-M2: Regenerate TypeScript types
- Run `supabase gen types typescript` to regenerate `src/types/database.ts`
- The auto-generated file will reflect `flower_spots` instead of `sakura_spots`

### seasons.ts Evolution

```typescript
// src/constants/seasons.ts — AFTER M4 refactor

import { getActiveRegion } from '@/services/content-pack';

// SeasonConfig type re-exported from here for backward compatibility
export type { SeasonConfig } from '@/types/region';

// Delegates to active region's season list
export function getSeasons(): SeasonConfig[] {
  const seasons = getActiveRegion().seasons;
  if (seasons.length === 0) {
    throw new Error('Region has no seasons configured');
  }
  return seasons;
}

export function getCurrentSeason(date: Date = new Date()): SeasonConfig | null {
  const mmdd = formatMMDD(date);
  return (
    getSeasons().find((s) => {
      const [start, end] = s.dateRange;
      if (start <= end) return mmdd >= start && mmdd <= end;
      return mmdd >= start || mmdd <= end;
    }) ?? null
  );
}

export function getActiveSeason(): SeasonConfig {
  const now = new Date();
  const current = getCurrentSeason(now);
  if (current) return current;

  const mmdd = formatMMDD(now);
  const seasons = getSeasons();

  const future = seasons
    .filter((s) => s.dateRange[0] > mmdd)
    .sort((a, b) => a.dateRange[0].localeCompare(b.dateRange[0]));
  if (future.length > 0) return future[0];

  const past = seasons
    .filter((s) => s.dateRange[1] < mmdd)
    .sort((a, b) => b.dateRange[1].localeCompare(a.dateRange[1]));
  if (past.length > 0) return past[0];

  return seasons[0];
}

function formatMMDD(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}
```

## Migration Phases

| Phase | Scope | Files Changed | Risk | Dependencies |
|-------|-------|---------------|------|-------------|
| **M1** | Types + directory structure | 3 new files, 1 moved | Zero | None |
| **M2** | Database migration | 1 SQL file, 1 seed rename, regenerate database.ts | Low | None |
| **M3** | Content Pack Loader + Store + Type renames | 1 new, 7 renamed/updated, 4 test files | Medium | M1 |
| **M4** | Component decoupling + seasons.ts evolution | 6 tab/component files, 1 constants file | Low | M3 |

**Each phase is independently deployable** — M1 and M2 can ship without M3/M4. The app continues to work at every intermediate state.

**SEASONS array transition:** Old `SEASONS` in `constants/seasons.ts` coexists with new `jpSeasons` in `packs/jp/region.ts` during M1-M3. The old array is removed in M4 when `getSeasons()` starts delegating to `getActiveRegion()`.

## Verification Plan

### After M1 (Types + Structure)
- `pnpm tsc --noEmit` — zero type errors
- All existing tests pass unchanged: `pnpm test`
- sakura.json accessible from new path (verify import works)
- New types compile without errors

### After M2 (Database)
- Apply migration to local Supabase: `supabase db push`
- Verify: `SELECT count(*) FROM flower_spots` returns 25
- Verify: `SELECT region_id FROM flower_spots LIMIT 1` returns 'jp'
- Verify: `SELECT * FROM spot_checkins` works (FK intact after rename)
- Verify: `SELECT checkin_spot(1, false, 'peak')` RPC works with updated function
- Regenerate types: `supabase gen types typescript --local > src/types/database.ts`
- Verify: `database.ts` references `flower_spots` not `sakura_spots`

### After M3 (Store)
- All store tests pass (renamed test file): `pnpm test -- spot-store`
- Type check: `pnpm tsc --noEmit`
- Manual: open app → checkin tab → spots list loads → select spot → checkin works
- Offline queue: toggle airplane mode → checkin → reconnect → flush succeeds

### After M4 (Components)
- Full test suite: `pnpm test` (417+ tests green)
- Type check: `pnpm tsc --noEmit`
- Manual walkthrough all tabs: home, checkin, herbarium, map, footprint
- Verify `getActiveSeason()` returns sakura config when in date range
- EAS preview build + real device test

## Future Work (Not in This Spec)

- **M5: Camera Dual Reward** — AI identify + GPS spot match → dual collection
- **Field renames:** `nameJa` → `nameLocal`, `prefecture` → `adminDivision` (when second country is added)
- **Edge Function parameterization:** `supabase/functions/verify/index.ts` still hardcodes `JAPAN_BOUNDS` — to be parameterized with `RegionConfig.bounds` when second region is added. Currently acceptable because Edge Functions run server-side and can be updated independently.
- **Multi-season data:** Fill ajisai/himawari/momiji spot JSON files
- **Build-time region injection:** `REGION=cn expo build` selects Chinese content pack
- **Second country pack:** `src/data/packs/cn/` with Chinese flower spots
- **Region-aware i18n:** Content translations per region (vs. current language-only)
