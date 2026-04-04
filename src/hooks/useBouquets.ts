import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import type { Profile } from './useFriends';

export interface BouquetPlant {
  id: number;
  name_ja: string;
  name_en: string;
  rarity: number;
  pixel_sprite_url: string | null;
}

export interface Bouquet {
  id: string;
  sender_id: string;
  receiver_id: string;
  plant_ids: number[];
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  expires_at: string;
  sender?: Profile;
  receiver?: Profile;
  plants?: BouquetPlant[];
}

interface UseBouquetsReturn {
  inbox: Bouquet[];
  sent: Bouquet[];
  loading: boolean;
  sendBouquet: (receiverId: string, plantIds: number[], message: string) => Promise<void>;
  acceptBouquet: (bouquetId: string) => Promise<void>;
  declineBouquet: (bouquetId: string) => Promise<void>;
  refresh: () => void;
}

export function useBouquets(userId: string): UseBouquetsReturn {
  const [inbox, setInbox] = useState<Bouquet[]>([]);
  const [sent, setSent] = useState<Bouquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('bouquets')
          .select(`
            id, sender_id, receiver_id, plant_ids, message, status, created_at, expires_at,
            sender:profiles!bouquets_sender_id_fkey(id, display_name, avatar_seed),
            receiver:profiles!bouquets_receiver_id_fkey(id, display_name, avatar_seed)
          `)
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (cancelled) return;
        if (error || !data) return;

        // Collect all plant IDs to fetch in one query
        const allPlantIds: number[] = [];
        for (const b of data) {
          for (const pid of (b.plant_ids ?? [])) {
            if (!allPlantIds.includes(pid)) allPlantIds.push(pid);
          }
        }

        let plantMap = new Map<number, BouquetPlant>();
        if (allPlantIds.length > 0) {
          const { data: plants } = await (supabase as any)
            .from('plants')
            .select('id, name_ja, name_en, rarity, pixel_sprite_url')
            .in('id', allPlantIds);
          for (const p of (plants ?? [])) plantMap.set(p.id, p);
        }

        if (cancelled) return;

        const enriched: Bouquet[] = (data as any[]).map((b) => ({
          ...b,
          plants: (b.plant_ids ?? []).map((pid: number) => plantMap.get(pid)).filter(Boolean),
        }));

        setInbox(enriched.filter((b) =>
          b.receiver_id === userId &&
          b.status === 'pending' &&
          new Date(b.expires_at) > new Date()
        ));
        setSent(enriched.filter((b) => b.sender_id === userId));
      } catch (e) {
        if (!cancelled) console.warn('useBouquets: failed to load', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId, tick]);

  const sendBouquet = useCallback(async (
    receiverId: string,
    plantIds: number[],
    message: string,
  ) => {
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    const { error } = await (supabase as any).from('bouquets').insert({
      sender_id: userId,
      receiver_id: receiverId,
      plant_ids: plantIds,
      message,
      status: 'pending',
      expires_at: expires.toISOString(),
    });
    if (error) throw error;
    setTick((t) => t + 1);
  }, [userId]);

  const acceptBouquet = useCallback(async (bouquetId: string) => {
    const { error } = await (supabase as any).from('bouquets').update({ status: 'accepted' }).eq('id', bouquetId);
    if (error) throw error;
    setTick((t) => t + 1);
  }, []);

  const declineBouquet = useCallback(async (bouquetId: string) => {
    const { error } = await (supabase as any).from('bouquets').update({ status: 'declined' }).eq('id', bouquetId);
    if (error) throw error;
    setTick((t) => t + 1);
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { inbox, sent, loading, sendBouquet, acceptBouquet, declineBouquet, refresh };
}
