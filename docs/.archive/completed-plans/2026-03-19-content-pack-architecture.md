# Content Pack Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate universal gameplay mechanics from Japan-specific content via a Content Pack architecture, enabling future multi-country expansion.

**Architecture:** Three-layer model — Content Pack (country data) → Region Config (abstraction) → Gameplay Engine (universal). A+C hybrid approach: directory structure now, build-time injection later.

**Tech Stack:** Expo 55, React Native, TypeScript, Supabase (PostgreSQL + Edge Functions), Zustand, Jest

**Spec:** `docs/superpowers/specs/2026-03-19-content-pack-architecture-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/types/region.ts` | `SeasonConfig`, `RegionConfig`, `GeoBounds` type definitions (SeasonConfig lives here to prevent circular deps) |
| `src/data/packs/jp/region.ts` | Japan-specific RegionConfig export |
| `src/services/content-pack.ts` | Content Pack Loader (`getActiveRegion`, `loadSpotsData`) |
| `supabase/migrations/022_generalize_spots.sql` | DB table rename + new columns |
| `__tests__/services/content-pack.test.ts` | Tests for Content Pack Loader |
| `__tests__/types/region.test.ts` | Tests for RegionConfig validation |

### Renamed Files
| From | To |
|------|-----|
| `src/data/seasons/sakura.json` | `src/data/packs/jp/seasons/sakura.json` |
| `src/stores/sakura-store.ts` | `src/stores/spot-store.ts` |
| `src/types/sakura.ts` | `src/types/spot.ts` |
| `supabase/seed/seed-sakura-spots.ts` | `supabase/seed/seed-flower-spots.ts` |
| `__tests__/stores/sakura-store.test.ts` | `__tests__/stores/spot-store.test.ts` |

### Modified Files (import path updates)
| File | Nature of Change |
|------|-----------------|
| `src/types/hanami.ts` | Add `regionId` field to `FlowerSpot` |
| `src/constants/seasons.ts` | Delegate to `getActiveRegion().seasons` |
| `src/app/(tabs)/checkin.tsx` | Replace `SEASON_SPOTS` → `loadSpotsData()` |
| `src/app/(tabs)/herbarium.tsx` | Replace store + type imports |
| `src/app/(tabs)/map.tsx` | Replace store import |
| `src/app/(tabs)/footprint.tsx` | Replace `SEASON_SPOTS` → `loadSpotsData()` |
| `src/app/(tabs)/home.tsx` | Replace `SEASON_SPOTS` → `loadSpotsData()` |
| `src/components/SpotStampGrid.tsx` | Update type import path |
| `src/components/SpotDetailSheet.tsx` | Update type import path |
| `src/components/SpotCheckinAnimation.tsx` | Verify: may NOT import from `@/types/sakura` (skip if so) |
| `src/components/SharePoster.tsx` | Update type import path |
| `supabase/functions/notify-bloom/index.ts` | Update table name |
| `__tests__/screens/MapScreen.test.tsx` | Update mock path |
| `__tests__/screens/HerbariumScreen.test.tsx` | Update mock path |
| `__tests__/security/rls-spot-checkins.test.ts` | Add migration 022 assertions |

---

## Task 1: RegionConfig Types + Tests (M1)

**Files:**
- Create: `src/types/region.ts`
- Create: `__tests__/types/region.test.ts`
- Modify: `src/types/hanami.ts:4-6` (add `regionId`)

- [ ] **Step 1: Write failing test for RegionConfig type**

```typescript
// __tests__/types/region.test.ts
import type { RegionConfig, GeoBounds } from '../../src/types/region';

describe('RegionConfig type', () => {
  it('accepts a valid Japan RegionConfig', () => {
    const bounds: GeoBounds = { latMin: 24.0, latMax: 46.0, lonMin: 122.0, lonMax: 154.0 };
    const config: RegionConfig = {
      id: 'jp',
      nameKey: 'region.jp.name',
      bounds,
      seasons: [],
      defaultLocale: 'ja',
      adminDivisionKey: 'prefecture',
      adminDivisionStandard: 'JIS-X-0401',
      spotCategories: ['park', 'shrine'],
    };
    expect(config.id).toBe('jp');
    expect(config.bounds.latMin).toBe(24.0);
    expect(config.adminDivisionStandard).toBe('JIS-X-0401');
  });

  it('allows optional adminDivisionStandard', () => {
    const config: RegionConfig = {
      id: 'test',
      nameKey: 'region.test.name',
      bounds: { latMin: 0, latMax: 1, lonMin: 0, lonMax: 1 },
      seasons: [],
      defaultLocale: 'en',
      adminDivisionKey: 'state',
      spotCategories: [],
    };
    expect(config.adminDivisionStandard).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd D:/projects/Games/gardern/pixel-herbarium && pnpm test -- region.test --no-coverage`
