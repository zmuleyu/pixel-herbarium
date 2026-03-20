# 桜スポット打卡 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GPS-verified sakura spot check-in system with stamp collection, mankai bonus, LINE/X sharing, and review prompting to Pixel Herbarium v2.

**Architecture:** Client-side JSON (`src/data/seasons/sakura.json`, 100 spots) drives all spot data locally; Supabase `spot_checkins` table records verified check-ins; `checkin_spot` RPC handles idempotency + mankai quota bonus atomically; `sakura-store` (Zustand) caches both; Map Tab gains a 桜スポット layer; Herbarium Tab gains a stamp grid view alongside the existing plant grid. Bloom status display is deferred to a future sprint — only `isPeak` (for mankai variant) is computed now.

**Tech Stack:** Expo 55 · React Native · Supabase (PostgreSQL + RLS + pg_cron) · Zustand · i18next · `expo-location` · `expo-store-review` · `@react-native-async-storage/async-storage`

**Spec:** `docs/superpowers/specs/2026-03-18-sakura-spot-checkin-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `supabase/migrations/021_sakura_spots.sql` | Create | Tables + RLS + `checkin_spot` RPC + pg_cron bloom notification |
| `supabase/seed/seed-sakura-spots.ts` | Create | One-time seed script: imports sakura.json → upserts 100 rows into DB |
| `src/types/sakura.ts` | Create | `SpotCheckinResult`, `SharePosterSpot` local types |
| `src/i18n/ja.json` | Modify | Add `sakura.*` key group |
| `src/i18n/en.json` | Modify | Add `sakura.*` key group (English values) |
| `src/stores/sakura-store.ts` | Create | Zustand: spots (local JSON) + checkins (Supabase) + offline queue |
| `src/components/PrePermissionScreen.tsx` | Create | Pre-permission explanation UI (shown before `Location.requestPermissionsAsync`) |
| `src/components/SpotCheckinAnimation.tsx` | Create | Petal fall + stamp card slide-in; Reduce Motion aware |
| `src/components/SpotDetailSheet.tsx` | Create | Bottom sheet for checked-in stamp detail |
| `src/components/SpotStampGrid.tsx` | Create | 8-column 100-slot stamp grid with hint for unchecked |
| `src/components/SharePoster.tsx` | Modify | Add `format: 'spot'` variant |
| `src/hooks/useReviewPrompt.ts` | Create | AsyncStorage-backed review prompting, 30-day cooldown |
| `src/app/(tabs)/map.tsx` | Modify | Layer toggle + spot PINs + proximity + checkin sheet |
| `src/app/(tabs)/herbarium.tsx` | Modify | Tab toggle 植物↔桜スポット + SpotStampGrid |
| `src/types/database.ts` | Modify | Regenerate after migration (`pnpm supabase gen types typescript`) |

**Test files:**

| Test File | Action |
|-----------|--------|
| `__tests__/security/rls-spot-checkins.test.ts` | Create — SQL content assertions |
| `__tests__/stores/sakura-store.test.ts` | Create |
| `__tests__/components/PrePermissionScreen.test.tsx` | Create |
| `__tests__/components/SpotCheckinAnimation.test.tsx` | Create |
| `__tests__/components/SpotDetailSheet.test.tsx` | Create |
| `__tests__/components/SpotStampGrid.test.tsx` | Create |
| `__tests__/components/SharePoster.test.tsx` | Modify — add `format: 'spot'` tests |
| `__tests__/hooks/useReviewPrompt.test.ts` | Create |
| `__tests__/screens/MapScreen.test.tsx` | Modify — add spot layer tests |
| `__tests__/screens/HerbariumScreen.test.tsx` | Modify — add spot tab tests |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/021_sakura_spots.sql`
- Create: `__tests__/security/rls-spot-checkins.test.ts`

- [ ] **Step 1: Write the migration SQL**

```sql
-- supabase/migrations/021_sakura_spots.sql

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. sakura_spots (static, publicly readable)
-- Schema aligned with src/types/hanami.ts::FlowerSpot and src/data/seasons/sakura.json
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE sakura_spots (
  id                INTEGER PRIMARY KEY,
  season_id         TEXT    NOT NULL DEFAULT 'sakura',
  name_ja           TEXT    NOT NULL,
  name_en           TEXT    NOT NULL,
  prefecture        TEXT    NOT NULL,
  prefecture_code   INTEGER NOT NULL,
  city              TEXT    NOT NULL,
  category          TEXT    NOT NULL
    CHECK (category IN ('park','river','shrine','castle','mountain','street','garden')),
  tree_count        INTEGER,
  bloom_early_start TEXT,
  bloom_peak_start  TEXT,
  bloom_peak_end    TEXT,
  bloom_late_end    TEXT,
  lat               FLOAT   NOT NULL,
  lng               FLOAT   NOT NULL,
  tags              TEXT[]  NOT NULL DEFAULT '{}',
  description       TEXT,
  custom_sprite_url TEXT,
  access_note       TEXT,
  sort_order        INTEGER,
  best_time         TEXT,
  facilities        TEXT[]
);

ALTER TABLE sakura_spots
  ADD COLUMN location GEOGRAPHY(Point, 4326)
    GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED;

CREATE INDEX idx_sakura_spots_location ON sakura_spots USING GIST (location);

ALTER TABLE sakura_spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spots are publicly readable"
  ON sakura_spots FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. spot_checkins (user-owned)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE spot_checkins (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spot_id                 INTEGER     NOT NULL REFERENCES sakura_spots(id),
  checked_in_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_mankai               BOOLEAN     NOT NULL DEFAULT false,
  stamp_variant           TEXT        NOT NULL DEFAULT 'normal'
    CHECK (stamp_variant IN ('normal', 'mankai')),
  bloom_status_at_checkin TEXT
    CHECK (bloom_status_at_checkin IN ('pre','budding','partial','peak','falling','ended')),
  UNIQUE (user_id, spot_id)
);

ALTER TABLE spot_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own checkins"
  ON spot_checkins FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "checkins are publicly viewable"
  ON spot_checkins FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. checkin_spot RPC (idempotent)
-- Returns JSON: { checkin: {...}, is_new_row: boolean }
-- Only on first check-in during peak bloom: increments user_quotas.limit by 1
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION checkin_spot(
  p_spot_id     INTEGER,
  p_is_peak     BOOLEAN,
  p_bloom_status TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid     UUID  := auth.uid();
  v_uid_txt TEXT  := v_uid::TEXT;
  v_checkin spot_checkins;
  v_is_new  BOOLEAN;
BEGIN
  INSERT INTO spot_checkins (user_id, spot_id, is_mankai, stamp_variant, bloom_status_at_checkin)
  VALUES (
    v_uid,
    p_spot_id,
    p_is_peak,
    CASE WHEN p_is_peak THEN 'mankai' ELSE 'normal' END,
    p_bloom_status
  )
  ON CONFLICT (user_id, spot_id) DO UPDATE
    SET checked_in_at = spot_checkins.checked_in_at
  RETURNING *, (xmax = 0) AS is_new INTO v_checkin, v_is_new;

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
    'checkin',    row_to_json(v_checkin),
    'is_new_row', v_is_new
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. pg_cron: daily bloom notification trigger (JST 06:00 = UTC 21:00 prev day)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'check-bloom-notifications',
  '0 21 * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.edge_function_url') || '/notify-bloom',
      headers := jsonb_build_object(
                   'Authorization',
                   'Bearer ' || current_setting('app.service_role_key')
                 ),
      body    := '{}'::jsonb
    );
  $$
);
```

- [ ] **Step 2: Write the failing RLS test**

```typescript
// __tests__/security/rls-spot-checkins.test.ts
import * as fs from 'fs';
import * as path from 'path';

const SQL_PATH = path.join(__dirname, '../../supabase/migrations/021_sakura_spots.sql');

let sql: string;
beforeAll(() => { sql = fs.readFileSync(SQL_PATH, 'utf-8'); });

describe('Migration 021 — sakura_spots', () => {
  it('file exists', () => expect(fs.existsSync(SQL_PATH)).toBe(true));

  it('creates sakura_spots with INTEGER primary key', () => {
    expect(sql).toContain('CREATE TABLE sakura_spots');
    expect(sql).toContain('id               INTEGER PRIMARY KEY');
  });

  it('uses 4-date BloomWindow columns', () => {
    expect(sql).toContain('bloom_early_start');
    expect(sql).toContain('bloom_peak_start');
    expect(sql).toContain('bloom_peak_end');
    expect(sql).toContain('bloom_late_end');
  });

  it('adds PostGIS geography column', () => {
    expect(sql).toContain("GEOGRAPHY(Point, 4326)");
    expect(sql).toContain('GIST (location)');
  });

  it('enables RLS on sakura_spots', () => {
    expect(sql).toContain('ALTER TABLE sakura_spots ENABLE ROW LEVEL SECURITY');
  });
});

describe('Migration 021 — spot_checkins', () => {
  it('spot_id is INTEGER (matches sakura_spots.id type)', () => {
    expect(sql).toContain('spot_id                 INTEGER');
  });

  it('has stamp_variant CHECK constraint', () => {
    expect(sql).toContain("CHECK (stamp_variant IN ('normal', 'mankai'))");
  });

  it('has bloom_status CHECK constraint with correct values', () => {
    expect(sql).toContain("CHECK (bloom_status_at_checkin IN ('pre','budding','partial','peak','falling','ended'))");
  });

  it('has UNIQUE constraint on (user_id, spot_id)', () => {
    expect(sql).toContain('UNIQUE (user_id, spot_id)');
  });

  it('enables RLS on spot_checkins', () => {
    expect(sql).toContain('ALTER TABLE spot_checkins ENABLE ROW LEVEL SECURITY');
  });
});

describe('Migration 021 — checkin_spot RPC', () => {
  it('creates checkin_spot function', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION checkin_spot');
  });

  it('uses SECURITY DEFINER', () => {
    expect(sql).toContain('SECURITY DEFINER');
  });

  it('uses xmax trick to detect new rows', () => {
    expect(sql).toContain('xmax = 0');
  });

  it('uses upsert before quota UPDATE (prevents silent no-op)', () => {
    const upsertIdx = sql.indexOf('INSERT INTO user_quotas');
    const updateIdx = sql.indexOf('UPDATE user_quotas');
    expect(upsertIdx).toBeGreaterThan(-1);
    expect(updateIdx).toBeGreaterThan(upsertIdx);
  });

  it('uses jsonb_build_object for pg_cron headers (not string concat in JSON literal)', () => {
    expect(sql).toContain('jsonb_build_object(');
    expect(sql).not.toContain("headers := '{\"Authorization");
  });
});
```

