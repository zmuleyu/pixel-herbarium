import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CheckinRecord } from '@/types/hanami';

const STORAGE_KEY = 'ph_checkin_history';

interface CheckinStore {
  history: CheckinRecord[];
  loading: boolean;
  loadHistory: () => Promise<void>;
  addCheckin: (record: CheckinRecord) => Promise<void>;
  deleteCheckin: (id: string) => Promise<void>;
}

export const useCheckinStore = create<CheckinStore>((set, get) => ({
  history: [],
  loading: false,

  loadHistory: async () => {
    set({ loading: true });
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const history: CheckinRecord[] = raw ? JSON.parse(raw) : [];
      set({ history, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addCheckin: async (record) => {
    const updated = [record, ...get().history];
    set({ history: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  deleteCheckin: async (id) => {
    const updated = get().history.filter((r) => r.id !== id);
    set({ history: updated });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },
}));