Expected: FAIL — cannot find module `../../src/types/region`

- [ ] **Step 3: Create RegionConfig + SeasonConfig types**

**IMPORTANT:** `SeasonConfig` must live in `types/region.ts` (not `constants/seasons.ts`) to prevent a circular dependency chain: `seasons.ts → content-pack.ts → jp/region.ts → region.ts → seasons.ts`. By placing `SeasonConfig` here, all downstream files import from `types/region.ts` and the cycle is broken.

```typescript
// src/types/region.ts

// SeasonConfig lives here to prevent circular dependency with constants/seasons.ts.
// constants/seasons.ts re-exports it for backward compatibility.
export interface SeasonConfig {
  id: string;
  nameKey: string;
  themeColor: string;
  accentColor: string;
  bgTint: string;
  iconEmoji: string;
  dateRange: [string, string];
  spotsDataKey: string;
}

export interface GeoBounds {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export interface RegionConfig {
  id: string;
  nameKey: string;
  bounds: GeoBounds;
  seasons: SeasonConfig[];
  defaultLocale: string;
  adminDivisionKey: string;
  adminDivisionStandard?: string;
  spotCategories: string[];
}
```

Then update `src/constants/seasons.ts` to re-export the type:
```typescript
// Add at top of src/constants/seasons.ts (keeping existing SEASONS array and functions for now):
export type { SeasonConfig } from '@/types/region';
// Remove the existing SeasonConfig interface definition from this file.
```

- [ ] **Step 4: Add `regionId` to FlowerSpot**

In `src/types/hanami.ts`, add `regionId: string;` after the `id` field (line 5):

```typescript
export interface FlowerSpot {
  id: number;
  regionId: string; // 'jp', 'cn', etc.
  seasonId: string;
  // ... rest unchanged
```

- [ ] **Step 5: Run tests**

Run: `cd D:/projects/Games/gardern/pixel-herbarium && pnpm test -- region.test --no-coverage`
Expected: PASS (2 tests)

Then: `pnpm tsc --noEmit`
Expected: zero errors

- [ ] **Step 6: Commit**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git add src/types/region.ts src/types/hanami.ts __tests__/types/region.test.ts
git commit -m "feat(types): add RegionConfig type and regionId to FlowerSpot"
```

---

## Task 2: Japan Content Pack + Move sakura.json (M1)

**Files:**
- Create: `src/data/packs/jp/region.ts`
- Move: `src/data/seasons/sakura.json` → `src/data/packs/jp/seasons/sakura.json`

- [ ] **Step 1: Create Japan RegionConfig**

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
    dateRange: ['03-15', '04-20'] as [string, string],
    spotsDataKey: 'sakura',
  },
  // Future seasons — uncomment when data is ready:
  // { id: 'ajisai',   nameKey: 'season.ajisai.name',   themeColor: '#7B9FCC', accentColor: '#b8d0ea', bgTint: '#F3F7FF', iconEmoji: '💠', dateRange: ['06-01', '07-15'], spotsDataKey: 'ajisai' },
  // { id: 'himawari', nameKey: 'season.himawari.name', themeColor: '#d4a645', accentColor: '#f5e6a3', bgTint: '#FFFBF0', iconEmoji: '🌻', dateRange: ['07-15', '08-31'], spotsDataKey: 'himawari' },
  // { id: 'momiji',   nameKey: 'season.momiji.name',   themeColor: '#c4764a', accentColor: '#e8b89c', bgTint: '#FFF5EF', iconEmoji: '🍁', dateRange: ['10-15', '12-05'], spotsDataKey: 'momiji' },
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

- [ ] **Step 2: Create directories and move sakura.json**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
mkdir -p src/data/packs/jp/seasons
git mv src/data/seasons/sakura.json src/data/packs/jp/seasons/sakura.json
```

