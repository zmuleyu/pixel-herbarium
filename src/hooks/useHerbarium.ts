import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { TOTAL_PLANTS } from '@/constants/plants';

export interface PlantSlot {
  id: number;
  name_ja: string;
  name_en: string;
  name_latin: string;
  rarity: number;
  pixel_sprite_url: string | null;
  hanakotoba: string;
  bloom_months: number[];
}

export interface CollectionEntry {
  plant_id: number;
  discovered_at: string;
}

interface UseHerbariumReturn {
  plants: PlantSlot[];
  collected: Set<number>;
  collectionMap: Map<number, CollectionEntry>;
  loading: boolean;
  refresh: () => void;
}

export function useHerbarium(userId: string): UseHerbariumReturn {
  const [plants, setPlants] = useState<PlantSlot[]>([]);
  const [collected, setCollected] = useState<Set<number>>(new Set());
  const [collectionMap, setCollectionMap] = useState<Map<number, CollectionEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setLoading(true);

    async function load() {
      // Fetch all 60 plants ordered by id
      const { data: plantRows, error: plantError } = await (supabase as any)
        .from('plants')
        .select('id, name_ja, name_en, name_latin, rarity, pixel_sprite_url, hanakotoba, bloom_months')
        .order('id');

      if (cancelled) return;
      if (plantError) {
        setPlants([]);
        setLoading(false);
        return;
      }

      // Fetch user's collection; join discoveries to get first discovery date
      const { data: collRows, error: collError } = await (supabase as any)
        .from('collections')
        .select('plant_id, discoveries!first_discovery_id(created_at)')
        .eq('user_id', userId);

      if (cancelled) return;

      const rows: PlantSlot[] = (plantRows ?? []).slice(0, TOTAL_PLANTS);
      setPlants(rows);

      if (!collError && collRows) {
        const entries: CollectionEntry[] = (collRows as Array<{
          plant_id: number;
          discoveries: { created_at: string } | null;
        }>).map((row) => ({
          plant_id: row.plant_id,
          discovered_at: row.discoveries?.created_at ?? '',
        }));
        setCollected(new Set(entries.map((e) => e.plant_id)));
        setCollectionMap(new Map(entries.map((e) => [e.plant_id, e])));
      } else {
        setCollected(new Set());
        setCollectionMap(new Map());
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { plants, collected, collectionMap, loading, refresh };
}
