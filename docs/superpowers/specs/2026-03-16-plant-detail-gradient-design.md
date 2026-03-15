# Plant Detail Hero Gradient Background — Design Spec

**Date**: 2026-03-16
**Status**: Approved
**Scope**: `plant/[id].tsx` posterArea only

## Summary

Add rarity-mapped gradient backgrounds to the plant detail hero area (posterArea).
Each rarity tier gets a distinct gradient: sage green (common), sky blue (uncommon),
blush pink (rare). When the plant is currently in bloom, the gradient start color
saturates slightly (~10%) for a subtle seasonal enhancement.

## Motivation

- **UI reference**: Treer 小树 (Xiaohongshu) — per-plant gradient background
- **Existing pattern**: Onboarding already uses `expo-linear-gradient` with per-slide configs
- **Goal**: Make plant detail pages feel more alive and distinguished by rarity,
  reinforcing the collection mechanic without adding complexity

## Design Decisions

### Scope: Hero area only (not full page)

The gradient applies only to `posterArea` (pixel art + name + hanakotoba).
The rest of the page remains `colors.background` (cream #f5f4f1).

**Why**: Focused visual impact, smaller change surface, poster capture looks better
with a self-contained gradient card.

### Color mapping: Rarity-based with bloom enhancement

| Rarity | Start color | End color | Bloom start (enhanced) |
|--------|-------------|-----------|------------------------|
| ★ Common (1) | `#e8f0e8` sage green | `#f5f4f1` cream | `#dceadc` (+10% sat) |
| ★★ Uncommon (2) | `#e0eaf5` sky blue | `#f5f4f1` cream | `#d4e2f5` (+10% sat) |
| ★★★ Rare (3) | `#f5e0dd` blush pink | `#f5f4f1` cream | `#f5d4cf` (+10% sat) |

Bloom enhancement is determined by comparing the current month against `plant.bloom_months`.
If the current month is in the bloom array, the start color is saturated by ~10%.

**Why rarity over seasonal**: Simpler (3 base colors vs 12 combinations), uses existing
`RARITY_COLORS` alignment, seasonal can be added in v1.1 via approach B.

### Gradient direction: Top to bottom

`start={{ x: 0.5, y: 0 }}` → `end={{ x: 0.5, y: 1 }}`

Consistent with onboarding gradient direction.

## Architecture

### New file: `src/utils/plant-gradient.ts`

Pure utility module. No hooks, no side effects.

```typescript
const RARITY_GRADIENT: Record<number, { start: string; end: string }> = {
  1: { start: '#e8f0e8', end: '#f5f4f1' },
  2: { start: '#e0eaf5', end: '#f5f4f1' },
  3: { start: '#f5e0dd', end: '#f5f4f1' },
};

function saturateHex(hex: string, amount: number): string {
  // Convert hex → HSL, increase S by amount (absolute), convert back
  // Edge cases: clamp saturation at [0, 1], normalize hex (strip #, handle 3/6 digit)
  // Achromatic colors (S=0) remain unchanged
}

export function getPlantGradientColors(
  rarity: number,
  bloomMonths: number[],
  currentMonth?: number
): [string, string] {
  const base = RARITY_GRADIENT[rarity] ?? RARITY_GRADIENT[1];
  const month = currentMonth ?? new Date().getMonth() + 1;
  const inBloom = bloomMonths.includes(month);
  const start = inBloom ? saturateHex(base.start, 0.1) : base.start;
  return [start, base.end];
}
```

**Key design choices:**
- `currentMonth` optional param for testability (inject fixed month, no Date mocking)
- Fallback to rarity 1 (common) for unknown rarity values
- Returns `[string, string]` tuple matching LinearGradient's `colors` prop

### Modified file: `src/app/plant/[id].tsx`

Changes:
1. Import `LinearGradient` from `expo-linear-gradient`
2. Import `getPlantGradientColors` from `@/utils/plant-gradient`
3. Compute gradient colors: `const gradientColors = getPlantGradientColors(plant.rarity, plant.bloom_months)`
4. Replace `posterArea` backgroundColor with LinearGradient child:

```tsx
<View ref={posterRef} style={[styles.posterArea, { borderColor: rarityColor }]}>
  <LinearGradient
    colors={gradientColors}
    style={StyleSheet.absoluteFill}
    start={{ x: 0.5, y: 0 }}
    end={{ x: 0.5, y: 1 }}
  />
  {/* existing children unchanged */}
</View>
```

5. Add `overflow: 'hidden'` to `styles.posterArea` in the **StyleSheet** (line 287), not inline
6. Remove `backgroundColor: colors.white` from the **inline style** at line 113:
   - Before: `style={[styles.posterArea, { borderColor: rarityColor, backgroundColor: colors.white }]}`
   - After: `style={[styles.posterArea, { borderColor: rarityColor }]}`

**Deliberate visual change**: The poster background shifts from pure white (`#ffffff`)
to a gradient ending at cream (`#f5f4f1`). This is intentional — the card now blends
smoothly into the cream page background instead of having a hard white→cream edge.

**Not changed**: All text styles, spacing, other sections, loading/error states.

### Poster capture compatibility

`react-native-view-shot` (`captureRef`) captures native views including LinearGradient.
The shared poster will include the gradient background. No changes needed to `handleShare`.

**Note**: The separate `SharePoster` component (`src/components/SharePoster.tsx`) is not
used in `[id].tsx`. If it is adopted for plant detail sharing in the future, gradient
support would need to be added there separately.

## Testing

### New file: `__tests__/utils/plant-gradient.test.ts`

| # | Test case | Input | Expected |
|---|-----------|-------|----------|
| 1 | Common rarity returns sage green gradient | rarity=1, bloom=[], month=1 | `['#e8f0e8', '#f5f4f1']` |
| 2 | Uncommon rarity returns sky blue gradient | rarity=2, bloom=[], month=1 | `['#e0eaf5', '#f5f4f1']` |
| 3 | Rare rarity returns blush pink gradient | rarity=3, bloom=[], month=1 | `['#f5e0dd', '#f5f4f1']` |
| 4 | Unknown rarity falls back to common | rarity=99, bloom=[], month=1 | `['#e8f0e8', '#f5f4f1']` |
| 5 | Bloom month enhances start color saturation | rarity=1, bloom=[3,4], month=3 | `['#dceadc', '#f5f4f1']` (exact bloom color) |
| 6 | Non-bloom month uses base color | rarity=1, bloom=[3,4], month=7 | `['#e8f0e8', '#f5f4f1']` |
| 7 | Empty bloom array never enhances | rarity=2, bloom=[], month=6 | `['#e0eaf5', '#f5f4f1']` |
| 8 | Returns [string, string] tuple | any valid input | Array of length 2 |

No component snapshot tests — gradient is visual, verified by eye on device.

**Note on RARITY_COLORS duplication**: `RARITY_COLORS` (single accent color per rarity)
is currently duplicated across 5 files (`[id].tsx`, `friend/[id].tsx`, `herbarium.tsx`,
`map.tsx`, `recap.tsx`). The new `RARITY_GRADIENT` serves a different purpose (gradient
start/end pairs), so it lives separately. Future cleanup could centralize all
rarity-related color mappings into a shared utility.

**Non-goals**: Dark mode (not supported by the app). Accessibility contrast is maintained —
`colors.text` (#3a3a3a) on all gradient start colors exceeds WCAG AAA (>7:1 ratio).

## Files Changed

| File | Action | Lines (est.) |
|------|--------|--------------|
| `src/utils/plant-gradient.ts` | **New** | ~35 |
| `src/app/plant/[id].tsx` | **Modified** | ~8 lines changed |
| `__tests__/utils/plant-gradient.test.ts` | **New** | ~60 |

## Future Iterations (out of scope)

- **v1.1**: Seasonal color blending (approach B from brainstorming)
- **v1.2**: Animated gradient shift on bloom state change
- **v1.3**: User-customizable gradient themes