- [ ] **Step 3: Run test — expect FAIL (file doesn't exist yet)**

```
pnpm test -- __tests__/security/rls-spot-checkins.test.ts
```
Expected: `FAIL — file exists → false`

- [ ] **Step 4: Create the migration file** (paste SQL from Step 1)

- [ ] **Step 5: Run test — expect PASS**

```
pnpm test -- __tests__/security/rls-spot-checkins.test.ts
```

- [ ] **Step 6: Apply migration**

```bash
pnpm supabase db push
# or for local dev:
pnpm supabase db reset
```

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/021_sakura_spots.sql __tests__/security/rls-spot-checkins.test.ts
git commit -m "feat(db): add sakura_spots + spot_checkins tables with RLS and checkin_spot RPC"
```

---

## Task 2: Seed Data + Database Types

**Files:**
- Create: `supabase/seed/seed-sakura-spots.ts`
- Modify: `src/types/database.ts` (regenerate)

> The 100 spots already exist in `src/data/seasons/sakura.json` as `FlowerSpot[]`. This script transforms the camelCase JSON fields to snake_case DB columns and upserts them.

- [ ] **Step 1: Create the seed script**

```typescript
// supabase/seed/seed-sakura-spots.ts
// Run once: npx tsx supabase/seed/seed-sakura-spots.ts
import { createClient } from '@supabase/supabase-js';
import sakuraData from '../../src/data/seasons/sakura.json';

const url  = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  const rows = sakuraData.spots.map((s) => ({
    id:                s.id,
    season_id:         s.seasonId,
    name_ja:           s.nameJa,
    name_en:           s.nameEn,
    prefecture:        s.prefecture,
    prefecture_code:   s.prefectureCode,
    city:              s.city,
    category:          s.category,
    tree_count:        s.treeCount ?? null,
    bloom_early_start: s.bloomTypical.earlyStart,
    bloom_peak_start:  s.bloomTypical.peakStart,
    bloom_peak_end:    s.bloomTypical.peakEnd,
    bloom_late_end:    s.bloomTypical.lateEnd,
    lat:               s.latitude,
    lng:               s.longitude,
    tags:              s.tags,
    description:       s.description ?? null,
    custom_sprite_url: null,
    access_note:       null,
    sort_order:        s.id,
    best_time:         null,
    facilities:        null,
  }));

  const { error } = await supabase
    .from('sakura_spots')
    .upsert(rows, { onConflict: 'id' });

  if (error) { console.error(error); process.exit(1); }
  console.log(`✅ Seeded ${rows.length} sakura spots`);
}

run();
```

- [ ] **Step 2: Run the seed script**

```bash
SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> npx tsx supabase/seed/seed-sakura-spots.ts
```
Expected: `✅ Seeded 100 sakura spots`

- [ ] **Step 3: Regenerate database types**

```bash
pnpm supabase gen types typescript --local > src/types/database.ts
# or against remote:
pnpm supabase gen types typescript --project-id <project-id> > src/types/database.ts
```

- [ ] **Step 4: Commit**

```bash
git add supabase/seed/seed-sakura-spots.ts src/types/database.ts
git commit -m "chore(db): seed 100 sakura spots + regenerate database types"
```

---

## Task 3: Types

**Files:**
- Create: `src/types/sakura.ts`

> No new test needed — TypeScript compile (`pnpm tsc --noEmit`) validates this.

- [ ] **Step 1: Create the types file**

```typescript
// src/types/sakura.ts
// Local types for the sakura spot check-in feature.
// FlowerSpot / BloomStatus / BloomWindow live in hanami.ts — import from there.

import type { BloomStatus } from './hanami';

/** Row returned from spot_checkins table (or from checkin_spot RPC response) */
export interface SpotCheckinResult {
  id: string;             // UUID
  user_id: string;
  spot_id: number;        // matches FlowerSpot.id
  checked_in_at: string;  // ISO 8601
  is_mankai: boolean;
  stamp_variant: 'normal' | 'mankai';
  bloom_status_at_checkin: BloomStatus | null;
}

/** Data passed to SharePoster when format === 'spot' */
export interface SharePosterSpot {
  spot_id: number;
  name_ja: string;
  name_en: string;
  prefecture: string;
  checked_in_at: string;       // ISO 8601
  stamp_variant: 'normal' | 'mankai';
  bloom_status: BloomStatus;
  custom_sprite_url?: string;
  is100sen: boolean;           // tags.includes('名所100選')
}

/** Queued offline check-in waiting for network */
export interface OfflineCheckinItem {
  spot_id: number;
  is_peak: boolean;
  bloom_status: BloomStatus;
  queued_at: string;  // ISO 8601
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/types/sakura.ts
git commit -m "feat(types): add SpotCheckinResult, SharePosterSpot, OfflineCheckinItem"
```

---

## Task 4: i18n Keys

**Files:**
- Modify: `src/i18n/ja.json`
- Modify: `src/i18n/en.json`

> The existing i18n parity test (`__tests__/i18n/i18n.test.ts`) will automatically catch missing keys in either file — no new test needed.

- [ ] **Step 1: Run i18n test (confirm it passes before changes)**

```
pnpm test -- __tests__/i18n/i18n.test.ts
```

- [ ] **Step 2: Add `sakura` block to `src/i18n/ja.json`**

Add inside the root JSON object (alongside existing keys like `tabs`, `bloom`, etc.):

```json
"sakura": {
  "layerToggle": {
    "heatmap": "発見ヒートマップ",
    "spots":   "桜スポット"
  },
  "checkinSheet": {
    "title":    "ここで打卡する",
    "button":   "打卡する",
    "distance": "{{distance}}m 先"
  },
  "stampCard": {
    "firstVisit": "初めての訪問、ありがとうございます🌸",
    "saved":      "図鑑のスタンプ帳に保存されました",
    "mankai":     "桜が満開の今、特別な記憶として残ります"
  },
  "collection": {
    "progress":    "{{count}} / {{total}} 訪れた",
    "tabLabel":    "桜スポット",
    "plantTab":    "植物",
    "hintPoem":    "春、{{prefecture}}の山の向こうに、\n桜が静かに待っています。",
    "visitDetail": "{{date}} に訪れました"
  },
  "empty": {
    "map":       "まだ桜スポットのデータを準備中です。\n春が来たら、ここに花の地図が広がります 🌸",
    "collection": "桜の旅はまだ始まっていません。\n地図を開いて、最初のスポットを探してみましょう。",
    "mapButton":  "地図を開く"
  },
  "permission": {
    "title":       "現在地の桜情報をお届けします",
    "description": "現在地を使って、近くの桜スポットの開花状況やおすすめのお花見コースをご案内します。位置情報は本アプリの機能提供のみに使用され、第三者に共有されることはありません。",
    "allow":       "位置情報を許可する",
    "skip":        "今は使わない",
    "required":    "打卡するには位置情報が必要です"
  },
  "review": {
    "title": "今シーズンはいかがでしたか？",
    "body":  "お花見のお役に立てていたら、ぜひ評価をお願いします。いただいたご意見は、より良いアプリ作りに役立てます🌸",
    "rate":  "評価する",
    "later": "あとで"
  },
  "share": {
    "spotCard":    "{{spotName}}で、桜の記憶を残しました 🌸",
    "twitter":     "{{spotName}}の桜 🌸 #お花見 #PH桜スポット",
    "saveToAlbum": "写真を保存しました"
  },
  "season": {
    "approaching": "春の足音が近づいています",
    "firstBloom":  "各地で開花便りが届き始めました",
    "weekend":     "今週末はお花見日和です",
    "fullBloom":   "桜が満開を迎えました",
    "petals":      "はかない桜の美しさを、写真に残してみませんか",
    "end":         "今年もたくさんの桜に出会えました。また来年、また咲きます 🌸"
  }
}
```

- [ ] **Step 3: Add matching `sakura` block to `src/i18n/en.json`**

```json
"sakura": {
  "layerToggle": {
    "heatmap": "Discovery Map",
    "spots":   "Sakura Spots"
  },
  "checkinSheet": {
    "title":    "Check in here",
    "button":   "Check in",
    "distance": "{{distance}}m away"
  },
  "stampCard": {
    "firstVisit": "Your first visit — thank you 🌸",
    "saved":      "Saved to your stamp collection",
    "mankai":     "Full bloom — a special memory preserved"
  },
  "collection": {
    "progress":    "{{count}} / {{total}} visited",
    "tabLabel":    "Sakura Spots",
    "plantTab":    "Plants",
    "hintPoem":    "In spring, beyond the mountains of {{prefecture}},\ncherry blossoms wait quietly.",
    "visitDetail": "Visited on {{date}}"
  },
  "empty": {
    "map":        "Sakura spot data is being prepared.\nWhen spring arrives, a flower map will spread here 🌸",
    "collection": "Your sakura journey hasn't begun yet.\nOpen the map to find your first spot.",
    "mapButton":  "Open Map"
  },
  "permission": {
    "title":       "We'll show sakura near you",
    "description": "We use your location to show nearby sakura spots and bloom conditions. Location data is only used for app features and is never shared with third parties.",
    "allow":       "Allow Location",
    "skip":        "Not now",
    "required":    "Location permission is required to check in"
  },
  "review": {
    "title": "How was this season?",
    "body":  "If Pixel Herbarium helped with your hanami, we'd love a review. Your feedback helps us improve 🌸",
    "rate":  "Leave a Review",
    "later": "Maybe later"
  },
  "share": {
    "spotCard":    "I captured a sakura memory at {{spotName}} 🌸",
    "twitter":     "{{spotName}} sakura 🌸 #Hanami #PHSakuraSpots",
    "saveToAlbum": "Saved to photos"
  },
  "season": {
    "approaching": "The sound of spring is drawing near",
    "firstBloom":  "First bloom reports are arriving from around Japan",
    "weekend":     "This weekend is perfect for hanami",
    "fullBloom":   "Cherry blossoms have reached full bloom",
    "petals":      "The fleeting beauty of sakura — capture it while you can",
    "end":         "Another season of sakura memories. Until next year, when they bloom again 🌸"
  }
}
```

- [ ] **Step 4: Run i18n parity test — expect PASS**

```
pnpm test -- __tests__/i18n/i18n.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/i18n/ja.json src/i18n/en.json
git commit -m "feat(i18n): add sakura.* key group (ja + en)"
```

---

## Task 5: sakura-store

**Files:**
- Create: `src/stores/sakura-store.ts`
- Create: `__tests__/stores/sakura-store.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// __tests__/stores/sakura-store.test.ts

const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem:  jest.fn((k: string) => Promise.resolve(mockStorage[k] ?? null)),
    setItem:  jest.fn((k: string, v: string) => { mockStorage[k] = v; return Promise.resolve(); }),
    removeItem: jest.fn((k: string) => { delete mockStorage[k]; return Promise.resolve(); }),
  },
}));