- [ ] **Step 3: Add `regionId` to every spot in sakura.json**

Add `"regionId": "jp"` to each of the 25 spot objects in `src/data/packs/jp/seasons/sakura.json`. The field should be placed after `"id"` in each object.

- [ ] **Step 4: Update all imports that reference the old path**

Search and replace `@/data/seasons/sakura.json` → `@/data/packs/jp/seasons/sakura.json` in:
- `src/stores/sakura-store.ts` (line 5)
- `src/app/(tabs)/checkin.tsx` (line 27)
- `src/app/(tabs)/footprint.tsx` (line 18)
- `src/app/(tabs)/home.tsx` (line 29)

Also update the seed file import (uses relative path, not alias):
- `supabase/seed/seed-sakura-spots.ts` — update `../../src/data/seasons/sakura.json` → `../../src/data/packs/jp/seasons/sakura.json`

Also update the test mock path:
- `__tests__/stores/sakura-store.test.ts` — update `jest.mock('@/data/seasons/sakura.json'` → `jest.mock('@/data/packs/jp/seasons/sakura.json'`

- [ ] **Step 5: Verify build + tests**

Run: `pnpm tsc --noEmit && pnpm test --no-coverage`
Expected: zero TS errors, all tests pass

- [ ] **Step 6: Commit**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git add src/data/packs/ src/stores/sakura-store.ts src/app/\(tabs\)/checkin.tsx src/app/\(tabs\)/footprint.tsx src/app/\(tabs\)/home.tsx
git add -u src/data/seasons/  # track the deletion
git commit -m "feat(m1): create Japan content pack, move sakura.json to packs/jp/"
```

---

## Task 3: Database Migration (M2)

**Files:**
- Create: `supabase/migrations/022_generalize_spots.sql`

- [ ] **Step 1: Write migration SQL**

Create `supabase/migrations/022_generalize_spots.sql` with the exact SQL from the spec (lines 220-298 of the design doc). Copy it verbatim.

- [ ] **Step 2: Apply migration to local Supabase**

Run: `cd D:/projects/Games/gardern/pixel-herbarium && npx supabase db push --local`

- [ ] **Step 3: Verify migration**

Run these SQL queries via Supabase Studio or CLI:
```sql
SELECT count(*) FROM flower_spots;          -- expect 25
SELECT region_id FROM flower_spots LIMIT 1; -- expect 'jp'
SELECT column_name FROM information_schema.columns WHERE table_name = 'spot_checkins' AND column_name = 'season_id'; -- should exist
```

- [ ] **Step 4: Rename seed file**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git mv supabase/seed/seed-sakura-spots.ts supabase/seed/seed-flower-spots.ts
```

Then update inside `seed-flower-spots.ts`:
- Line 5 comment: `sakura_spots table` → `flower_spots table`
- Line 51: `.from('sakura_spots')` → `.from('flower_spots')`

- [ ] **Step 5: Regenerate TypeScript types**

Run: `cd D:/projects/Games/gardern/pixel-herbarium && npx supabase gen types typescript --local > src/types/database.ts`

Verify: `grep 'flower_spots' src/types/database.ts` shows the new table name.
Verify: `grep 'sakura_spots' src/types/database.ts` returns nothing.

- [ ] **Step 6: Update RLS security test**

In `__tests__/security/rls-spot-checkins.test.ts`, the test reads migration 021 and asserts `sakura_spots`. Add a NEW test block for migration 022:

```typescript
describe('Migration 022 — flower_spots generalization', () => {
  const sql022 = fs.readFileSync(
    path.join(__dirname, '../../supabase/migrations/022_generalize_spots.sql'),
    'utf-8',
  );

  it('renames sakura_spots to flower_spots', () => {
    expect(sql022).toContain('ALTER TABLE sakura_spots RENAME TO flower_spots');
  });

  it('adds region_id column with jp default', () => {
    expect(sql022).toContain("region_id TEXT NOT NULL DEFAULT 'jp'");
  });

  it('adds season_id to spot_checkins', () => {
    expect(sql022).toContain("season_id TEXT NOT NULL DEFAULT 'sakura'");
  });

  it('enables RLS on flower_spots', () => {
    expect(sql022).toContain('flower_spots_public_read');
  });
});
```

