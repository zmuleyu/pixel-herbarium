/**
 * Tests for useHerbarium hook.
 * Supabase is mocked — tests cover data-loading logic only.
 */

jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { supabase } from '@/services/supabase';
import { useHerbarium } from '@/hooks/useHerbarium';
import { TOTAL_PLANTS } from '@/constants/plants';

const mockFrom = supabase.from as jest.Mock;

// Flush all pending microtasks/promises
const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function mockPlantsQuery(data: any[], error: any = null) {
  return {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data, error }),
  };
}

function mockCollectionsQuery(data: any[], error: any = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data, error }),
  };
}

const MOCK_PLANTS = Array.from({ length: 120 }, (_, i) => ({
  id: i + 1,
  name_ja: `植物${i + 1}`,
  name_en: `Plant ${i + 1}`,
  name_latin: `Genus species ${i + 1}`,
  rarity: (i % 3) + 1,
  pixel_sprite_url: null,
  hanakotoba: '花言葉',
  bloom_months: [4, 5],
}));

const MOCK_COLLECTIONS = [
  { plant_id: 1, discovered_at: '2026-04-01T10:00:00Z' },
  { plant_id: 7, discovered_at: '2026-04-05T12:00:00Z' },
  { plant_id: 42, discovered_at: '2026-04-10T08:00:00Z' },
];

function setupMocks(
  plants = MOCK_PLANTS,
  collections = MOCK_COLLECTIONS,
  plantsError: any = null,
  collectionsError: any = null,
) {
  mockFrom
    .mockReturnValueOnce(mockPlantsQuery(plants, plantsError))
    .mockReturnValueOnce(mockCollectionsQuery(collections, collectionsError));
}

beforeEach(() => {
  mockFrom.mockReset();
});

describe('useHerbarium – initial load', () => {
  it('starts with loading=true before data arrives', () => {
    // Use a never-resolving promise so loading stays true
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnValue(new Promise(() => {})),
    });
    const { result } = renderHook(() => useHerbarium('user-1'));
    expect(result.current.loading).toBe(true);
  });

  it('loads all 120 plant slots after fetch', async () => {
    setupMocks();
    const { result } = renderHook(() => useHerbarium('user-1'));
    await act(async () => { await flushPromises(); });
    expect(result.current.plants).toHaveLength(TOTAL_PLANTS);
    expect(result.current.loading).toBe(false);
  });

  it('collected Set contains discovered plant_ids', async () => {
    setupMocks();
    const { result } = renderHook(() => useHerbarium('user-1'));
    await act(async () => { await flushPromises(); });
    expect(result.current.collected.has(1)).toBe(true);
    expect(result.current.collected.has(7)).toBe(true);
    expect(result.current.collected.has(42)).toBe(true);
    expect(result.current.collected.has(2)).toBe(false);
  });

  it('collected count equals collections length', async () => {
    setupMocks();
    const { result } = renderHook(() => useHerbarium('user-1'));
    await act(async () => { await flushPromises(); });
    expect(result.current.collected.size).toBe(3);
  });
});

describe('useHerbarium – empty collection', () => {
  it('collected is empty Set when no discoveries', async () => {
    setupMocks(MOCK_PLANTS, []);
    const { result } = renderHook(() => useHerbarium('user-1'));
    await act(async () => { await flushPromises(); });
    expect(result.current.collected.size).toBe(0);
    expect(result.current.plants).toHaveLength(TOTAL_PLANTS);
  });
});

describe('useHerbarium – error handling', () => {
  it('sets loading=false and empty plants on query error', async () => {
    setupMocks([], [], new Error('DB unavailable'));
    const { result } = renderHook(() => useHerbarium('user-1'));
    await act(async () => { await flushPromises(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.plants).toHaveLength(0);
  });
});

describe('useHerbarium – refresh', () => {
  it('re-fetches data when refresh() is called', async () => {
    setupMocks();
    const { result } = renderHook(() => useHerbarium('user-1'));
    await act(async () => { await flushPromises(); });
    expect(result.current.collected.size).toBe(3);

    // Setup mocks for second fetch (only 1 collection entry)
    setupMocks(MOCK_PLANTS, [{ plant_id: 1, discovered_at: '2026-04-01T10:00:00Z' }]);

    act(() => { result.current.refresh(); });
    await act(async () => { await flushPromises(); });

    expect(mockFrom).toHaveBeenCalledTimes(4); // 2 initial + 2 refresh
    expect(result.current.collected.size).toBe(1);
  });
});