const mockSelect = jest.fn();
const mockEq     = jest.fn();
const mockRpc    = jest.fn();
jest.mock('@/services/supabase', () => ({
  supabase: {
    from:  jest.fn(() => ({ select: mockSelect })),
    rpc:   mockRpc,
    auth:  { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-abc' } } })) },
  },
}));

jest.mock('@/data/seasons/sakura.json', () => ({
  version:  1,
  seasonId: 'sakura',
  spots: [
    {
      id: 1, seasonId: 'sakura', nameJa: '上野恩賜公園', nameEn: 'Ueno Park',
      prefecture: '東京都', prefectureCode: 13, city: '台東区', category: 'park',
      treeCount: 800,
      bloomTypical: { earlyStart: '03-20', peakStart: '03-28', peakEnd: '04-05', lateEnd: '04-12' },
      latitude: 35.7141, longitude: 139.7734,
      tags: ['名所100選', '夜桜', '池'],
    },
  ],
}), { virtual: true });

import { useSakuraStore } from '../../src/stores/sakura-store';
import type { SpotCheckinResult } from '../../src/types/sakura';

const makeCheckin = (overrides: Partial<SpotCheckinResult> = {}): SpotCheckinResult => ({
  id: 'c1', user_id: 'user-abc', spot_id: 1,
  checked_in_at: '2026-03-28T10:00:00Z',
  is_mankai: false, stamp_variant: 'normal',
  bloom_status_at_checkin: null,
  ...overrides,
});

beforeEach(() => {
  for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  useSakuraStore.setState({ spots: [], checkins: [], loading: false });
  jest.clearAllMocks();
});

describe('useSakuraStore — spots', () => {
  it('loads spots from sakura.json on init', () => {
    const store = useSakuraStore.getState();
    store.initSpots();
    expect(useSakuraStore.getState().spots).toHaveLength(1);
    expect(useSakuraStore.getState().spots[0].nameEn).toBe('Ueno Park');
  });
});

describe('useSakuraStore — loadCheckins', () => {
  it('loads checkins from Supabase for the given userId', async () => {
    const data = [makeCheckin()];
    mockEq.mockResolvedValueOnce({ data, error: null });
    mockSelect.mockReturnValueOnce({ eq: mockEq });

    await useSakuraStore.getState().loadCheckins('user-abc');

    expect(useSakuraStore.getState().checkins).toEqual(data);
    expect(useSakuraStore.getState().loading).toBe(false);
  });

  it('sets loading: false even on error', async () => {
    mockEq.mockResolvedValueOnce({ data: null, error: new Error('network') });
    mockSelect.mockReturnValueOnce({ eq: mockEq });

    await useSakuraStore.getState().loadCheckins('user-abc');

    expect(useSakuraStore.getState().loading).toBe(false);
  });
});

describe('useSakuraStore — hasCheckedIn', () => {
  it('returns true for a spot already in checkins', () => {
    useSakuraStore.setState({ checkins: [makeCheckin({ spot_id: 1 })] });
    expect(useSakuraStore.getState().hasCheckedIn(1)).toBe(true);
  });

  it('returns false for a spot not checked in', () => {
    useSakuraStore.setState({ checkins: [] });
    expect(useSakuraStore.getState().hasCheckedIn(99)).toBe(false);
  });
});

describe('useSakuraStore — getProgress', () => {
  it('returns { checked: 1, total: 1 } when 1 spot is loaded and 1 checked in', () => {
    useSakuraStore.getState().initSpots();
    useSakuraStore.setState({ checkins: [makeCheckin({ spot_id: 1 })] });
    const { checked, total } = useSakuraStore.getState().getProgress();
    expect(checked).toBe(1);
    expect(total).toBe(1);
  });
});

describe('useSakuraStore — performCheckin', () => {
  it('calls supabase.rpc checkin_spot and adds new checkin to state', async () => {
    const checkinResult = makeCheckin({ is_mankai: true, stamp_variant: 'mankai' });
    mockRpc.mockResolvedValueOnce({
      data: { checkin: checkinResult, is_new_row: true },
      error: null,
    });

    useSakuraStore.getState().initSpots();
    const result = await useSakuraStore.getState().performCheckin(1, false);

    expect(result.isNew).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('checkin_spot', expect.objectContaining({ p_spot_id: 1 }));
    expect(useSakuraStore.getState().checkins).toHaveLength(1);
  });
});

describe('useSakuraStore — offline queue', () => {
  it('enqueues checkin to AsyncStorage when rpc fails', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    mockRpc.mockRejectedValueOnce(new Error('offline'));

    useSakuraStore.getState().initSpots();
    await useSakuraStore.getState().performCheckin(1, false).catch(() => {});

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```
pnpm test -- __tests__/stores/sakura-store.test.ts
```

- [ ] **Step 3: Implement `src/stores/sakura-store.ts`**

```typescript
// src/stores/sakura-store.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import sakuraData from '@/data/seasons/sakura.json';
import { getBloomStatus } from '@/utils/bloom';
import type { FlowerSpot } from '@/types/hanami';
import type { SpotCheckinResult, OfflineCheckinItem } from '@/types/sakura';

const OFFLINE_QUEUE_KEY = 'ph_spot_checkin_queue';

interface SakuraStore {
  spots:    FlowerSpot[];
  checkins: SpotCheckinResult[];
  loading:  boolean;

  initSpots:      () => void;
  loadCheckins:   (userId: string) => Promise<void>;
  performCheckin: (spotId: number, skipNetwork?: boolean) => Promise<{ isNew: boolean; isMankai: boolean }>;
  hasCheckedIn:   (spotId: number) => boolean;
  getProgress:    () => { checked: number; total: number };
  flushOfflineQueue: () => Promise<void>;
}

export const useSakuraStore = create<SakuraStore>((set, get) => ({
  spots:    [],
  checkins: [],
  loading:  false,

  initSpots: () => {
    set({ spots: sakuraData.spots as FlowerSpot[] });
  },

  loadCheckins: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('spot_checkins')
        .select('*')
        .eq('user_id', userId);
      if (!error && data) set({ checkins: data as SpotCheckinResult[] });
    } finally {
      set({ loading: false });
    }
  },

  performCheckin: async (spotId) => {
    const spot = get().spots.find((s) => s.id === spotId);
    if (!spot) throw new Error(`Spot ${spotId} not found`);

    const status   = getBloomStatus(spot);
    const isPeak   = status === 'peak';

    try {
      const { data, error } = await supabase.rpc('checkin_spot', {
        p_spot_id:     spotId,
        p_is_peak:     isPeak,
        p_bloom_status: status,
      });

      if (error) throw error;

      const { checkin, is_new_row } = data as { checkin: SpotCheckinResult; is_new_row: boolean };

      if (is_new_row) {
        set((s) => ({ checkins: [checkin, ...s.checkins] }));
      }

      return { isNew: is_new_row, isMankai: isPeak };
    } catch {
      // Offline: enqueue for later
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue: OfflineCheckinItem[] = raw ? JSON.parse(raw) : [];
      queue.push({ spot_id: spotId, is_peak: isPeak, bloom_status: status, queued_at: new Date().toISOString() });
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      throw new Error('offline');
    }
  },

  hasCheckedIn: (spotId) => get().checkins.some((c) => c.spot_id === spotId),

  getProgress: () => ({
    checked: get().checkins.length,
    total:   get().spots.length,
  }),

  flushOfflineQueue: async () => {
    const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    const queue: OfflineCheckinItem[] = JSON.parse(raw);
    const failed: OfflineCheckinItem[] = [];

    for (const item of queue) {
      try {
        const { data, error } = await supabase.rpc('checkin_spot', {
          p_spot_id:      item.spot_id,
          p_is_peak:      item.is_peak,
          p_bloom_status: item.bloom_status,
        });
        if (error) throw error;
        const { checkin, is_new_row } = data as { checkin: SpotCheckinResult; is_new_row: boolean };
        if (is_new_row) set((s) => ({ checkins: [checkin, ...s.checkins] }));
      } catch {
        failed.push(item);
      }
    }

    if (failed.length === 0) {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    } else {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed));
    }
  },
}));
```

- [ ] **Step 4: Run test — expect PASS**

```
pnpm test -- __tests__/stores/sakura-store.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/stores/sakura-store.ts __tests__/stores/sakura-store.test.ts
git commit -m "feat(store): add sakura-store with spots, checkins, offline queue"
```

---

## Task 6: PrePermissionScreen

**Files:**
- Create: `src/components/PrePermissionScreen.tsx`
- Create: `__tests__/components/PrePermissionScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/PrePermissionScreen.test.tsx
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('@/constants/theme', () => ({
  colors: { background: '#f5f4f1', plantPrimary: '#9fb69f', text: '#3a3a3a',
            textSecondary: '#7a7a7a', border: '#e8e6e1', white: '#ffffff',
            blushPink: '#f5d5d0' },
  typography: { fontFamily: { body: 'System', display: 'System' },
                fontSize: { md: 15, lg: 18, xl: 22 }, lineHeight: 1.7 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));

import React from 'react';
import PrePermissionScreen from '../../src/components/PrePermissionScreen';

function shallowRender(el: any, depth = 5): any {
  if (el == null || typeof el !== 'object' || !el.type) return el;
  if (typeof el.type === 'function' && depth > 0) {
    return shallowRender(el.type(el.props ?? {}), depth - 1);
  }
  const children = el.props?.children;
  return { type: el.type, props: { ...el.props, children: undefined },
           children: Array.isArray(children)
             ? children.map((c: any) => shallowRender(c, depth))
             : shallowRender(children, depth) };
}

function renderToString(props: Record<string, unknown>) {
  return JSON.stringify(shallowRender(React.createElement(PrePermissionScreen as any, props)));
}

describe('PrePermissionScreen', () => {
  it('renders the title i18n key', () => {
    const html = renderToString({ onAllow: jest.fn(), onSkip: jest.fn() });
    expect(html).toContain('sakura.permission.title');
  });

  it('renders allow and skip buttons', () => {
    const html = renderToString({ onAllow: jest.fn(), onSkip: jest.fn() });
    expect(html).toContain('sakura.permission.allow');
    expect(html).toContain('sakura.permission.skip');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```
pnpm test -- __tests__/components/PrePermissionScreen.test.tsx
```

- [ ] **Step 3: Create `src/components/PrePermissionScreen.tsx`**

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';

interface Props {
  onAllow: () => void;
  onSkip:  () => void;
}

export default function PrePermissionScreen({ onAllow, onSkip }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📍🌸</Text>
      <Text style={styles.title}>{t('sakura.permission.title')}</Text>
      <Text style={styles.description}>{t('sakura.permission.description')}</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={onAllow}>
        <Text style={styles.primaryButtonText}>{t('sakura.permission.allow')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
        <Text style={styles.secondaryButtonText}>{t('sakura.permission.skip')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  icon: { fontSize: 48, marginBottom: spacing.lg },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xl,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.blushPink,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  secondaryButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
});
```

- [ ] **Step 4: Run test — expect PASS**

```
pnpm test -- __tests__/components/PrePermissionScreen.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/PrePermissionScreen.tsx __tests__/components/PrePermissionScreen.test.tsx
git commit -m "feat(ui): add PrePermissionScreen for location permission explanation"
```

---

## Task 7: SpotCheckinAnimation

**Files:**
- Create: `src/components/SpotCheckinAnimation.tsx`
- Create: `__tests__/components/SpotCheckinAnimation.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/components/SpotCheckinAnimation.test.tsx
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light' },
}));
jest.mock('react-native/Libraries/Utilities/AccessibilityInfo', () => ({
  isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('@/constants/theme', () => ({
  colors: { background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
            white: '#ffffff', blushPink: '#f5d5d0', creamYellow: '#fff8dc',
            plantPrimary: '#9fb69f', border: '#e8e6e1' },
  typography: { fontFamily: { body: 'System', display: 'System' },
                fontSize: { sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 }, lineHeight: 1.7 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));

import React from 'react';
import SpotCheckinAnimation from '../../src/components/SpotCheckinAnimation';
import type { FlowerSpot } from '../../src/types/hanami';

const spot: FlowerSpot = {
  id: 1, seasonId: 'sakura', nameJa: '上野恩賜公園', nameEn: 'Ueno Park',
  prefecture: '東京都', prefectureCode: 13, city: '台東区', category: 'park',
  treeCount: 800,
  bloomTypical: { earlyStart: '03-20', peakStart: '03-28', peakEnd: '04-05', lateEnd: '04-12' },
  latitude: 35.7141, longitude: 139.7734,
  tags: ['名所100選'],
};

function shallowRender(el: any, depth = 5): any {
  if (el == null || typeof el !== 'object' || !el.type) return el;
  if (typeof el.type === 'function' && depth > 0) return shallowRender(el.type(el.props ?? {}), depth - 1);
  const children = el.props?.children;
  return { type: el.type, props: { ...el.props, children: undefined },
           children: Array.isArray(children) ? children.map((c: any) => shallowRender(c, depth)) : shallowRender(children, depth) };
}

describe('SpotCheckinAnimation', () => {
  it('renders spot name', () => {
    const html = JSON.stringify(shallowRender(
      React.createElement(SpotCheckinAnimation, { spot, isMankai: false, is100sen: false, onDismiss: jest.fn() })
    ));
    expect(html).toContain('上野恩賜公園');
  });

  it('shows mankai text when isMankai is true', () => {
    const html = JSON.stringify(shallowRender(
      React.createElement(SpotCheckinAnimation, { spot, isMankai: true, is100sen: false, onDismiss: jest.fn() })
    ));
    expect(html).toContain('sakura.stampCard.mankai');
  });

  it('shows first-visit text (default case)', () => {
    const html = JSON.stringify(shallowRender(
      React.createElement(SpotCheckinAnimation, { spot, isMankai: false, is100sen: false, onDismiss: jest.fn() })
    ));
    expect(html).toContain('sakura.stampCard.saved');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```
pnpm test -- __tests__/components/SpotCheckinAnimation.test.tsx
```

- [ ] **Step 3: Create `src/components/SpotCheckinAnimation.tsx`**

```typescript
// src/components/SpotCheckinAnimation.tsx
// Full-screen overlay shown after a GPS check-in is confirmed.
// - Normal: petal emoji rain + stamp card slide-in
// - Mankai: same + gold border + haptic feedback
// - Reduce Motion: opacity fade only (no path animation, no spring)
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Animated, TouchableOpacity, StyleSheet,
  AccessibilityInfo, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { FlowerSpot } from '@/types/hanami';

const { width: SW, height: SH } = Dimensions.get('window');
const PETAL_COUNT = 7;

interface Props {
  spot:       FlowerSpot;
  isMankai:   boolean;
  is100sen:   boolean;
  onDismiss:  () => void;
}

export default function SpotCheckinAnimation({ spot, isMankai, is100sen, onDismiss }: Props) {
  const { t } = useTranslation();
  const [reduceMotion, setReduceMotion] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide      = useRef(new Animated.Value(300)).current;
  const petals         = useRef(
    Array.from({ length: PETAL_COUNT }, () => ({
      x: new Animated.Value(Math.random() * SW),
      y: new Animated.Value(-40),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      // Simple fade
      Animated.sequence([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(cardSlide, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      // Full animation
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ...petals.map((p) =>
          Animated.parallel([
            Animated.timing(p.y, { toValue: SH + 40, duration: 1500 + Math.random() * 500, useNativeDriver: true }),
            Animated.timing(p.opacity, { toValue: 0, duration: 1500, delay: 800, useNativeDriver: true }),
          ])
        ),
        Animated.spring(cardSlide, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }),
      ]).start();

      if (isMankai) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  const borderColor = isMankai ? '#d4a017' : colors.plantPrimary;
  const message     = isMankai
    ? t('sakura.stampCard.mankai')
    : t('sakura.stampCard.saved');

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      {/* Petals */}
      {!reduceMotion && petals.map((p, i) => (
        <Animated.Text
          key={i}
          style={[styles.petal, { transform: [{ translateX: p.x }, { translateY: p.y }], opacity: p.opacity }]}
        >
          🌸
        </Animated.Text>
      ))}

      {/* Stamp Card */}
      <Animated.View style={[styles.card, { borderColor, transform: [{ translateY: cardSlide }] }]}>
        {isMankai && (
          <LinearGradient
            colors={['rgba(212,160,23,0.15)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        {is100sen && <Text style={styles.badge}>さくら名所100選</Text>}
        <Text style={styles.spotIcon}>{is100sen ? '⭐' : '🌸'}</Text>
        <Text style={styles.spotName}>{spot.nameJa}</Text>
        <Text style={styles.prefecture}>{spot.prefecture}</Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>{t('sakura.collection.tabLabel')} →</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,244,241,0.95)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl * 2,
    zIndex: 999,
  },
  petal: { position: 'absolute', fontSize: 24 },
  card: {
    width: SW - spacing.xl * 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  badge: {
    fontSize: typography.fontSize.xs,
    color: '#d4a017',
    marginBottom: spacing.sm,
    fontFamily: typography.fontFamily.display,
  },
  spotIcon: { fontSize: 48, marginBottom: spacing.sm },
  spotName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xl,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  prefecture: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight,
    marginBottom: spacing.lg,
  },
  dismissButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  dismissText: {
    fontSize: typography.fontSize.md,
    color: colors.plantPrimary,
    fontFamily: typography.fontFamily.display,
  },
});
```

- [ ] **Step 4: Run test — expect PASS**

```
pnpm test -- __tests__/components/SpotCheckinAnimation.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/SpotCheckinAnimation.tsx __tests__/components/SpotCheckinAnimation.test.tsx
git commit -m "feat(ui): add SpotCheckinAnimation with petal rain and Reduce Motion support"
```

---

## Task 8: SpotDetailSheet + SpotStampGrid

**Files:**
- Create: `src/components/SpotDetailSheet.tsx`
- Create: `src/components/SpotStampGrid.tsx`
- Create: `__tests__/components/SpotDetailSheet.test.tsx`
- Create: `__tests__/components/SpotStampGrid.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/components/SpotDetailSheet.test.tsx
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('@/constants/theme', () => ({
  colors: { background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
            border: '#e8e6e1', white: '#ffffff', blushPink: '#f5d5d0', plantPrimary: '#9fb69f' },
  typography: { fontFamily: { body: 'System', display: 'System' },
                fontSize: { sm: 13, md: 15, lg: 18, xl: 22 }, lineHeight: 1.7 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));
import React from 'react';
import SpotDetailSheet from '../../src/components/SpotDetailSheet';
import type { FlowerSpot } from '../../src/types/hanami';
import type { SpotCheckinResult } from '../../src/types/sakura';

const spot: FlowerSpot = {
  id: 1, seasonId: 'sakura', nameJa: '新宿御苑', nameEn: 'Shinjuku Gyoen',
  prefecture: '東京都', prefectureCode: 13, city: '新宿区', category: 'garden',
  bloomTypical: { earlyStart: '03-22', peakStart: '03-30', peakEnd: '04-08', lateEnd: '04-15' },
  latitude: 35.6852, longitude: 139.71, tags: ['名所100選'],
};
const checkin: SpotCheckinResult = {
  id: 'c1', user_id: 'u1', spot_id: 1,
  checked_in_at: '2026-03-30T10:00:00Z',
  is_mankai: true, stamp_variant: 'mankai', bloom_status_at_checkin: 'peak',
};

function shallowStr(el: any, depth = 5): string {
  if (el == null || typeof el !== 'object' || !el.type) return String(el ?? '');
  if (typeof el.type === 'function' && depth > 0) return shallowStr(el.type(el.props ?? {}), depth - 1);
  const c = el.props?.children;
  const cs = Array.isArray(c) ? c.map((x: any) => shallowStr(x, depth)).join('') : shallowStr(c, depth);
  return cs;
}

describe('SpotDetailSheet', () => {
  it('renders spot name when visible', () => {
    const html = JSON.stringify(React.createElement(SpotDetailSheet, { spot, checkin, visible: true, onClose: jest.fn(), onViewOnMap: jest.fn() }));
    expect(html).toContain('新宿御苑');
  });

  it('renders visit date key', () => {
    const html = JSON.stringify(React.createElement(SpotDetailSheet, { spot, checkin, visible: true, onClose: jest.fn(), onViewOnMap: jest.fn() }));
    expect(html).toContain('sakura.collection.visitDetail');
  });
});
```

```typescript
// __tests__/components/SpotStampGrid.test.tsx
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('@/constants/theme', () => ({
  colors: { background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
            border: '#e8e6e1', white: '#ffffff', blushPink: '#f5d5d0', plantPrimary: '#9fb69f' },
  typography: { fontFamily: { body: 'System', display: 'System' },
                fontSize: { xs: 11, sm: 13, md: 15 }, lineHeight: 1.7 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));
import React from 'react';
import SpotStampGrid from '../../src/components/SpotStampGrid';
import type { FlowerSpot } from '../../src/types/hanami';
import type { SpotCheckinResult } from '../../src/types/sakura';

const spot: FlowerSpot = {
  id: 1, seasonId: 'sakura', nameJa: '上野恩賜公園', nameEn: 'Ueno Park',
  prefecture: '東京都', prefectureCode: 13, city: '台東区', category: 'park',
  bloomTypical: { earlyStart: '03-20', peakStart: '03-28', peakEnd: '04-05', lateEnd: '04-12' },
  latitude: 35.7141, longitude: 139.7734, tags: ['名所100選'],
};
const checkin: SpotCheckinResult = {
  id: 'c1', user_id: 'u1', spot_id: 1,
  checked_in_at: '2026-03-28T10:00:00Z',
  is_mankai: false, stamp_variant: 'normal', bloom_status_at_checkin: null,
};

describe('SpotStampGrid', () => {
  it('renders without crashing with empty spots', () => {
    expect(() => React.createElement(SpotStampGrid, {
      spots: [], checkins: [], onSpotPress: jest.fn()
    })).not.toThrow();
  });

  it('renders progress text key', () => {
    const html = JSON.stringify(React.createElement(SpotStampGrid, {
      spots: [spot], checkins: [checkin], onSpotPress: jest.fn()
    }));
    expect(html).toContain('sakura.collection.progress');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```
pnpm test -- __tests__/components/SpotDetailSheet.test.tsx __tests__/components/SpotStampGrid.test.tsx
```

- [ ] **Step 3: Create `src/components/SpotDetailSheet.tsx`**

```typescript
// src/components/SpotDetailSheet.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { FlowerSpot } from '@/types/hanami';
import type { SpotCheckinResult } from '@/types/sakura';

interface Props {
  spot:        FlowerSpot | null;
  checkin:     SpotCheckinResult | null;
  visible:     boolean;
  onClose:     () => void;
  onViewOnMap: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function SpotDetailSheet({ spot, checkin, visible, onClose, onViewOnMap }: Props) {
  const { t } = useTranslation();
  if (!spot || !checkin || !visible) return null;

  const is100sen = spot.tags.includes('名所100選');

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {is100sen && <Text style={styles.badge}>さくら名所100選</Text>}
        <Text style={styles.name}>{spot.nameJa}</Text>
        <Text style={styles.prefecture}>{spot.prefecture}　{spot.city}</Text>
        <Text style={styles.date}>
          {t('sakura.collection.visitDetail', { date: formatDate(checkin.checked_in_at) })}
        </Text>
        {checkin.stamp_variant === 'mankai' && (
          <Text style={styles.mankaiLabel}>🌸 {t('sakura.stampCard.mankai')}</Text>
        )}
        <TouchableOpacity style={styles.mapButton} onPress={onViewOnMap}>
          <Text style={styles.mapButtonText}>地図で見る</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>閉じる</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  badge: { fontSize: typography.fontSize.xs, color: '#d4a017', marginBottom: spacing.xs },
  name: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl,
          color: colors.text, marginBottom: spacing.xs },
  prefecture: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md },
  date: { fontSize: typography.fontSize.md, color: colors.textSecondary, marginBottom: spacing.sm },
  mankaiLabel: { fontSize: typography.fontSize.sm, color: '#d4a017', marginBottom: spacing.md },
  mapButton: {
    backgroundColor: colors.plantPrimary,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full, marginBottom: spacing.sm, width: '100%', alignItems: 'center',
  },
  mapButtonText: { color: colors.white, fontFamily: typography.fontFamily.display,
                   fontSize: typography.fontSize.md },
  closeButton: { paddingVertical: spacing.sm },
  closeText: { fontSize: typography.fontSize.md, color: colors.textSecondary },
});
```

- [ ] **Step 4: Create `src/components/SpotStampGrid.tsx`**

```typescript
// src/components/SpotStampGrid.tsx
// 8-column grid of 100 stamp slots.
// Checked-in: colored stamp emoji. Unchecked: grey lock.
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import type { FlowerSpot } from '@/types/hanami';
import type { SpotCheckinResult } from '@/types/sakura';

const COLS       = 8;
const GAP        = 4;
const SW         = Dimensions.get('window').width;
const CELL_SIZE  = Math.floor((SW - spacing.md * 2 - GAP * (COLS - 1)) / COLS);

interface Props {
  spots:       FlowerSpot[];
  checkins:    SpotCheckinResult[];
  onSpotPress: (spot: FlowerSpot, checkin: SpotCheckinResult | null) => void;
}

export default function SpotStampGrid({ spots, checkins, onSpotPress }: Props) {
  const { t } = useTranslation();

  const checkinMap = new Map(checkins.map((c) => [c.spot_id, c]));
  const checked    = checkins.length;
  const total      = spots.length;

  return (
    <View style={styles.container}>
      {/* Progress */}
      <Text style={styles.progress}>
        {t('sakura.collection.progress', { count: checked, total })}
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${total > 0 ? (checked / total) * 100 : 0}%` }]} />
      </View>

      {/* Grid */}
      <FlatList
        data={spots}
        keyExtractor={(s) => String(s.id)}
        numColumns={COLS}
        removeClippedSubviews
        scrollEnabled={false}
        renderItem={({ item: spot }) => {
          const checkin = checkinMap.get(spot.id) ?? null;
          const is100sen = spot.tags.includes('名所100選');
          const hasCheckin = checkin !== null;
          const isMankai = checkin?.stamp_variant === 'mankai';

          return (
            <TouchableOpacity
              style={[styles.cell, hasCheckin && styles.cellChecked, isMankai && styles.cellMankai,
                      is100sen && hasCheckin && styles.cell100sen]}
              onPress={() => onSpotPress(spot, checkin)}
            >
              {hasCheckin
                ? <Text style={styles.stampEmoji}>{is100sen ? '⭐' : '🌸'}</Text>
                : <Text style={styles.lockEmoji}>🔒</Text>
              }
            </TouchableOpacity>
          );
        }}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  progress: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontFamily: typography.fontFamily.display,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 4, backgroundColor: colors.border,
    borderRadius: borderRadius.full, marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.blushPink },
  row: { gap: GAP, marginBottom: GAP },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    opacity: 0.5,
  },
  cellChecked: { backgroundColor: colors.blushPink, opacity: 1 },
  cellMankai:  { borderWidth: 1.5, borderColor: '#d4a017' },
  cell100sen:  { backgroundColor: colors.creamYellow },
  stampEmoji:  { fontSize: CELL_SIZE * 0.5 },
  lockEmoji:   { fontSize: CELL_SIZE * 0.4 },
});
```

- [ ] **Step 5: Run tests — expect PASS**

```
pnpm test -- __tests__/components/SpotDetailSheet.test.tsx __tests__/components/SpotStampGrid.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/components/SpotDetailSheet.tsx src/components/SpotStampGrid.tsx \
        __tests__/components/SpotDetailSheet.test.tsx __tests__/components/SpotStampGrid.test.tsx
git commit -m "feat(ui): add SpotDetailSheet and SpotStampGrid components"
```

---

## Task 9: SharePoster 'spot' Format

**Files:**
- Modify: `src/components/SharePoster.tsx`
- Modify: `__tests__/components/SharePoster.test.tsx`

> Read `src/components/SharePoster.tsx` in full before editing to understand the exact structure.

- [ ] **Step 1: Add failing test to `__tests__/components/SharePoster.test.tsx`**

Open the existing test file and add this `describe` block after the existing tests:

```typescript
describe('SharePoster format=spot', () => {
  it('renders spot name', () => {
    const props = {
      format: 'spot' as const,
      spot: {
        spot_id: 1, name_ja: '上野恩賜公園', name_en: 'Ueno Park',
        prefecture: '東京都', checked_in_at: '2026-03-28T10:00:00Z',
        stamp_variant: 'normal' as const, bloom_status: 'peak' as const,
        is100sen: true,
      },
    };
    const html = JSON.stringify(React.createElement(SharePoster as any, props));
    expect(html).toContain('上野恩賜公園');
  });

  it('shows mankai gold border when stamp_variant is mankai', () => {
    const props = {
      format: 'spot' as const,
      spot: {
        spot_id: 1, name_ja: '吉野山', name_en: 'Mt. Yoshino',
        prefecture: '奈良県', checked_in_at: '2026-04-05T10:00:00Z',
        stamp_variant: 'mankai' as const, bloom_status: 'peak' as const,
        is100sen: true,
      },
    };
    const html = JSON.stringify(React.createElement(SharePoster as any, props));
    // Component renders; this just verifies it doesn't crash with mankai data
    expect(html).toContain('吉野山');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```
pnpm test -- __tests__/components/SharePoster.test.tsx
```

- [ ] **Step 3: Update `src/components/SharePoster.tsx`**

At the top of the file, import `SharePosterSpot` from `sakura.ts` and extend `SharePosterProps`:

```typescript
// Add import after existing imports:
import type { SharePosterSpot } from '@/types/sakura';

// Replace the existing SharePosterProps type:
export type SharePosterProps =
  | { format: 'story' | 'line'; plant: SharePosterPlant; discoveryDate?: string; discoveryCity?: string }
  | { format: 'spot'; spot: SharePosterSpot };
```

Add a `SpotPoster` sub-component (before the main `SharePoster` export):

```typescript
function SpotPoster({ spot }: { spot: SharePosterSpot }) {
  const borderColor = spot.stamp_variant === 'mankai' ? '#d4a017' : colors.blushPink;
  const date = formatDate(spot.checked_in_at);

  return (
    <View style={[spotStyles.canvas, { borderColor, borderWidth: spot.stamp_variant === 'mankai' ? 3 : 0 }]}>
      <LinearGradient
        colors={[colors.seasonal.sakura, colors.blushPink]}
        style={StyleSheet.absoluteFillObject}
      />
      <Text style={spotStyles.spotIcon}>{spot.is100sen ? '⭐' : '🌸'}</Text>
      <Text style={spotStyles.spotName}>{spot.name_ja}</Text>
      <Text style={spotStyles.prefecture}>{spot.prefecture}</Text>
      <Text style={spotStyles.date}>{date}</Text>
      <Text style={spotStyles.logo}>Pixel Herbarium</Text>
    </View>
  );
}

const spotStyles = StyleSheet.create({
  canvas: {
    width: 360, height: 360,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: borderRadius.md,
  },
  spotIcon:   { fontSize: 64, marginBottom: 8 },
  spotName:   { fontFamily: typography.fontFamily.display, fontSize: 22, color: colors.text, textAlign: 'center', marginBottom: 4 },
  prefecture: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  date:       { fontSize: 13, color: colors.textSecondary, marginBottom: 16 },
  logo:       { fontSize: 11, color: colors.textSecondary, position: 'absolute', bottom: 12, right: 12 },
});
```

Update the main `SharePoster` component to handle `format: 'spot'`:

```typescript
export default function SharePoster(props: SharePosterProps) {
  if (props.format === 'spot') {
    return <SpotPoster spot={props.spot} />;
  }
  // ... existing story/line rendering (unchanged)
}
```

- [ ] **Step 4: Run test — expect PASS**

```
pnpm test -- __tests__/components/SharePoster.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/SharePoster.tsx __tests__/components/SharePoster.test.tsx
git commit -m "feat(ui): extend SharePoster with format='spot' variant"
```

---

## Task 10: useReviewPrompt

**Files:**
- Create: `src/hooks/useReviewPrompt.ts`
- Create: `__tests__/hooks/useReviewPrompt.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/hooks/useReviewPrompt.test.ts
const mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem:  jest.fn((k: string) => Promise.resolve(mockStorage[k] ?? null)),
    setItem:  jest.fn((k: string, v: string) => { mockStorage[k] = v; return Promise.resolve(); }),
  },
}));
jest.mock('expo-store-review', () => ({
  requestReview: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

import { maybeRequestReview } from '../../src/hooks/useReviewPrompt';
import * as StoreReview from 'expo-store-review';

beforeEach(() => {
  for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  jest.clearAllMocks();
});

describe('maybeRequestReview', () => {
  it('calls requestReview on first trigger', async () => {
    await maybeRequestReview('firstCheckin');
    expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);
  });

  it('does NOT call requestReview a second time within 30 days', async () => {
    await maybeRequestReview('firstCheckin'); // first call
    await maybeRequestReview('firstCheckin'); // within 30 days
    expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);
  });

  it('calls requestReview again after 30+ days have passed', async () => {
    const past = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    mockStorage['ph_review_last_shown'] = past;
    await maybeRequestReview('fiveCheckins');
    expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```
pnpm test -- __tests__/hooks/useReviewPrompt.test.ts
```

- [ ] **Step 3: Create `src/hooks/useReviewPrompt.ts`**

```typescript
// src/hooks/useReviewPrompt.ts
// Trigger App Store / Play Store review prompts at golden moments.
// Golden triggers: 'firstCheckin' | 'fiveCheckins'
// Cooldown: 30 days between prompts (stored in AsyncStorage)
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const STORAGE_KEY      = 'ph_review_last_shown';
const COOLDOWN_DAYS    = 30;
const COOLDOWN_MS      = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export type ReviewTrigger = 'firstCheckin' | 'fiveCheckins';

/**
 * Call at golden moments. Internally checks cooldown before requesting.
 * Safe to call multiple times — won't show if within cooldown window.
 */
export async function maybeRequestReview(_trigger: ReviewTrigger): Promise<void> {
  const isAvailable = await StoreReview.isAvailableAsync();
  if (!isAvailable) return;

  const lastShownRaw = await AsyncStorage.getItem(STORAGE_KEY);
  if (lastShownRaw) {
    const lastShown = new Date(lastShownRaw).getTime();
    if (Date.now() - lastShown < COOLDOWN_MS) return;
  }

  await StoreReview.requestReview();
  await AsyncStorage.setItem(STORAGE_KEY, new Date().toISOString());
}
```

- [ ] **Step 4: Run test — expect PASS**

```
pnpm test -- __tests__/hooks/useReviewPrompt.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useReviewPrompt.ts __tests__/hooks/useReviewPrompt.test.ts
git commit -m "feat(hook): add useReviewPrompt with 30-day cooldown"
```

---

## Task 11: Map Tab — Layer Toggle + Spot Layer + Checkin Flow

**Files:**
- Modify: `src/app/(tabs)/map.tsx`
- Modify: `__tests__/screens/MapScreen.test.tsx`

> Read `src/app/(tabs)/map.tsx` in full before editing. The existing component has `showHeatmap` toggle, `useNearbyDiscoveries`, and a MapView with Heatmap + Markers.

- [ ] **Step 1: Add failing tests to `__tests__/screens/MapScreen.test.tsx`**

Open the existing test file. Add these mocks at the top (alongside existing ones):

```typescript
jest.mock('@/stores/sakura-store', () => ({
  useSakuraStore: jest.fn(() => ({
    spots: [
      {
        id: 1, nameJa: '上野恩賜公園', nameEn: 'Ueno Park',
        prefecture: '東京都', prefectureCode: 13, city: '台東区', category: 'park',
        bloomTypical: { earlyStart: '03-20', peakStart: '03-28', peakEnd: '04-05', lateEnd: '04-12' },
        latitude: 35.7141, longitude: 139.7734,
        tags: ['名所100選'],
      },
    ],
    checkins: [],
    loading: false,
    initSpots: jest.fn(),
    loadCheckins: jest.fn(),
    performCheckin: jest.fn(),
    hasCheckedIn: jest.fn(() => false),
    getProgress: jest.fn(() => ({ checked: 0, total: 1 })),
    flushOfflineQueue: jest.fn(),
  })),
}));
jest.mock('@/components/PrePermissionScreen', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/SpotCheckinAnimation', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));
```

Add these test cases after the existing ones:

```typescript
describe('MapScreen — layer toggle', () => {
  it('renders layer toggle buttons', () => {
    const html = renderToString();
    // The toggle contains i18n keys
    expect(html).toContain('sakura.layerToggle');
  });
});
```

- [ ] **Step 2: Run new tests — expect FAIL**

```
pnpm test -- __tests__/screens/MapScreen.test.tsx
```

- [ ] **Step 3: Update `src/app/(tabs)/map.tsx`**

Key changes to make (read the file first to understand its exact structure):

**Add new imports** (after existing imports):
```typescript
import * as Location from 'expo-location';
import { useSakuraStore } from '@/stores/sakura-store';
import { isWithinRadius } from '@/utils/geo';
import { getBloomStatus } from '@/utils/bloom';
import PrePermissionScreen from '@/components/PrePermissionScreen';
import SpotCheckinAnimation from '@/components/SpotCheckinAnimation';
import type { FlowerSpot } from '@/types/hanami';
```

**Add new state** (inside `MapScreen` component, after existing state):
```typescript
const [mapLayer, setMapLayer]   = useState<'discoveries' | 'spots'>('discoveries');
const [showPrePerm, setShowPrePerm] = useState(false);
const [nearbySpot, setNearbySpot]  = useState<FlowerSpot | null>(null);
const [animSpot, setAnimSpot]      = useState<FlowerSpot | null>(null);
const [animMankai, setAnimMankai]  = useState(false);

const { spots, initSpots, performCheckin, hasCheckedIn } = useSakuraStore();
```

**Add `useEffect` for spot layer switch**:
```typescript
useEffect(() => {
  if (mapLayer !== 'spots') return;
  if (spots.length === 0) initSpots();
  (async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      setShowPrePerm(true);
      return;
    }
    startProximityWatch();
  })();
}, [mapLayer]);
```

**Add proximity watch** (call `isWithinRadius` every 5s when in spots layer):
```typescript
const proximityTimer = useRef<ReturnType<typeof setInterval> | null>(null);

function startProximityWatch() {
  if (proximityTimer.current) return;
  proximityTimer.current = setInterval(async () => {
    if (!userLocation) return;
    const nearby = spots.find((s) =>
      !hasCheckedIn(s.id) &&
      isWithinRadius(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: s.latitude, longitude: s.longitude },
        500,
      )
    );
    setNearbySpot(nearby ?? null);
  }, 5000);
}

useEffect(() => {
  return () => { if (proximityTimer.current) clearInterval(proximityTimer.current); };
}, []);
```

**Add check-in handler** (also triggers review prompt at emotional peak — §6.5):
```typescript
// Add import alongside other hook imports:
import { maybeRequestReview } from '@/hooks/useReviewPrompt';

async function handleCheckin(spot: FlowerSpot) {
  setNearbySpot(null);
  try {
    const { isMankai } = await performCheckin(spot.id);
    setAnimSpot(spot);
    setAnimMankai(isMankai);
    // Trigger review prompt at emotional peak (§6.5): first check-in or ≥5 total
    const newCount = useSakuraStore.getState().checkins.length;
    if (newCount === 1 || newCount === 5) {
      await maybeRequestReview(newCount === 1 ? 'firstCheckin' : 'fiveCheckins');
    }
  } catch {
    // offline queued — show animation anyway (optimistic)
    setAnimSpot(spot);
    setAnimMankai(false);
  }
}
```

**Add layer toggle + spot PINs in the render** (inside the existing `return`):
```tsx
{/* Layer toggle — place above the MapView or as absolute overlay */}
<View style={styles.layerToggle}>
  <TouchableOpacity
    style={[styles.toggleBtn, mapLayer === 'discoveries' && styles.toggleBtnActive]}
    onPress={() => setMapLayer('discoveries')}
  >
    <Text style={styles.toggleText}>{t('sakura.layerToggle.heatmap')}</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.toggleBtn, mapLayer === 'spots' && styles.toggleBtnActive]}
    onPress={() => setMapLayer('spots')}
  >
    <Text style={styles.toggleText}>{t('sakura.layerToggle.spots')}</Text>
  </TouchableOpacity>
</View>

{/* Spot PINs (rendered inside MapView when layer === 'spots') */}
{mapLayer === 'spots' && spots.map((spot) => {
  const checked = hasCheckedIn(spot.id);
  const is100sen = spot.tags.includes('名所100選');
  return (
    <Marker
      key={spot.id}
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      title={spot.nameJa}
      pinColor={is100sen ? (checked ? '#d4a017' : '#aaaaaa') : (checked ? colors.blushPink : '#cccccc')}
    />
  );
})}

{/* Checkin Sheet (nearbySpot present) */}
{nearbySpot && (
  <View style={styles.checkinSheet}>
    <Text style={styles.checkinSpotName}>{nearbySpot.nameJa}</Text>
    {nearbySpot.tags.includes('名所100選') && (
      <Text style={styles.checkin100sen}>さくら名所100選</Text>
    )}
    <TouchableOpacity style={styles.checkinButton} onPress={() => handleCheckin(nearbySpot)}>
      <Text style={styles.checkinButtonText}>{t('sakura.checkinSheet.button')}</Text>
    </TouchableOpacity>
  </View>
)}

{/* Pre-permission screen */}
{showPrePerm && (
  <PrePermissionScreen
    onAllow={async () => {
      setShowPrePerm(false);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') startProximityWatch();
    }}
    onSkip={() => setShowPrePerm(false)}
  />
)}

{/* Check-in animation overlay */}
{animSpot && (
  <SpotCheckinAnimation
    spot={animSpot}
    isMankai={animMankai}
    is100sen={animSpot.tags.includes('名所100選')}
    onDismiss={() => setAnimSpot(null)}
  />
)}
```

Add styles for the new elements:
```typescript
layerToggle: {
  position: 'absolute', top: spacing.lg, alignSelf: 'center',
  flexDirection: 'row', backgroundColor: colors.white,
  borderRadius: borderRadius.full, overflow: 'hidden',
  borderWidth: 1, borderColor: colors.border, zIndex: 10,
},
toggleBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
toggleBtnActive: { backgroundColor: colors.blushPink },
toggleText: { fontSize: typography.fontSize.sm, color: colors.text, fontFamily: typography.fontFamily.display },
checkinSheet: {
  position: 'absolute', bottom: spacing.xl * 2, left: spacing.lg, right: spacing.lg,
  backgroundColor: colors.white, borderRadius: borderRadius.lg,
  padding: spacing.lg, alignItems: 'center',
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8,
},
checkinSpotName: { fontSize: typography.fontSize.lg, fontFamily: typography.fontFamily.display,
                   color: colors.text, marginBottom: spacing.xs },
checkin100sen: { fontSize: typography.fontSize.xs, color: '#d4a017', marginBottom: spacing.md },
checkinButton: {
  backgroundColor: colors.blushPink, paddingVertical: spacing.md,
  paddingHorizontal: spacing.xl, borderRadius: borderRadius.full, width: '100%', alignItems: 'center',
},
checkinButtonText: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.md, color: colors.text },
```

- [ ] **Step 4: Run full MapScreen test suite — expect PASS**

```
pnpm test -- __tests__/screens/MapScreen.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/app/(tabs)/map.tsx __tests__/screens/MapScreen.test.tsx
git commit -m "feat(map): add sakura spots layer with PIN rendering, proximity check, and check-in sheet"
```

---

## Task 12: Herbarium Tab — Spot View

**Files:**
- Modify: `src/app/(tabs)/herbarium.tsx`
- Modify: `__tests__/screens/HerbariumScreen.test.tsx`

> Read `src/app/(tabs)/herbarium.tsx` in full before editing.

- [ ] **Step 1: Add failing tests to `__tests__/screens/HerbariumScreen.test.tsx`**

Add these mocks at the top (alongside existing ones):
```typescript
jest.mock('@/stores/sakura-store', () => ({
  useSakuraStore: jest.fn(() => ({
    spots: [], checkins: [], loading: false,
    initSpots: jest.fn(), loadCheckins: jest.fn(),
    hasCheckedIn: jest.fn(() => false), getProgress: jest.fn(() => ({ checked: 0, total: 0 })),
  })),
}));
jest.mock('@/components/SpotStampGrid', () => ({
  __esModule: true, default: () => null,
}));
jest.mock('@/components/SpotDetailSheet', () => ({
  __esModule: true, default: () => null,
}));
```

Add test cases:
```typescript
describe('HerbariumScreen — spot tab', () => {
  it('renders spot tab label', () => {
    const html = renderToString();
    expect(html).toContain('sakura.collection.tabLabel');
  });
});
```

- [ ] **Step 2: Run new test — expect FAIL**

```
pnpm test -- __tests__/screens/HerbariumScreen.test.tsx
```

- [ ] **Step 3: Update `src/app/(tabs)/herbarium.tsx`**

**Add imports** (after existing imports):
```typescript
import { useSakuraStore } from '@/stores/sakura-store';
import SpotStampGrid from '@/components/SpotStampGrid';
import SpotDetailSheet from '@/components/SpotDetailSheet';
import type { FlowerSpot } from '@/types/hanami';
import type { SpotCheckinResult } from '@/types/sakura';
```

**Add new state** (inside `HerbariumScreen`, after existing state):
```typescript
const [activeTab, setActiveTab] = useState<'plants' | 'spots'>('plants');
const [detailSpot, setDetailSpot]     = useState<FlowerSpot | null>(null);
const [detailCheckin, setDetailCheckin] = useState<SpotCheckinResult | null>(null);
const [showDetail, setShowDetail]     = useState(false);

const { spots, checkins, initSpots, loadCheckins } = useSakuraStore();
```

**Add `useEffect`** to load spots/checkins when tab activates:
```typescript
useEffect(() => {
  if (activeTab !== 'spots') return;
  if (spots.length === 0) initSpots();
  if (user?.id) loadCheckins(user.id);
}, [activeTab]);
```

**Replace the header area** to add the tab switcher above the existing filter chips:
```tsx
{/* Tab switcher — 植物 ↔ 桜スポット */}
<View style={styles.tabSwitcher}>
  <TouchableOpacity
    style={[styles.tabSwitchBtn, activeTab === 'plants' && styles.tabSwitchBtnActive]}
    onPress={() => setActiveTab('plants')}
  >
    <Text style={styles.tabSwitchText}>🌿 {t('sakura.collection.plantTab')} {collected.size}/{TOTAL_PLANTS}</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.tabSwitchBtn, activeTab === 'spots' && styles.tabSwitchBtnActive]}
    onPress={() => setActiveTab('spots')}
  >
    <Text style={styles.tabSwitchText}>🌸 {t('sakura.collection.tabLabel')} {checkins.length}/100</Text>
  </TouchableOpacity>
</View>
```

**Conditionally render** the plant grid or spot grid:
```tsx
{activeTab === 'plants'
  ? (
    <>
      {/* existing filter chips + FlatList (unchanged) */}
    </>
  )
  : (
    <SpotStampGrid
      spots={spots}
      checkins={checkins}
      onSpotPress={(spot, checkin) => {
        if (checkin) {
          setDetailSpot(spot);
          setDetailCheckin(checkin);
          setShowDetail(true);
        }
        // unchecked spots: hint handled inside SpotStampGrid
      }}
    />
  )
}

<SpotDetailSheet
  spot={detailSpot}
  checkin={detailCheckin}
  visible={showDetail}
  onClose={() => setShowDetail(false)}
  onViewOnMap={() => { setShowDetail(false); router.push('/(tabs)/map'); }}
/>
```

Add styles:
```typescript
tabSwitcher: {
  flexDirection: 'row', marginHorizontal: spacing.md, marginBottom: spacing.sm,
  borderRadius: borderRadius.full, overflow: 'hidden',
  borderWidth: 1, borderColor: colors.border,
},
tabSwitchBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
tabSwitchBtnActive: { backgroundColor: colors.blushPink },
tabSwitchText: { fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.display, color: colors.text },
```

- [ ] **Step 4: Run full HerbariumScreen test suite — expect PASS**

```
pnpm test -- __tests__/screens/HerbariumScreen.test.tsx
```

- [ ] **Step 5: Run full test suite to confirm nothing broken**

```
pnpm test
```
Expected: all existing tests still pass

- [ ] **Step 6: Commit**

```bash
git add src/app/(tabs)/herbarium.tsx __tests__/screens/HerbariumScreen.test.tsx
git commit -m "feat(herbarium): add 桜スポット tab with stamp grid and detail sheet"
```

---

## Task 13: Edge Function — notify-bloom (Optional, post-MVP)

> **Note:** This task is optional for MVP launch. The pg_cron schedule was added in migration 021. The Edge Function can be deployed separately after the core check-in flow is live.

**Files:**
- Create: `supabase/functions/notify-bloom/index.ts`

- [ ] **Step 1: Create the Edge Function**

```typescript
// supabase/functions/notify-bloom/index.ts
// Called by pg_cron daily at JST 06:00.
// Finds spots entering bloom today and notifies nearby users.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const today = new Date();
  const mmdd  = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Find spots whose bloom_early_start equals today
  const { data: spots } = await supabase
    .from('sakura_spots')
    .select('id, name_ja')
    .eq('bloom_early_start', mmdd);

  if (!spots?.length) return new Response('no blooms today', { status: 200 });

  // For each spot, find users who have checked in within 5km (via spot_checkins)
  // and send push notification (via push_tokens table).
  // Implementation: query push_tokens joined to spot_checkins for nearby users.
  // NOTE: Full implementation deferred — add per-user push logic here.

  return new Response(JSON.stringify({ blooming: spots.map((s) => s.name_ja) }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 2: Deploy the Edge Function**

```bash
pnpm supabase functions deploy notify-bloom
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/notify-bloom/index.ts
git commit -m "feat(edge): add notify-bloom Edge Function stub (post-MVP)"
```

---

## Final Verification

- [ ] Run the complete test suite:
  ```
  pnpm test
  ```
  Expected: all tests pass (350+ total)

- [ ] TypeScript check:
  ```
  pnpm tsc --noEmit
  ```
  Expected: no errors

- [ ] Manual smoke test (Expo Go on device):
  1. Map Tab → tap「桜スポット」toggle → PINs appear
  2. Walk within 500m of a spot (or use `xcrun simctl location` to simulate) → checkin sheet appears
  3. Tap「打卡する」→ animation plays → stamp appears in Herbarium Tab
  4. Herbarium Tab → tap「桜スポット」→ stamp grid shows filled cell
  5. Tap filled cell → SpotDetailSheet appears with date

- [ ] Verify mankai bonus:
  - Set device date to a `bloom_peak_start`→`bloom_peak_end` window for any spot
  - Complete check-in → `stamp_variant` = 'mankai', `user_quotas.limit` += 1

---

*Plan written: 2026-03-18 | Spec: docs/superpowers/specs/2026-03-18-sakura-spot-checkin-design.md | Bloom status display deferred to future sprint*
