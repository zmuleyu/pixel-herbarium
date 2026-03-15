import { renderHook, act } from '@testing-library/react-hooks';
import { useHerbariumFilter } from '@/hooks/useHerbariumFilter';
import type { PlantSlot } from '@/hooks/useHerbarium';

const mockPlants: PlantSlot[] = [
  { id: 1, name_ja: 'サクラ', name_en: 'Cherry', name_latin: 'Prunus', rarity: 1, pixel_sprite_url: null, hanakotoba: '優美', bloom_months: [3, 4] },
  { id: 2, name_ja: 'バラ', name_en: 'Rose', name_latin: 'Rosa', rarity: 2, pixel_sprite_url: null, hanakotoba: '愛', bloom_months: [5, 6] },
  { id: 3, name_ja: 'ラン', name_en: 'Orchid', name_latin: 'Orchidaceae', rarity: 3, pixel_sprite_url: null, hanakotoba: '清純', bloom_months: [1] },
  { id: 4, name_ja: 'ヒマワリ', name_en: 'Sunflower', name_latin: 'Helianthus', rarity: 1, pixel_sprite_url: null, hanakotoba: '憧れ', bloom_months: [7, 8] },
];
const collected = new Set([1, 3]);

describe('useHerbariumFilter', () => {
  it('defaults to all filter showing all plants', () => {
    const { result } = renderHook(() => useHerbariumFilter(mockPlants, collected));
    expect(result.current.filter).toBe('all');
    expect(result.current.filteredPlants).toEqual(mockPlants);
  });

  it('filters by rarity 1 (common)', () => {
    const { result } = renderHook(() => useHerbariumFilter(mockPlants, collected));
    act(() => result.current.setFilter(1));
    expect(result.current.filteredPlants.map(p => p.id)).toEqual([1, 4]);
  });

  it('filters by rarity 2 (uncommon)', () => {
    const { result } = renderHook(() => useHerbariumFilter(mockPlants, collected));
    act(() => result.current.setFilter(2));
    expect(result.current.filteredPlants.map(p => p.id)).toEqual([2]);
  });

  it('filters by rarity 3 (rare)', () => {
    const { result } = renderHook(() => useHerbariumFilter(mockPlants, collected));
    act(() => result.current.setFilter(3));
    expect(result.current.filteredPlants.map(p => p.id)).toEqual([3]);
  });

  it('filters collected plants', () => {
    const { result } = renderHook(() => useHerbariumFilter(mockPlants, collected));
    act(() => result.current.setFilter('collected'));
    expect(result.current.filteredPlants.map(p => p.id)).toEqual([1, 3]);
  });

  it('filters uncollected plants', () => {
    const { result } = renderHook(() => useHerbariumFilter(mockPlants, collected));
    act(() => result.current.setFilter('uncollected'));
    expect(result.current.filteredPlants.map(p => p.id)).toEqual([2, 4]);
  });

  it('returns empty array when no plants match', () => {
    const { result } = renderHook(() => useHerbariumFilter([], collected));
    act(() => result.current.setFilter(1));
    expect(result.current.filteredPlants).toEqual([]);
  });

  it('updates filter value via setFilter', () => {
    const { result } = renderHook(() => useHerbariumFilter(mockPlants, collected));
    expect(result.current.filter).toBe('all');
    act(() => result.current.setFilter('collected'));
    expect(result.current.filter).toBe('collected');
  });
});
