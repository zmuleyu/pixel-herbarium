# Herbarium Filter Chips — Design Spec

**Date**: 2026-03-16
**Status**: Approved
**Scope**: `herbarium.tsx` + new `useHerbariumFilter` hook

## Summary

Add a horizontal scrolling filter chip row to the herbarium screen, allowing users
to filter the 6x10 plant grid by rarity (★/★★/★★★) or collection status
(collected/uncollected). Single-select: one chip active at a time, defaulting to "All".

## Motivation

- **UI reference**: Xiaohongshu insect identification app — category filter chips
- **Functional value**: With 60 plants, users need a way to focus on specific subsets
  (e.g., "which rare plants am I still missing?")
- **Data availability**: `PlantSlot` already has `rarity` and `bloom_months`;
  `collected` Set already tracks collection status — no new queries needed

## Design

### Filter type

```typescript
type FilterValue = 'all' | 1 | 2 | 3 | 'collected' | 'uncollected';
```

Six chips in a single horizontal row, single-select:
`全部 | ★ | ★★ | ★★★ | 収集済 | 未収集`

### New file: `src/hooks/useHerbariumFilter.ts`

```typescript
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
```

### Modified file: `src/app/(tabs)/herbarium.tsx`

**Imports added:**
- `ScrollView` from react-native
- `useHerbariumFilter`, `FILTER_OPTIONS` from `@/hooks/useHerbariumFilter`

**Hook usage** (after existing `useHerbarium` call):
```typescript
const { filter, setFilter, filteredPlants } = useHerbariumFilter(plants, collected);
```

**Chip row** — inserted between progress bar and FlatList:
```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.filterRow}
>
  {FILTER_OPTIONS.map(opt => (
    <TouchableOpacity
      key={String(opt.value)}
      style={[styles.filterChip, filter === opt.value && styles.filterChipActive]}
      onPress={() => setFilter(opt.value)}
    >
      <Text style={[styles.filterChipText, filter === opt.value && styles.filterChipTextActive]}>
        {t(opt.labelKey)}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

**FlatList change**: `data={plants}` → `data={filteredPlants}`

**Empty state**: Add `ListEmptyComponent` to FlatList:
```tsx
ListEmptyComponent={
  <View style={styles.emptyState}>
    <Text style={styles.emptyText}>{t('herbarium.noResults')}</Text>
  </View>
}
```

### Chip styles

```typescript
filterRow: {
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  gap: spacing.sm,
},
filterChip: {
  paddingHorizontal: spacing.sm + 4,  // 12
  paddingVertical: spacing.xs + 2,    // 6
  borderRadius: borderRadius.full,    // pill shape
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.background, // cream
},
filterChipActive: {
  backgroundColor: colors.plantPrimary, // sage green
  borderColor: colors.plantPrimary,
},
filterChipText: {
  fontSize: typography.fontSize.xs,     // 11
  color: colors.textSecondary,
  fontFamily: typography.fontFamily.display,
},
filterChipTextActive: {
  color: colors.white,
},
emptyState: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: spacing.xl * 2,
},
emptyText: {
  fontSize: typography.fontSize.sm,
  color: colors.textSecondary,
},
```

### i18n keys

**`src/i18n/en.json`** — add to `herbarium` object:
```json
"filterAll": "All",
"filterCommon": "★",
"filterUncommon": "★★",
"filterRare": "★★★",
"filterCollected": "Collected",
"filterUncollected": "Not yet",
"noResults": "No matches"
```

**`src/i18n/ja.json`** — add to `herbarium` object:
```json
"filterAll": "全部",
"filterCommon": "★",
"filterUncommon": "★★",
"filterRare": "★★★",
"filterCollected": "収集済",
"filterUncollected": "未収集",
"noResults": "該当なし"
```

### Testing

**New file**: `__tests__/hooks/useHerbariumFilter.test.ts`

| # | Test case | Expected |
|---|-----------|----------|
| 1 | Default filter is 'all' | returns all plants unchanged |
| 2 | Filter rarity 1 | only rarity=1 plants |
| 3 | Filter rarity 2 | only rarity=2 plants |
| 4 | Filter rarity 3 | only rarity=3 plants |
| 5 | Filter 'collected' | only plants whose id is in collected set |
| 6 | Filter 'uncollected' | only plants whose id is NOT in collected set |
| 7 | Empty plants array | returns [] for any filter |
| 8 | setFilter changes filter value | filter updates correctly |

## Files Changed

| File | Action | Lines (est.) |
|------|--------|--------------|
| `src/hooks/useHerbariumFilter.ts` | **New** | ~25 |
| `__tests__/hooks/useHerbariumFilter.test.ts` | **New** | ~70 |
| `src/app/(tabs)/herbarium.tsx` | **Modified** | ~30 lines added |
| `src/i18n/en.json` | **Modified** | +7 keys |
| `src/i18n/ja.json` | **Modified** | +7 keys |

## Not changed

- `useHerbarium` hook — data source unchanged
- Plant grid cell rendering — `PlantCell` component unchanged
- `BloomHintSheet` — unchanged
- Progress bar — still shows `collected.size / TOTAL_PLANTS` (unfiltered count)
