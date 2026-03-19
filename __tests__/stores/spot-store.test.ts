// __tests__/stores/sakura-store.test.ts

const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem:  jest.fn((k: string) => Promise.resolve(mockStorage[k] ?? null)),
    setItem:  jest.fn((k: string, v: string) => { mockStorage[k] = v; return Promise.resolve(); }),
    removeItem: jest.fn((k: string) => { delete mockStorage[k]; return Promise.resolve(); }),
  },
}));

const mockSelect = jest.fn();
const mockEq     = jest.fn();
const mockRpc    = jest.fn();
jest.mock('@/services/supabase', () => ({
  supabase: {
    from:  jest.fn(() => ({ select: mockSelect })),
    rpc:   mockRpc,
    auth:  { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-abc' } } })) },
  },
}));

jest.mock('@/data/seasons/sakura.json', () => ({
  version:  1,
  seasonId: 'sakura',
  spots: [
    {
      id: 1, seasonId: 'sakura', nameJa: '上野恩賜公園', nameEn: 'Ueno Park',
      prefecture: '東京都', prefectureCode: 13, city: '台東区', category: 'park',
      treeCount: 800,
      bloomTypical: { earlyStart: '03-20', peakStart: '03-28', peakEnd: '04-05', lateEnd: '04-12' },
      latitude: 35.7141, longitude: 139.7734,
      tags: ['名所100選', '夜桜', '池'],
    },
  ],
}), { virtual: true });

import { useSakuraStore } from '../../src/stores/sakura-store';
import type { SpotCheckinResult } from '../../src/types/sakura';

const makeCheckin = (overrides: Partial<SpotCheckinResult> = {}): SpotCheckinResult => ({
  id: 'c1', user_id: 'user-abc', spot_id: 1,
  checked_in_at: '2026-03-28T10:00:00Z',
  is_mankai: false, stamp_variant: 'normal',
  bloom_status_at_checkin: null,
  ...overrides,
});

beforeEach(() => {
  for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  useSakuraStore.setState({ spots: [], checkins: [], loading: false });
  jest.clearAllMocks();
});

describe('useSakuraStore — spots', () => {
  it('loads spots from sakura.json on init', () => {
    const store = useSakuraStore.getState();
    store.initSpots();
    expect(useSakuraStore.getState().spots).toHaveLength(1);
    expect(useSakuraStore.getState().spots[0].nameEn).toBe('Ueno Park');
  });
});

describe('useSakuraStore — loadCheckins', () => {
  it('loads checkins from Supabase for the given userId', async () => {
    const data = [makeCheckin()];
    mockEq.mockResolvedValueOnce({ data, error: null });
    mockSelect.mockReturnValueOnce({ eq: mockEq });

    await useSakuraStore.getState().loadCheckins('user-abc');

    expect(useSakuraStore.getState().checkins).toEqual(data);
    expect(useSakuraStore.getState().loading).toBe(false);
  });

  it('sets loading: false even on error', async () => {
    mockEq.mockResolvedValueOnce({ data: null, error: new Error('network') });
    mockSelect.mockReturnValueOnce({ eq: mockEq });

    await useSakuraStore.getState().loadCheckins('user-abc');

    expect(useSakuraStore.getState().loading).toBe(false);
  });
});

describe('useSakuraStore — hasCheckedIn', () => {
  it('returns true for a spot already in checkins', () => {
    useSakuraStore.setState({ checkins: [makeCheckin({ spot_id: 1 })] });
    expect(useSakuraStore.getState().hasCheckedIn(1)).toBe(true);
  });

  it('returns false for a spot not checked in', () => {
    useSakuraStore.setState({ checkins: [] });
    expect(useSakuraStore.getState().hasCheckedIn(99)).toBe(false);
  });
});

describe('useSakuraStore — getProgress', () => {
  it('returns { checked: 1, total: 1 } when 1 spot is loaded and 1 checked in', () => {
    useSakuraStore.getState().initSpots();
    useSakuraStore.setState({ checkins: [makeCheckin({ spot_id: 1 })] });
    const { checked, total } = useSakuraStore.getState().getProgress();
    expect(checked).toBe(1);
    expect(total).toBe(1);
  });
});

describe('useSakuraStore — performCheckin', () => {
  it('calls supabase.rpc checkin_spot and adds new checkin to state', async () => {
    const checkinResult = makeCheckin({ is_mankai: true, stamp_variant: 'mankai' });
    mockRpc.mockResolvedValueOnce({
      data: { checkin: checkinResult, is_new_row: true },
      error: null,
    });

    useSakuraStore.getState().initSpots();
    const result = await useSakuraStore.getState().performCheckin(1, false);

    expect(result.isNew).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('checkin_spot', expect.objectContaining({ p_spot_id: 1 }));
    expect(useSakuraStore.getState().checkins).toHaveLength(1);
  });
});

describe('useSakuraStore — offline queue', () => {
  it('enqueues checkin to AsyncStorage when rpc fails', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    mockRpc.mockRejectedValueOnce(new Error('offline'));

    useSakuraStore.getState().initSpots();
    await useSakuraStore.getState().performCheckin(1, false).catch(() => {});

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
