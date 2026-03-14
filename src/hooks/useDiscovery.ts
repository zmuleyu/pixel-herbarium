import { useState, useCallback } from 'react';
import { identifyPlant } from '@/services/plantId';
import { checkCooldown, checkQuota } from '@/services/antiCheat';
import { supabase } from '@/services/supabase';
import { fuzzCoordinate } from '@/utils/geo';

export type DiscoveryStatus =
  | 'idle'
  | 'checking'
  | 'identifying'
  | 'saving'
  | 'success'
  | 'cooldown'
  | 'quota_exceeded'
  | 'not_a_plant'
  | 'no_match'
  | 'error';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface DiscoveredPlant {
  id: number;
  name_ja: string;
  name_en: string;
  name_latin: string;
  rarity: number;
  hanakotoba: string;
  flower_meaning: string;
}

interface UseDiscoveryReturn {
  status: DiscoveryStatus;
  discoveredPlant: DiscoveredPlant | null;
  daysRemaining?: number;
  runDiscovery: (photoUri: string, coord: Coordinate, userId: string) => Promise<void>;
  reset: () => void;
}

export function useDiscovery(): UseDiscoveryReturn {
  const [status, setStatus] = useState<DiscoveryStatus>('idle');
  const [discoveredPlant, setDiscoveredPlant] = useState<DiscoveredPlant | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | undefined>(undefined);

  const runDiscovery = useCallback(async (
    photoUri: string,
    coord: Coordinate,
    userId: string,
  ) => {
    setStatus('checking');
    setDiscoveredPlant(null);
    setDaysRemaining(undefined);

    try {
      // 1. Anti-cheat checks (parallel)
      const [cooldown, quota] = await Promise.all([
        checkCooldown(userId, coord),
        checkQuota(userId),
      ]);

      if (!cooldown.allowed) {
        setDaysRemaining(cooldown.daysRemaining);
        setStatus('cooldown');
        return;
      }

      if (!quota.allowed) {
        setStatus('quota_exceeded');
        return;
      }

      // 2. Identify plant via Plant.id
      setStatus('identifying');
      const result = await identifyPlant(photoUri);

      if (!result.isPlant) {
        setStatus('not_a_plant');
        return;
      }

      if (!result.matched || !result.plantName) {
        setStatus('no_match');
        return;
      }

      // 3. Match against local plants database (name_latin or name_en)
      const { data: plants, error: plantError } = await (supabase as any)
        .from('plants')
        .select('id, name_ja, name_en, name_latin, rarity, hanakotoba, flower_meaning')
        .or(`name_latin.ilike.${result.plantName},name_en.ilike.${result.plantName}`)
        .limit(1);

      if (plantError) throw plantError;
      if (!plants || plants.length === 0) {
        setStatus('no_match');
        return;
      }

      const plant: DiscoveredPlant = plants[0];

      // 4. Save discovery with fuzzed location
      setStatus('saving');
      const fuzzy = fuzzCoordinate(coord);
      const month = new Date().toISOString().slice(0, 7);

      const { error: insertError } = await (supabase as any)
        .from('discoveries')
        .insert({
          user_id: userId,
          plant_id: plant.id,
          location_lat: coord.latitude,
          location_lon: coord.longitude,
          location_fuzzy_lat: fuzzy.latitude,
          location_fuzzy_lon: fuzzy.longitude,
          is_public: true,
        })
        .single();

      if (insertError) throw insertError;

      // 5. Deduct quota
      await (supabase as any).rpc('deduct_quota', {
        p_user_id: userId,
        p_month: month,
      });

      setDiscoveredPlant(plant);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setDiscoveredPlant(null);
    setDaysRemaining(undefined);
  }, []);

  return { status, discoveredPlant, daysRemaining, runDiscovery, reset };
}
