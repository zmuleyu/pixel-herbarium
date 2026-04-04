/**
 * Tests for useBouquets hook.
 * Supabase is mocked — covers inbox/sent classification, plant enrichment, and mutations.
 */

jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { supabase } from '@/services/supabase';
import { useBouquets } from '@/hooks/useBouquets';

const mockFrom = supabase.from as jest.Mock;
const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// ── Mock builders ─────────────────────────────────────────────────────────────

function makeProfile(id: string) {
  return { id, display_name: `User-${id}`, avatar_seed: id };
}

function makeBouquetRow(
  id: string,
  senderId: string,
  receiverId: string,
  status: 'pending' | 'accepted' | 'declined',
  plantIds: number[] = [1, 2],
  message = 'テスト',
) {
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id,
    sender_id: senderId,
    receiver_id: receiverId,
    plant_ids: plantIds,
    message,
    status,
    created_at: now,
    expires_at: expires,
    sender: makeProfile(senderId),
    receiver: makeProfile(receiverId),
  };
}

function makePlant(id: number) {
  return { id, name_ja: `植物${id}`, name_en: `Plant ${id}`, rarity: 1, pixel_sprite_url: null };
}

/** bouquets query: .select().or().order() resolves */
function makeBouquetQuery(data: any[], error: any = null) {
  return {
    select: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data, error }),
  };
}

/** Pending (never resolves) — used to test loading state */
function makePendingQuery() {
  return {
    select: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnValue(new Promise(() => {})),
  };
}

/** plants batch query: .select().in() resolves */
function makePlantBatchQuery(data: any[]) {
  return {
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockResolvedValue({ data }),
  };
}

/** bouquets.insert() resolves */
function makeInsertQuery(error: any = null) {
  return {
    insert: jest.fn().mockResolvedValue({ data: null, error }),
  };
}

/** bouquets.update().eq() resolves */
function makeUpdateQuery(error: any = null) {
  return {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: null, error }),
  };
}

beforeEach(() => {
  mockFrom.mockReset();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useBouquets – initial state', () => {
  it('starts with loading=true', () => {
    mockFrom.mockReturnValue(makePendingQuery());
    const { result } = renderHook(() => useBouquets('user-1'));
    expect(result.current.loading).toBe(true);
  });

  it('does not call supabase when userId is empty', async () => {
    const { result } = renderHook(() => useBouquets(''));
    await act(async () => { await flushPromises(); });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false); // immediately resolves with no data when userId empty
  });

  it('returns empty arrays when there are no bouquets', async () => {
    mockFrom.mockReturnValueOnce(makeBouquetQuery([]));
    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.inbox).toHaveLength(0);
    expect(result.current.sent).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });

  it('handles null data gracefully', async () => {
    mockFrom.mockReturnValueOnce(makeBouquetQuery(null as any));
    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.inbox).toHaveLength(0);
    expect(result.current.sent).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });

  it('handles error gracefully', async () => {
    mockFrom.mockReturnValueOnce(makeBouquetQuery(null as any, { message: 'DB error' }));
    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.inbox).toHaveLength(0);
  });
});

describe('useBouquets – inbox/sent classification', () => {
  it('puts pending received bouquet in inbox', async () => {
    const row = makeBouquetRow('b-1', 'user-9', 'user-1', 'pending', [1]);
    mockFrom
      .mockReturnValueOnce(makeBouquetQuery([row]))
      .mockReturnValueOnce(makePlantBatchQuery([makePlant(1)]));

    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.inbox).toHaveLength(1);
    expect(result.current.inbox[0].id).toBe('b-1');
    expect(result.current.sent).toHaveLength(0);
  });

  it('puts sent bouquet in sent array regardless of status', async () => {
    const rows = [
      makeBouquetRow('b-2', 'user-1', 'user-9', 'pending', [1]),
      makeBouquetRow('b-3', 'user-1', 'user-8', 'accepted', [2]),
    ];
    mockFrom
      .mockReturnValueOnce(makeBouquetQuery(rows))
      .mockReturnValueOnce(makePlantBatchQuery([makePlant(1), makePlant(2)]));

    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.sent).toHaveLength(2);
    expect(result.current.inbox).toHaveLength(0);
  });

  it('accepted received bouquet is NOT in inbox', async () => {
    const row = makeBouquetRow('b-4', 'user-9', 'user-1', 'accepted', [1]);
    mockFrom
      .mockReturnValueOnce(makeBouquetQuery([row]))
      .mockReturnValueOnce(makePlantBatchQuery([makePlant(1)]));

    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.inbox).toHaveLength(0);
    expect(result.current.sent).toHaveLength(0); // not sender either
  });

  it('expired pending bouquet is NOT in inbox', async () => {
    const expiredRow = {
      ...makeBouquetRow('b-expired', 'user-9', 'user-1', 'pending', [1]),
      expires_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
    mockFrom
      .mockReturnValueOnce(makeBouquetQuery([expiredRow]))
      .mockReturnValueOnce(makePlantBatchQuery([makePlant(1)]));

    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.inbox).toHaveLength(0);
  });

  it('not-yet-expired pending bouquet stays in inbox', async () => {
    const freshRow = {
      ...makeBouquetRow('b-fresh', 'user-9', 'user-1', 'pending', [1]),
      expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
    mockFrom
      .mockReturnValueOnce(makeBouquetQuery([freshRow]))
      .mockReturnValueOnce(makePlantBatchQuery([makePlant(1)]));

    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.inbox).toHaveLength(1);
  });
});

