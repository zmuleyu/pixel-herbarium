jest.mock('@/services/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { renderHook, act } from '@testing-library/react-hooks';
import { supabase } from '@/services/supabase';
import { usePlantDetail } from '@/hooks/usePlantDetail';

const mockFrom = supabase.from as jest.Mock;
const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const MOCK_PLANT = {
  id: 3,
  name_ja: 'Somei Yoshino',
  name_en: 'Someiyoshino Cherry',
  name_latin: 'Prunus x yedoensis',
  rarity: 2,
  hanakotoba: 'grace',
  flower_meaning: 'grace',
  color_meaning: 'hope',
  bloom_months: [3, 4],
  prefectures: ['Tokyo', 'Osaka', 'Kyoto'],
  pixel_sprite_url: 'https://example.com/sprite3.png',
  available_window: null,
};

const MOCK_DISCOVERIES = [
  { id: 'disc-2', created_at: '2026-04-01T08:00:00Z', pixel_url: null, user_note: null, city: null },
  { id: 'disc-1', created_at: '2026-03-20T10:00:00Z', pixel_url: 'https://example.com/px1.png', user_note: 'nice', city: 'Tokyo' },
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

function makeUpdateQuery(error: any = null) {
  return {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: null, error }),
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

describe('usePlantDetail', () => {
  it('starts with loading=true while requests are pending', () => {
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

  it('resolves loading immediately when plantId is invalid', async () => {
    const { result } = renderHook(() => usePlantDetail(0, ''));
    await act(async () => { await flushPromises(); });
    expect(mockFrom).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.plant).toBeNull();
    expect(result.current.discoveries).toEqual([]);
  });

  it('loads plant and discoveries for signed-in users', async () => {
    setupMocks();
    const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.plant?.name_ja).toBe('Somei Yoshino');
    expect(result.current.discoveries).toHaveLength(2);
  });

  it('loads plant details for guests without querying discoveries', async () => {
    mockFrom.mockReturnValueOnce(makePlantQuery(MOCK_PLANT));
    const { result } = renderHook(() => usePlantDetail(3, ''));
    await act(async () => { await flushPromises(); });

    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.plant?.id).toBe(3);
    expect(result.current.discoveries).toEqual([]);
  });

  it('preserves descending discovery order from the DB result', async () => {
    setupMocks();
    const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.discoveries[0].id).toBe('disc-2');
    expect(result.current.discoveries[1].id).toBe('disc-1');
  });

  it('sets error when plant fetch fails', async () => {
    setupMocks(null, [], { message: 'not found' });
    const { result } = renderHook(() => usePlantDetail(99, 'user-1'));
    await act(async () => { await flushPromises(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('not found');
    expect(result.current.plant).toBeNull();
  });

  it('optimistically updates note when update succeeds', async () => {
    setupMocks();
    const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
    await act(async () => { await flushPromises(); });

    mockFrom.mockReturnValueOnce(makeUpdateQuery());

    await act(async () => {
      await result.current.updateNote('disc-2', 'new note');
    });

    const updated = result.current.discoveries.find((d) => d.id === 'disc-2');
    expect(updated?.user_note).toBe('new note');
  });

  it('reverts optimistic note change when update fails', async () => {
    setupMocks();
    const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
    await act(async () => { await flushPromises(); });

    mockFrom.mockReturnValueOnce(makeUpdateQuery({ message: 'update failed' }));

    await expect(result.current.updateNote('disc-2', 'new note')).rejects.toEqual({ message: 'update failed' });

    const unchanged = result.current.discoveries.find((d) => d.id === 'disc-2');
    expect(unchanged?.user_note).toBeNull();
  });
});
