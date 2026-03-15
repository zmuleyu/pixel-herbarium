import { useState, useMemo } from 'react';
import type { PlantSlot } from './useHerbarium';

export type FilterValue = 'all' | 1 | 2 | 3 | 'collected' | 'uncollected';

export const FILTER_OPTIONS: { value: FilterValue; labelKey: string }[] = [
  { value: 'all', labelKey: 'herbarium.filterAll' },
  { value: 1, labelKey: 'herbarium.filterCommon' },
  { value: 2, labelKey: 'herbarium.filterUncommon' },
  { value: 3, labelKey: 'herbarium.filterRare' },
  { value: 'collected', labelKey: 'herbarium.filterCollected' },
  { value: 'uncollected', labelKey: 'herbarium.filterUncollected' },
];

export function useHerbariumFilter(plants: PlantSlot[], collected: Set<number>) {
  const [filter, setFilter] = useState<FilterValue>('all');

  const filteredPlants = useMemo(() => {
    if (filter === 'all') return plants;
    if (filter === 'collected') return plants.filter(p => collected.has(p.id));
    if (filter === 'uncollected') return plants.filter(p => !collected.has(p.id));
    return plants.filter(p => p.rarity === filter);
  }, [plants, collected, filter]);

  return { filter, setFilter, filteredPlants };
}