Leave the existing migration 021 tests unchanged — they validate that 021 itself is correct.

- [ ] **Step 7: Run tests + type check**

Run: `pnpm test --no-coverage && pnpm tsc --noEmit`
Expected: all pass

- [ ] **Step 8: Commit**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git add supabase/migrations/022_generalize_spots.sql supabase/seed/seed-flower-spots.ts src/types/database.ts __tests__/security/rls-spot-checkins.test.ts
git add -u supabase/seed/  # track seed rename
git commit -m "feat(m2): generalize sakura_spots → flower_spots with region_id"
```

---

## Task 4: Content Pack Loader + Tests (M3)

**Files:**
- Create: `src/services/content-pack.ts`
- Create: `__tests__/services/content-pack.test.ts`

- [ ] **Step 1: Write failing tests for Content Pack Loader**

```typescript
// __tests__/services/content-pack.test.ts
import { getActiveRegion, loadSpotsData } from '../../src/services/content-pack';

describe('content-pack', () => {
  describe('getActiveRegion', () => {
    it('returns jp region config', () => {
      const region = getActiveRegion();
      expect(region.id).toBe('jp');
      expect(region.bounds.latMin).toBe(24.0);
      expect(region.defaultLocale).toBe('ja');
    });

    it('has at least one season', () => {
      const region = getActiveRegion();
      expect(region.seasons.length).toBeGreaterThan(0);
      expect(region.seasons[0].id).toBe('sakura');
    });
  });

  describe('loadSpotsData', () => {
    it('returns sakura spots data', () => {
      const data = loadSpotsData('sakura');
      expect(data).not.toBeNull();
      expect(data!.seasonId).toBe('sakura');
      expect(data!.spots.length).toBe(25);
    });

    it('returns null for unknown season', () => {
      expect(loadSpotsData('nonexistent')).toBeNull();
    });

    it('spots have regionId field', () => {
      const data = loadSpotsData('sakura');
      expect(data!.spots[0].regionId).toBe('jp');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm test -- content-pack.test --no-coverage`
Expected: FAIL — cannot find module `../../src/services/content-pack`

- [ ] **Step 3: Create Content Pack Loader**

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
};

export function loadSpotsData(seasonId: string): SpotsData | null {
  return SPOT_REGISTRY[seasonId] ?? null;
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm test -- content-pack.test --no-coverage`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git add src/services/content-pack.ts __tests__/services/content-pack.test.ts
git commit -m "feat(m3): add Content Pack Loader with getActiveRegion + loadSpotsData"
```

---

## Task 5: Rename types/sakura.ts → types/spot.ts (M3)

**Files:**
- Rename: `src/types/sakura.ts` → `src/types/spot.ts`
- Modify: 6 consumer files (import path updates)

- [ ] **Step 1: Rename the type file**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git mv src/types/sakura.ts src/types/spot.ts
```

- [ ] **Step 2: Add `season_id` to SpotCheckinResult**

In `src/types/spot.ts`, add to the `SpotCheckinResult` interface (after `bloom_status_at_checkin`):

```typescript
  season_id: string;             // matches flower_spots.season_id
```

- [ ] **Step 3: Update all consumer imports**

Replace `'@/types/sakura'` → `'@/types/spot'` in these files:
- `src/stores/sakura-store.ts` (line 8)
- `src/components/SpotStampGrid.tsx` (line 9)
- `src/components/SpotDetailSheet.tsx` (line 7)
- `src/components/SharePoster.tsx` (line 14)
- `src/app/(tabs)/herbarium.tsx` (line 27)

Note: `SpotCheckinAnimation.tsx` — verify if it actually imports from `@/types/sakura`. If not, skip it.

- [ ] **Step 4: Verify**

Run: `pnpm tsc --noEmit && pnpm test --no-coverage`
Expected: zero errors, all tests pass

- [ ] **Step 5: Commit**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git add -u src/types/ src/stores/ src/components/ src/app/
git commit -m "refactor(m3): rename types/sakura → types/spot, add season_id to SpotCheckinResult"
```

---

## Task 6: Rename sakura-store → spot-store (M3)

**Files:**
- Rename: `src/stores/sakura-store.ts` → `src/stores/spot-store.ts`
- Rename: `__tests__/stores/sakura-store.test.ts` → `__tests__/stores/spot-store.test.ts`
- Modify: 4 consumer files + 2 test files

- [ ] **Step 1: Rename store file**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git mv src/stores/sakura-store.ts src/stores/spot-store.ts
git mv __tests__/stores/sakura-store.test.ts __tests__/stores/spot-store.test.ts
```

- [ ] **Step 2: Update store internals**

In `src/stores/spot-store.ts`:
1. Line 1 comment: update to `// src/stores/spot-store.ts`
2. Replace `import sakuraData from '@/data/packs/jp/seasons/sakura.json'` with `import { loadSpotsData } from '@/services/content-pack'`
3. Rename interface: `SakuraStore` → `SpotStore`
4. Rename export: `useSakuraStore` → `useSpotStore`
5. Update `initSpots`:
```typescript
  initSpots: (seasonId?: string) => {
    const sid = seasonId ?? getActiveSeason().id;
    const data = loadSpotsData(sid);
    set({ spots: data?.spots ?? [] });
  },
```
Add import: `import { getActiveSeason } from '@/constants/seasons';`

- [ ] **Step 3: Update consumer files**

Replace `'@/stores/sakura-store'` → `'@/stores/spot-store'` and `useSakuraStore` → `useSpotStore` in:
- `src/app/(tabs)/herbarium.tsx` (line 23, 50)
- `src/app/(tabs)/map.tsx` (line 17, 52, 98)

- [ ] **Step 4: Update test files**

In `__tests__/stores/spot-store.test.ts`:
- Line 1 comment: update to `// __tests__/stores/spot-store.test.ts`
- Line 40: `from '../../src/stores/sakura-store'` → `from '../../src/stores/spot-store'`
- All `useSakuraStore` → `useSpotStore`
- **CRITICAL:** The test currently mocks `@/data/packs/jp/seasons/sakura.json` (updated in Task 2). Since the store now imports `loadSpotsData` from `@/services/content-pack` instead of sakura.json directly, update the mock to target the content-pack module:
```typescript
jest.mock('@/services/content-pack', () => ({
  loadSpotsData: jest.fn(() => ({
    version: 1,
    seasonId: 'sakura',
    spots: [/* test spot data */],
  })),
  getActiveRegion: jest.fn(() => ({ id: 'jp', seasons: [{ id: 'sakura' }] })),
}));
```

In `__tests__/screens/MapScreen.test.tsx`:
- Line 7: `jest.mock('@/stores/sakura-store'` → `jest.mock('@/stores/spot-store'`
- Update any `useSakuraStore` → `useSpotStore` references

In `__tests__/screens/HerbariumScreen.test.tsx`:
- Same pattern: update mock path and store name

- [ ] **Step 5: Update notify-bloom Edge Function**

In `supabase/functions/notify-bloom/index.ts` (line 19):
- `.from('sakura_spots')` → `.from('flower_spots')`

- [ ] **Step 6: Verify**

Run: `pnpm tsc --noEmit && pnpm test --no-coverage`
Expected: zero errors, all tests pass

- [ ] **Step 7: Commit**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git add src/stores/spot-store.ts src/app/\(tabs\)/herbarium.tsx src/app/\(tabs\)/map.tsx supabase/functions/notify-bloom/index.ts __tests__/stores/spot-store.test.ts __tests__/screens/MapScreen.test.tsx __tests__/screens/HerbariumScreen.test.tsx
git add -u src/stores/sakura-store.ts __tests__/stores/sakura-store.test.ts  # track deletions
git commit -m "refactor(m3): rename sakura-store → spot-store, update all consumers"
```

---

## Task 7: Component Decoupling — checkin + footprint + home (M4)

**Files:**
- Modify: `src/app/(tabs)/checkin.tsx`
- Modify: `src/app/(tabs)/footprint.tsx`
- Modify: `src/app/(tabs)/home.tsx`

- [ ] **Step 1: Update checkin.tsx**

Remove lines 27-31 (sakuraData import + SEASON_SPOTS map). Add import:
```typescript
import { loadSpotsData } from '@/services/content-pack';
```

Replace line 67:
```typescript
// OLD: const spotsData = SEASON_SPOTS[season.id];
const spotsData = loadSpotsData(season.id);
```

- [ ] **Step 2: Update footprint.tsx**

Remove sakuraData import (line 18) and SEASON_SPOTS map (line 27+). Add:
```typescript
import { loadSpotsData } from '@/services/content-pack';
```

Replace the spot name lookup to use `loadSpotsData(seasonId)` instead of `SEASON_SPOTS[seasonId]`.

- [ ] **Step 3: Update home.tsx**

Remove sakuraData import (line 29) and SEASON_SPOTS map (line 32+). Add:
```typescript
import { loadSpotsData } from '@/services/content-pack';
```

Replace line 49:
```typescript
// OLD: const spots = SEASON_SPOTS[season.id] ?? [];
const data = loadSpotsData(season.id);
const spots = data?.spots ?? [];
```

Note: `home.tsx` SEASON_SPOTS maps to `FlowerSpot[]` (not `SpotsData`), so extract `.spots` from the loader result.

- [ ] **Step 4: Verify**

Run: `pnpm tsc --noEmit && pnpm test --no-coverage`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git add src/app/\(tabs\)/checkin.tsx src/app/\(tabs\)/footprint.tsx src/app/\(tabs\)/home.tsx
git commit -m "refactor(m4): decouple checkin, footprint, home from hardcoded sakuraData"
```

---

## Task 8: Evolve seasons.ts (M4)

**Files:**
- Modify: `src/constants/seasons.ts`

- [ ] **Step 1: Rewrite seasons.ts to delegate to content pack**

Replace the entire `src/constants/seasons.ts` with:

```typescript
// src/constants/seasons.ts
// Season utilities — delegates to the active region's season list.
// SeasonConfig lives in types/region.ts; re-exported here for backward compatibility.

import { getActiveRegion } from '@/services/content-pack';
import type { SeasonConfig } from '@/types/region';

export type { SeasonConfig };

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

**Note:** No circular dependency concern — `SeasonConfig` was placed in `types/region.ts` in Task 1 specifically to prevent cycles. `seasons.ts` re-exports it and delegates to `content-pack.ts` safely.

- [ ] **Step 2: Verify no circular dependency**

Run: `pnpm tsc --noEmit`
Expected: zero errors, no circular dependency warnings.

- [ ] **Step 3: Verify**

Run: `pnpm tsc --noEmit && pnpm test --no-coverage`
Expected: all pass

- [ ] **Step 4: Commit**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git add src/constants/seasons.ts
git commit -m "refactor(m4): seasons.ts delegates to active region, remove hardcoded SEASONS array"
```

---

## Task 9: Final Verification (M4)

- [ ] **Step 1: Full type check**

Run: `pnpm tsc --noEmit`
Expected: zero errors

- [ ] **Step 2: Full test suite**

Run: `pnpm test --no-coverage`
Expected: all 417+ tests pass

- [ ] **Step 3: Verify no stale references remain**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
grep -r "sakura-store" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
grep -r "@/data/seasons/sakura" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
grep -r "SEASON_SPOTS" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

All three should return empty.

Acceptable remaining references:
- `sakura_spots` in `supabase/migrations/021_sakura_spots.sql` (historical, do not modify)
- `sakura` as a season ID in i18n keys and data (correct by design)
- `@/types/sakura` should return empty (all migrated to `@/types/spot`)

- [ ] **Step 4: Verify content pack loader works end-to-end**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
pnpm test -- content-pack.test --no-coverage --verbose
```

Expected: all 4 tests pass, including `spots have regionId field`.

- [ ] **Step 5: Commit (if any fixups needed)**

```bash
git add -A && git commit -m "chore: final cleanup for content pack architecture"
```

Only commit if there were fixups. If clean, skip.
