import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface RecapPlant {
  id: number;
  name_ja: string;
  name_latin: string;
  rarity: number;
  hanakotoba: string | null;
  pixel_sprite_url: string | null;
  discovered_at: string;
}

interface SeasonWindow {
  label: string; // e.g. "春 2026"
  season: Season;
  start: Date;
  end: Date;
}

// Returns the ISO start/end of the current season quarter
function currentSeasonWindow(): SeasonWindow {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1-12

  if (m >= 3 && m <= 5) {
    return { label: `春 ${y}`, season: 'spring', start: new Date(y, 2, 1), end: new Date(y, 5, 1) };
  } else if (m >= 6 && m <= 8) {
    return { label: `夏 ${y}`, season: 'summer', start: new Date(y, 5, 1), end: new Date(y, 8, 1) };
  } else if (m >= 9 && m <= 11) {
    return { label: `秋 ${y}`, season: 'autumn', start: new Date(y, 8, 1), end: new Date(y, 11, 1) };
  } else {
    // Winter: Dec of current year or Jan/Feb belonging to previous winter
    const winterYear = m === 12 ? y : y - 1;
    return {
      label: `冬 ${winterYear}`,
      season: 'winter',
      start: new Date(winterYear, 11, 1),
      end: new Date(winterYear + 1, 2, 1),
    };
  }
}

interface UseSeasonRecapReturn {
  plants: RecapPlant[];
  loading: boolean;
  season: SeasonWindow;
}

export function useSeasonRecap(userId: string): UseSeasonRecapReturn {
  const season = currentSeasonWindow();
  const [plants, setPlants] = useState<RecapPlant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    async function load() {
      const { data } = await (supabase as any)
        .from('discoveries')
        .select(
          'created_at, plants!inner(id, name_ja, name_latin, rarity, hanakotoba, pixel_sprite_url)',
        )
        .eq('user_id', userId)
        .gte('created_at', season.start.toISOString())
        .lt('created_at', season.end.toISOString())
        .order('created_at', { ascending: false });

      if (cancelled) return;

      const mapped: RecapPlant[] = (data ?? []).map((row: any) => ({
        id: row.plants.id,
        name_ja: row.plants.name_ja,
        name_latin: row.plants.name_latin,
        rarity: row.plants.rarity,
        hanakotoba: row.plants.hanakotoba,
        pixel_sprite_url: row.plants.pixel_sprite_url,
        discovered_at: row.created_at,
      }));

      // Deduplicate by plant id (keep first/latest discovery)
      const seen = new Set<number>();
      const unique = mapped.filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      setPlants(unique);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId, season.label]);

  return { plants, loading, season };
}
