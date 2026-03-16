/**
 * Tests for usePlantDetail hook.
 * Supabase is mocked — covers data-loading, error handling, and updateNote.
 */

jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { supabase } from '@/services/supabase';
import { usePlantDetail } from '@/hooks/usePlantDetail';

const mockFrom = supabase.from as jest.Mock;
const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// ── Mock builders ─────────────────────────────────────────────────────────────

const MOCK_PLANT = {
  id: 3,
  name_ja: 'ソメイヨシノ',
  name_en: 'Someiyoshino Cherry',
  name_latin: 'Prunus × yedoensis',
  rarity: 2,
  hanakotoba: '優れた美しさ',
  flower_meaning: '清楚な美しさ',
  bloom_months: [3, 4],
  prefectures: ['東京', '大阪', '京都'],
  pixel_sprite_url: 'https://example.com/sprite3.png',
  available_window: null,
};

const MOCK_DISCOVERIES = [
  { id: 'disc-1', created_at: '2026-03-20T10:00:00Z', pixel_url: 'https://example.com/px1.png', user_note: 'きれいだった', city: '東京' },
  { id: 'disc-2', created_at: '2026-04-01T08:00:00Z', pixel_url: null, user_note: null, city: null },
];

function makePlantQuery(data: any, error: any = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
  };
}

function makeDiscoveryQuery(data: any[], error: any = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data, error }),
  };
}

function makeUpdateQuery() {
  return {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
}

function setupMocks(
  plant: typeof MOCK_PLANT | null = MOCK_PLANT,
  discoveries = MOCK_DISCOVERIES,
  plantError: any = null,
) {
  mockFrom
    .mockReturnValueOnce(makePlantQuery(plant, plantError))
    .mockReturnValueOnce(makeDiscoveryQuery(discoveries));
}

beforeEach(() => {
  mockFrom.mockReset();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('usePlantDetail – initial load', () => {
  it('starts with loading=true', () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnValue(new Promise(() => {})),
      order: jest.fn().mockReturnValue(new Promise(() => {})),
    });
    const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
    expect(result.current.loading).toBe(true);
    expect(result.current.plant).toBeNull();
  });

  it('skips fetch when plantId or userId is empty', async () => {
    const { result } = renderHook(() => usePlantDetail(0, ''));
    await act(async () => { await flushPromises(); });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true); // stays loading (no fetch triggered)
  });

  it('loads plant and discoveries after fetch', async () => {
    setupMocks();
    const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.plant?.name_ja).toBe('ソメイヨシノ');
    expect(result.current.plant?.bloom_months).toEqual([3, 4]);
    expect(result.current.discoveries).toHaveLength(2);
  });

  it('discoveries are in descending order (as returned by DB)', async () => {
    setupMocks();
    const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.discoveries[0].id).toBe('disc-1');
    expect(result.current.discoveries[1].id).toBe('disc-2');
  });

  it('includes city field in discoveries', async () => {
    setupMocks();
    const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
    await act(async () => { await flushPromises(); });
    expect(result.current.discoveries[0].city).toBe('東京');
    expect(result.current.discoveries[1].city).toBeNull();
  });
});

describe('usePlantDetail – empty discoveries', () => {
  it('returns empty array when no discoveries exist', async () => {
    setupMocks(MOCK_PLANT, []);
    const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.discoveries).toHaveLength(0);
    expect(result.current.plant).not.toBeNull();
  });
});

describe('usePlantDetail – error handling', () => {
  it('sets error message when plant fetch fails', async () => {
    setupMocks(null, [], { message: '植物が見つかりません' });
    const { result } = renderHook(() => usePlantDetail(99, 'user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('植物が見つかりません');
    expect(result.current.plant).toBeNull();
  });
});

describe('usePlantDetail – updateNote', () => {
  it('optimistically updates user_note in local state', async () => {
    setupMocks();
    const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
    await act(async () => { await flushPromises(); });

    // Setup mock for the update call
    mockFrom.mockReturnValueOnce(makeUpdateQuery());

    await act(async () => {
      await result.current.updateNote('disc-1', '桜の下で見つけた');
    });

    const updated = result.current.discoveries.find((d) => d.id === 'disc-1');
    expect(updated?.user_note).toBe('桜の下で見つけた');
  });

  it('sets user_note to null when saving empty string', async () => {
    setupMocks();
    const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
    await act(async () => { await flushPromises(); });

    mockFrom.mockReturnValueOnce(makeUpdateQuery());

    await act(async () => {
      await result.current.updateNote('disc-1', '   '); // whitespace only
    });

    const updated = result.current.discoveries.find((d) => d.id === 'disc-1');
    expect(updated?.user_note).toBeNull();
  });

  it('does not change other discoveries when updating one note', async () => {
    setupMocks();
    const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
    await act(async () => { await flushPromises(); });

    mockFrom.mockReturnValueOnce(makeUpdateQuery());

    await act(async () => {
      await result.current.updateNote('disc-1', '新しいメモ');
    });

    const unchanged = result.current.discoveries.find((d) => d.id === 'disc-2');
    expect(unchanged?.user_note).toBeNull();
  });
});

describe('usePlantDetail – reactivity', () => {
  it('re-fetches when plantId changes', async () => {
    setupMocks();
    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => usePlantDetail(id, 'user-1'),
      { initialProps: { id: 3 } },
    );
    await act(async () => { await flushPromises(); });
    expect(mockFrom).toHaveBeenCalledTimes(2); // plant + discoveries

    // Change plant ID
    const PLANT_5 = { ...MOCK_PLANT, id: 5, name_ja: 'コスモス' };
    mockFrom
      .mockReturnValueOnce(makePlantQuery(PLANT_5))
      .mockReturnValueOnce(makeDiscoveryQuery([]));

    rerender({ id: 5 });
    await act(async () => { await flushPromises(); });

    expect(result.current.plant?.name_ja).toBe('コスモス');
    expect(mockFrom).toHaveBeenCalledTimes(4);
  });
});
