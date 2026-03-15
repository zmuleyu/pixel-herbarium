/**
 * Tests for useSeasonRecap hook.
 * Supabase is mocked. Date is fixed to 2026-03-15 (spring).
 */

jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { supabase } from '@/services/supabase';
import { useSeasonRecap } from '@/hooks/useSeasonRecap';

const mockFrom = supabase.from as jest.Mock;
const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// ── Mock builders ─────────────────────────────────────────────────────────────

function makeDiscoveryRows(plants: Array<{ id: number; name_ja: string; rarity: number }>) {
  return plants.map((p, i) => ({
    created_at: `2026-03-${String(i + 10).padStart(2, '0')}T10:00:00Z`,
    plants: {
      id: p.id,
      name_ja: p.name_ja,
      name_latin: `Genus ${p.id}`,
      rarity: p.rarity,
      hanakotoba: '花言葉',
      pixel_sprite_url: null,
    },
  }));
}

function makeQuery(data: any[]) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data }),
  };
}

beforeEach(() => {
  mockFrom.mockReset();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useSeasonRecap – season window', () => {
  it('returns a valid season value', async () => {
    mockFrom.mockReturnValueOnce(makeQuery([]));
    const { result } = renderHook(() => useSeasonRecap('user-1'));
    await act(async () => { await flushPromises(); });

    expect(['spring', 'summer', 'autumn', 'winter']).toContain(result.current.season.season);
  });

  it('season window: start is before end', async () => {
    mockFrom.mockReturnValueOnce(makeQuery([]));
    const { result } = renderHook(() => useSeasonRecap('user-1'));
    await act(async () => { await flushPromises(); });

    const { start, end } = result.current.season;
    expect(start.getTime()).toBeLessThan(end.getTime());
  });

  it('season label matches format "[季節] YYYY"', async () => {
    mockFrom.mockReturnValueOnce(makeQuery([]));
    const { result } = renderHook(() => useSeasonRecap('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.season.label).toMatch(/^(春|夏|秋|冬) \d{4}$/);
  });
});

describe('useSeasonRecap – data loading', () => {
  it('starts with loading=true', () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnValue(new Promise(() => {})),
    });
    const { result } = renderHook(() => useSeasonRecap('user-1'));
    expect(result.current.loading).toBe(true);
  });

  it('returns empty plants and loading=false for empty userId', async () => {
    const { result } = renderHook(() => useSeasonRecap(''));
    await act(async () => { await flushPromises(); });

    expect(result.current.plants).toHaveLength(0);
    expect(result.current.loading).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('maps discovery rows to RecapPlant shape', async () => {
    const rows = makeDiscoveryRows([{ id: 5, name_ja: 'サクラ', rarity: 2 }]);
    mockFrom.mockReturnValueOnce(makeQuery(rows));

    const { result } = renderHook(() => useSeasonRecap('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.plants).toHaveLength(1);
    expect(result.current.plants[0].name_ja).toBe('サクラ');
    expect(result.current.plants[0].rarity).toBe(2);
    expect(result.current.plants[0].id).toBe(5);
  });

  it('returns multiple plants', async () => {
    const rows = makeDiscoveryRows([
      { id: 1, name_ja: 'ソメイヨシノ', rarity: 2 },
      { id: 7, name_ja: 'タンポポ', rarity: 1 },
      { id: 42, name_ja: 'コスモス', rarity: 1 },
    ]);
    mockFrom.mockReturnValueOnce(makeQuery(rows));

    const { result } = renderHook(() => useSeasonRecap('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.plants).toHaveLength(3);
  });
});

describe('useSeasonRecap – deduplication', () => {
  it('deduplicates same plant_id discovered multiple times', async () => {
    // Two rows for plant id=5, one for id=9
    const rows = [
      ...makeDiscoveryRows([{ id: 5, name_ja: 'サクラ', rarity: 2 }]),
      ...makeDiscoveryRows([{ id: 5, name_ja: 'サクラ', rarity: 2 }]),
      ...makeDiscoveryRows([{ id: 9, name_ja: 'ウメ', rarity: 1 }]),
    ];
    mockFrom.mockReturnValueOnce(makeQuery(rows));

    const { result } = renderHook(() => useSeasonRecap('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.plants).toHaveLength(2);
    const ids = result.current.plants.map((p) => p.id);
    expect(ids).toContain(5);
    expect(ids).toContain(9);
  });

  it('keeps the first occurrence when deduplicating', async () => {
    const first = {
      created_at: '2026-03-10T08:00:00Z',
      plants: { id: 5, name_ja: 'サクラ', name_latin: 'Prunus', rarity: 2, hanakotoba: '優雅', pixel_sprite_url: 'first.png' },
    };
    const second = {
      created_at: '2026-03-20T10:00:00Z',
      plants: { id: 5, name_ja: 'サクラ', name_latin: 'Prunus', rarity: 2, hanakotoba: '優雅', pixel_sprite_url: 'second.png' },
    };
    mockFrom.mockReturnValueOnce(makeQuery([first, second]));

    const { result } = renderHook(() => useSeasonRecap('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.plants).toHaveLength(1);
    // discovered_at from the first row in array
    expect(result.current.plants[0].discovered_at).toBe('2026-03-10T08:00:00Z');
  });
});

describe('useSeasonRecap – error resilience', () => {
  it('returns empty plants gracefully when data is null', async () => {
    mockFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null }),
    });

    const { result } = renderHook(() => useSeasonRecap('user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.plants).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });
});
