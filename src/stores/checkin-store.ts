import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CheckinRecord } from '@/types/hanami';
import { FEATURES } from '@/constants/features';
import { DEMO_CHECKIN_RECORDS } from '@/constants/demo-data';
import { CHECKIN_HISTORY_KEY } from '@/utils/app-storage';

interface CheckinStore {
  history: CheckinRecord[];
  loading: boolean;
  loadHistory: () => Promise<void>;
  addCheckin: (record: CheckinRecord) => Promise<void>;
  deleteCheckin: (id: string) => Promise<void>;
  reset: () => Promise<void>;
}

export const useCheckinStore = create<CheckinStore>((set, get) => ({
  // Screenshot mode: pre-load demo records at store init (before any render)
  history: FEATURES.SCREENSHOT_MODE ? DEMO_CHECKIN_RECORDS : [],
  loading: false,

  loadHistory: async () => {
    // Screenshot mode: demo data already loaded at init, skip AsyncStorage
    if (FEATURES.SCREENSHOT_MODE) return;
    set({ loading: true });
    try {
      const raw = await AsyncStorage.getItem(CHECKIN_HISTORY_KEY);
      const history: CheckinRecord[] = raw ? JSON.parse(raw) : [];
      set({ history, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addCheckin: async (record) => {
    const updated = [record, ...get().history];
    set({ history: updated });
    await AsyncStorage.setItem(CHECKIN_HISTORY_KEY, JSON.stringify(updated));
  },

  deleteCheckin: async (id) => {
    const updated = get().history.filter((r) => r.id !== id);
    set({ history: updated });
    await AsyncStorage.setItem(CHECKIN_HISTORY_KEY, JSON.stringify(updated));
  },

  reset: async () => {
    set({ history: FEATURES.SCREENSHOT_MODE ? DEMO_CHECKIN_RECORDS : [] });
    await AsyncStorage.removeItem(CHECKIN_HISTORY_KEY);
  },
}));
