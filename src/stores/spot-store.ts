// src/stores/spot-store.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { loadSpotsData, getActiveRegion } from '@/services/content-pack';
import { getBloomStatus } from '@/utils/bloom';
import type { FlowerSpot } from '@/types/hanami';
import type { SpotCheckinResult, OfflineCheckinItem } from '@/types/spot';

const OFFLINE_QUEUE_KEY = 'ph_spot_checkin_queue';

interface SpotStore {
  spots:    FlowerSpot[];
  checkins: SpotCheckinResult[];
  loading:  boolean;

  initSpots:      (seasonId?: string) => void;
  loadCheckins:   (userId: string) => Promise<void>;
  performCheckin: (spotId: number, skipNetwork?: boolean) => Promise<{ isNew: boolean; isMankai: boolean }>;
  hasCheckedIn:   (spotId: number) => boolean;
  getProgress:    () => { checked: number; total: number };
  flushOfflineQueue: () => Promise<void>;
}

export const useSpotStore = create<SpotStore>((set, get) => ({
  spots:    [],
  checkins: [],
  loading:  false,

  initSpots: (seasonId?: string) => {
    const sid = seasonId ?? getActiveRegion().seasons[0]?.id;
    const data = loadSpotsData(sid);
    set({ spots: data?.spots ?? [] });
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('checkin_spot', {
        p_spot_id:      spotId,
        p_is_peak:      isPeak,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any).rpc('checkin_spot', {
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
