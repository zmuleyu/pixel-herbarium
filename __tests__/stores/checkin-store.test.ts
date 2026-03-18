// Mock AsyncStorage before importing the store
const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) =>
      Promise.resolve(mockStorage[key] ?? null),
    ),
    setItem: jest.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
  },
}));

import { useCheckinStore } from '../../src/stores/checkin-store';
import type { CheckinRecord } from '../../src/types/hanami';

const makeRecord = (overrides: Partial<CheckinRecord> = {}): CheckinRecord => ({
  id: 'rec-001',
  seasonId: 'sakura',
  spotId: 1,
  photoUri: 'file:///photo.jpg',
  composedUri: 'file:///composed.jpg',
  templateId: 'card-01',
  timestamp: '2026-03-18T12:00:00Z',
  synced: false,
  ...overrides,
});

describe('CheckinStore', () => {
  beforeEach(() => {
    // Clear mock storage
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
    // Reset store state
    useCheckinStore.setState({ history: [], loading: false });
    jest.clearAllMocks();
  });

  it('has empty history initially', () => {
    const state = useCheckinStore.getState();
    expect(state.history).toEqual([]);
  });

  it('has loading false initially', () => {
    const state = useCheckinStore.getState();
    expect(state.loading).toBe(false);
  });

  it('loadHistory reads from AsyncStorage and sets history', async () => {
    const records = [makeRecord()];
    mockStorage['ph_checkin_history'] = JSON.stringify(records);

    await useCheckinStore.getState().loadHistory();

    const state = useCheckinStore.getState();
    expect(state.history).toEqual(records);
    expect(state.loading).toBe(false);
  });

  it('loadHistory handles null storage gracefully (empty array)', async () => {
    // mockStorage has no key, so getItem returns null
    await useCheckinStore.getState().loadHistory();

    const state = useCheckinStore.getState();
    expect(state.history).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('addCheckin prepends record to history', async () => {
    const existing = makeRecord({ id: 'rec-existing' });
    useCheckinStore.setState({ history: [existing] });

    const newRecord = makeRecord({ id: 'rec-new' });
    await useCheckinStore.getState().addCheckin(newRecord);

    const state = useCheckinStore.getState();
    expect(state.history).toHaveLength(2);
    expect(state.history[0].id).toBe('rec-new');
    expect(state.history[1].id).toBe('rec-existing');
  });

  it('addCheckin persists to AsyncStorage', async () => {
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;

    const record = makeRecord();
    await useCheckinStore.getState().addCheckin(record);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'ph_checkin_history',
      JSON.stringify([record]),
    );
  });

  it('deleteCheckin removes record by id', async () => {
    const rec1 = makeRecord({ id: 'rec-1' });
    const rec2 = makeRecord({ id: 'rec-2' });
    useCheckinStore.setState({ history: [rec1, rec2] });

    await useCheckinStore.getState().deleteCheckin('rec-1');

    const state = useCheckinStore.getState();
    expect(state.history).toHaveLength(1);
    expect(state.history[0].id).toBe('rec-2');
  });

  it('deleteCheckin persists updated list to AsyncStorage', async () => {
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;

    const rec1 = makeRecord({ id: 'rec-1' });
    const rec2 = makeRecord({ id: 'rec-2' });
    useCheckinStore.setState({ history: [rec1, rec2] });

    await useCheckinStore.getState().deleteCheckin('rec-1');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'ph_checkin_history',
      JSON.stringify([rec2]),
    );
  });

  it('addCheckin record has the expected CheckinRecord shape', async () => {
    const record = makeRecord({
      id: 'shape-test',
      seasonId: 'ajisai',
      spotId: 42,
    });
    await useCheckinStore.getState().addCheckin(record);

    const stored = useCheckinStore.getState().history[0];
    expect(stored).toHaveProperty('id', 'shape-test');
    expect(stored).toHaveProperty('seasonId', 'ajisai');
    expect(stored).toHaveProperty('spotId', 42);
    expect(stored).toHaveProperty('photoUri');
    expect(stored).toHaveProperty('composedUri');
    expect(stored).toHaveProperty('templateId');
    expect(stored).toHaveProperty('timestamp');
    expect(stored).toHaveProperty('synced');
  });
});
