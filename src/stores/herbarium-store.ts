import { create } from 'zustand';

interface HerbariumStore {
  tick: number;
  triggerRefresh: () => void;
}

export const useHerbariumStore = create<HerbariumStore>((set) => ({
  tick: 0,
  triggerRefresh: () => set((s) => ({ tick: s.tick + 1 })),
}));