describe('useBouquets – plant enrichment', () => {
  it('enriches bouquet with plant data', async () => {
    const row = makeBouquetRow('b-1', 'user-9', 'user-1', 'pending', [5, 10]);
    const plants = [makePlant(5), makePlant(10)];
    mockFrom
      .mockReturnValueOnce(makeBouquetQuery([row]))
      .mockReturnValueOnce(makePlantBatchQuery(plants));

    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.inbox[0].plants).toHaveLength(2);
    expect(result.current.inbox[0].plants![0].id).toBe(5);
    expect(result.current.inbox[0].plants![1].id).toBe(10);
  });

  it('deduplicates plant IDs across bouquets before batch query', async () => {
    const rows = [
      makeBouquetRow('b-1', 'user-9', 'user-1', 'pending', [1, 2]),
      makeBouquetRow('b-2', 'user-1', 'user-8', 'pending', [2, 3]), // plant 2 duplicated
    ];
    const plantQueryMock = makePlantBatchQuery([makePlant(1), makePlant(2), makePlant(3)]);
    mockFrom
      .mockReturnValueOnce(makeBouquetQuery(rows))
      .mockReturnValueOnce(plantQueryMock);

    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    // .in() called once with deduplicated IDs (order may vary)
    const inArgs = plantQueryMock.in.mock.calls[0][1] as number[];
    expect(new Set(inArgs).size).toBe(inArgs.length); // no duplicates
    expect(inArgs).toHaveLength(3);
  });

  it('skips plant query when no plant_ids exist', async () => {
    const row = makeBouquetRow('b-1', 'user-9', 'user-1', 'pending', []);
    mockFrom.mockReturnValueOnce(makeBouquetQuery([row]));
    // NO second mockReturnValue — plant query should not be called

    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.inbox[0].plants).toHaveLength(0);
    expect(mockFrom).toHaveBeenCalledTimes(1); // only bouquets query
  });
});

describe('useBouquets – mutations', () => {
  function setupLoad(rows: any[] = [], plants: any[] = []) {
    if (rows.length === 0 || rows.every((r) => !r.plant_ids?.length)) {
      mockFrom.mockReturnValueOnce(makeBouquetQuery(rows));
    } else {
      mockFrom
        .mockReturnValueOnce(makeBouquetQuery(rows))
        .mockReturnValueOnce(makePlantBatchQuery(plants));
    }
  }

  it('acceptBouquet updates status and triggers refetch', async () => {
    setupLoad();
    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    mockFrom
      .mockReturnValueOnce(makeUpdateQuery())
      .mockReturnValueOnce(makeBouquetQuery([])); // refetch

    await act(async () => {
      await result.current.acceptBouquet('b-1');
      await flushPromises();
    });

    expect(result.current.loading).toBe(false);
  });

  it('declineBouquet triggers refetch', async () => {
    setupLoad();
    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    mockFrom
      .mockReturnValueOnce(makeUpdateQuery())
      .mockReturnValueOnce(makeBouquetQuery([]));

    await act(async () => {
      await result.current.declineBouquet('b-1');
      await flushPromises();
    });

    expect(result.current.loading).toBe(false);
  });

  it('sendBouquet inserts with correct fields and triggers refetch', async () => {
    setupLoad();
    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    const insertMock = makeInsertQuery();
    mockFrom
      .mockReturnValueOnce(insertMock)
      .mockReturnValueOnce(makeBouquetQuery([]));

    await act(async () => {
      await result.current.sendBouquet('user-2', [3, 7, 12], '春の花束');
      await flushPromises();
    });

    const insertArg = insertMock.insert.mock.calls[0][0];
    expect(insertArg.sender_id).toBe('user-1');
    expect(insertArg.receiver_id).toBe('user-2');
    expect(insertArg.plant_ids).toEqual([3, 7, 12]);
    expect(insertArg.message).toBe('春の花束');
    expect(insertArg.status).toBe('pending');
  });

  it('sendBouquet sets expires_at ~7 days from now', async () => {
    setupLoad();
    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    const insertMock = makeInsertQuery();
    mockFrom
      .mockReturnValueOnce(insertMock)
      .mockReturnValueOnce(makeBouquetQuery([]));

    const before = Date.now();
    await act(async () => {
      await result.current.sendBouquet('user-2', [1], '');
      await flushPromises();
    });
    const after = Date.now();

    const insertArg = insertMock.insert.mock.calls[0][0];
    const expiresMs = new Date(insertArg.expires_at).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expiresMs).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });

  it('acceptBouquet rejects and does not refetch on update error', async () => {
    setupLoad();
    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    mockFrom.mockReturnValueOnce(makeUpdateQuery({ message: 'update failed' }));

    await expect(result.current.acceptBouquet('b-1')).rejects.toEqual({ message: 'update failed' });
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it('sendBouquet rejects and does not refetch on insert error', async () => {
    setupLoad();
    const { result } = renderHook(() => useBouquets('user-1'));
    await act(async () => { await flushPromises(); });

    mockFrom.mockReturnValueOnce(makeInsertQuery({ message: 'insert failed' }));

    await expect(result.current.sendBouquet('user-2', [1, 2, 3], 'hello')).rejects.toEqual({ message: 'insert failed' });
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });
});
