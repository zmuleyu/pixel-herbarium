import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';

export interface PlantDetail {
  id: number;
  name_ja: string;
  name_en: string;
  name_latin: string;
  rarity: number;
  hanakotoba: string | null;
  flower_meaning: string | null;
  color_meaning: string | null;
  bloom_months: number[];
  prefectures: string[];
  pixel_sprite_url: string | null;
  available_window: string | null;
}

export interface DiscoveryRecord {
  id: string;
  created_at: string;
  pixel_url: string | null;
  user_note: string | null;
  city: string | null;
}

interface UsePlantDetailReturn {
  plant: PlantDetail | null;
  discoveries: DiscoveryRecord[];
  loading: boolean;
  error: string | null;
  updateNote: (discoveryId: string, note: string) => Promise<void>;
}

export function usePlantDetail(plantId: number, userId: string): UsePlantDetailReturn {
  const [plant, setPlant] = useState<PlantDetail | null>(null);
  const [discoveries, setDiscoveries] = useState<DiscoveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plantId) {
      setPlant(null);
      setDiscoveries([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const plantPromise = (supabase as any)
          .from('plants')
          .select(
            'id, name_ja, name_en, name_latin, rarity, hanakotoba, flower_meaning, color_meaning, bloom_months, prefectures, pixel_sprite_url, available_window',
          )
          .eq('id', plantId)
          .single();
        const discoveryPromise = userId
          ? (supabase as any)
              .from('discoveries')
              .select('id, created_at, pixel_url, user_note, city')
              .eq('user_id', userId)
              .eq('plant_id', plantId)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null });
        const [plantRes, discRes] = await Promise.all([plantPromise, discoveryPromise]);

        if (cancelled) return;

        if (plantRes.error) {
          setError(plantRes.error.message);
          return;
        }

        setPlant(plantRes.data);
        setDiscoveries(discRes.data ?? []);
      } catch (e) {
        if (!cancelled) console.warn('usePlantDetail: failed to load', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [plantId, userId]);

  async function updateNote(discoveryId: string, note: string) {
    const trimmed = note.trim();
    const previousDiscoveries = discoveries;
    setDiscoveries((prev) =>
      prev.map((d) => d.id === discoveryId ? { ...d, user_note: trimmed || null } : d)
    );
    const { error } = await (supabase as any)
      .from('discoveries')
      .update({ user_note: trimmed || null })
      .eq('id', discoveryId);
    if (error) {
      setDiscoveries(previousDiscoveries);
      throw error;
    }
  }

  return { plant, discoveries, loading, error, updateNote };
}
