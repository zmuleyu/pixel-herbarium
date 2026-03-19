// supabase/seed/seed-sakura-spots.ts
// Run once: npx tsx supabase/seed/seed-sakura-spots.ts
//
// Transforms camelCase JSON fields → snake_case DB columns and upserts into
// the sakura_spots table (created by migration 021_sakura_spots.sql).
//
// Required env vars:
//   SUPABASE_URL             (or EXPO_PUBLIC_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js';
import sakuraData from '../../src/data/packs/jp/seasons/sakura.json';

const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

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
    description:       (s as Record<string, unknown>).description as string ?? null,
    custom_sprite_url: null,
    access_note:       null,
    sort_order:        s.id,
    best_time:         null,
    facilities:        null,
  }));

  const { error } = await supabase
    .from('sakura_spots')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('Upsert failed:', error);
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} sakura spots`);
}

run();
