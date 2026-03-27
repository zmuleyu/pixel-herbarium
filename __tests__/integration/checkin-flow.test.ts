// __tests__/integration/checkin-flow.test.ts
// Integration smoke tests: checkin store round-trip + deep link parsing

const mockStorage: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

import { useCheckinStore } from '../../src/stores/checkin-store';
import { parseDeepLink } from '../../src/utils/deep-link';
import type { CheckinRecord } from '../../src/types/hanami';

// ── Helpers ────────────────────────────────────────────────────────────────────

const makeRecord = (overrides: Partial<CheckinRecord> = {}): CheckinRecord => ({
  id: 'int-001',
  seasonId: 'sakura',
  spotId: 1,
  photoUri: 'file:///photo.jpg',
  composedUri: 'file:///composed.jpg',
  templateId: 'pixel',
  timestamp: '2026-04-01T10:00:00Z',
  synced: false,
  ...overrides,
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Checkin Flow Integration', () => {
  beforeEach(() => {
    for (const key of Object.keys(mockStorage)) {
      delete mockStorage[key];
    }
    useCheckinStore.setState({ history: [], loading: false });
    jest.clearAllMocks();
  });

  it('starts with empty history', () => {
    const { history } = useCheckinStore.getState();
    expect(history).toEqual([]);
  });

  it('addCheckin adds item to history', async () => {
    const record = makeRecord({ id: 'add-test' });
    await useCheckinStore.getState().addCheckin(record);

    const { history } = useCheckinStore.getState();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('add-test');
  });

  it('loadHistory populates from AsyncStorage', async () => {
    const records = [
      makeRecord({ id: 'load-1' }),
      makeRecord({ id: 'load-2', spotId: 3 }),
    ];
    mockStorage['ph_checkin_history'] = JSON.stringify(records);

    await useCheckinStore.getState().loadHistory();

    const { history } = useCheckinStore.getState();
    expect(history).toHaveLength(2);
    expect(history[0].id).toBe('load-1');
    expect(history[1].id).toBe('load-2');
  });

  it('history persists across store calls (getState roundtrip)', async () => {
    const record1 = makeRecord({ id: 'rt-1' });
    const record2 = makeRecord({ id: 'rt-2', spotId: 5 });

    // Add two records sequentially
    await useCheckinStore.getState().addCheckin(record1);
    await useCheckinStore.getState().addCheckin(record2);

    // Verify via fresh getState call
    const { history } = useCheckinStore.getState();
    expect(history).toHaveLength(2);
    // addCheckin prepends, so record2 is first
    expect(history[0].id).toBe('rt-2');
    expect(history[1].id).toBe('rt-1');

    // Verify AsyncStorage has the persisted data
    const persisted = JSON.parse(mockStorage['ph_checkin_history']);
    expect(persisted).toHaveLength(2);
  });

  it('total count reflects history length', async () => {
    await useCheckinStore.getState().addCheckin(makeRecord({ id: 'c-1' }));
    await useCheckinStore.getState().addCheckin(makeRecord({ id: 'c-2' }));
    await useCheckinStore.getState().addCheckin(makeRecord({ id: 'c-3' }));

    const { history } = useCheckinStore.getState();
    expect(history.length).toBe(3);
  });
});

describe('Deep Link Parsing Integration', () => {
  it('parses plant deep link', () => {
    const result = parseDeepLink('pixelherbarium://plant/sakura-001');
    expect(result).toEqual({ type: 'plant', id: 'sakura-001' });
  });

  it('parses spot deep link', () => {
    const result = parseDeepLink('pixelherbarium://spot/ueno-park');
    expect(result).toEqual({ type: 'spot', id: 'ueno-park' });
  });

  it('parses invite deep link', () => {
    const result = parseDeepLink('pixelherbarium://invite/ABC123');
    expect(result).toEqual({ type: 'invite', code: 'ABC123' });
  });

  it('returns null for invalid/empty URLs', () => {
    expect(parseDeepLink(null)).toBeNull();
    expect(parseDeepLink(undefined)).toBeNull();
    expect(parseDeepLink('')).toBeNull();
    expect(parseDeepLink('pixelherbarium://unknown/foo')).toBeNull();
  });

  it('handles https scheme deep links', () => {
    const result = parseDeepLink('https://pixelherbarium.app/plant/cherry-01');
    expect(result).toEqual({ type: 'plant', id: 'cherry-01' });
  });
});
