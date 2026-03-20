# Plant Detail Hero Gradient Background — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add rarity-mapped gradient backgrounds to the plant detail hero area with bloom-aware saturation enhancement.

**Architecture:** Pure utility function `getPlantGradientColors` maps rarity → gradient colors with optional bloom enhancement via HSL saturation. `plant/[id].tsx` wraps posterArea content in a `LinearGradient` background layer.

**Tech Stack:** expo-linear-gradient (already installed), React Native StyleSheet, Jest (ts-jest)

**Spec:** `docs/superpowers/specs/2026-03-16-plant-detail-gradient-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/utils/plant-gradient.ts` | **Create** | Rarity→gradient color mapping + `saturateHex` helper |
| `__tests__/utils/plant-gradient.test.ts` | **Create** | Unit tests for `getPlantGradientColors` |
| `src/app/plant/[id].tsx` | **Modify** | Add LinearGradient to posterArea |

---

## Chunk 1: Utility + Tests + UI Integration

### Task 1: Write failing tests for getPlantGradientColors

**Files:**
- Create: `__tests__/utils/plant-gradient.test.ts`

- [ ] **Step 1: Create test file with all test cases**

```typescript
import { getPlantGradientColors } from '@/utils/plant-gradient';

describe('getPlantGradientColors', () => {
  it('returns sage green gradient for common rarity', () => {
    const result = getPlantGradientColors(1, [], 1);
    expect(result).toEqual(['#e8f0e8', '#f5f4f1']);
  });

  it('returns sky blue gradient for uncommon rarity', () => {
    const result = getPlantGradientColors(2, [], 1);
    expect(result).toEqual(['#e0eaf5', '#f5f4f1']);
  });

  it('returns blush pink gradient for rare rarity', () => {
    const result = getPlantGradientColors(3, [], 1);
    expect(result).toEqual(['#f5e0dd', '#f5f4f1']);
  });

  it('falls back to common for unknown rarity', () => {
    const result = getPlantGradientColors(99, [], 1);
    expect(result).toEqual(['#e8f0e8', '#f5f4f1']);
  });

  it('enhances common start color when in bloom', () => {
    const result = getPlantGradientColors(1, [3, 4], 3);
    expect(result).toEqual(['#e6f2e6', '#f5f4f1']);
  });

  it('enhances uncommon start color when in bloom', () => {
    const result = getPlantGradientColors(2, [6, 7], 6);
    expect(result).toEqual(['#deeaf7', '#f5f4f1']);
  });

  it('enhances rare start color when in bloom', () => {
    const result = getPlantGradientColors(3, [3, 4], 3);
    expect(result).toEqual(['#f7dedb', '#f5f4f1']);
  });

  it('uses base color when not in bloom', () => {
    const result = getPlantGradientColors(1, [3, 4], 7);
    expect(result).toEqual(['#e8f0e8', '#f5f4f1']);
  });

  it('never enhances with empty bloom array', () => {
    const result = getPlantGradientColors(2, [], 6);
    expect(result).toEqual(['#e0eaf5', '#f5f4f1']);
  });

  it('returns tuple of two strings', () => {
    const result = getPlantGradientColors(1, [1], 1);
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('string');
    expect(typeof result[1]).toBe('string');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd D:/projects/Games/gardern/pixel-herbarium && npx jest __tests__/utils/plant-gradient.test.ts`
Expected: FAIL — module `@/utils/plant-gradient` not found

---

### Task 2: Implement getPlantGradientColors

**Files:**
- Create: `src/utils/plant-gradient.ts`

- [ ] **Step 3: Create the utility module**

```typescript
// src/utils/plant-gradient.ts
// Rarity-mapped gradient colors for plant detail hero area

const RARITY_GRADIENT: Record<number, { start: string; end: string }> = {
  1: { start: '#e8f0e8', end: '#f5f4f1' }, // sage green → cream (common)
  2: { start: '#e0eaf5', end: '#f5f4f1' }, // sky blue → cream (uncommon)
  3: { start: '#f5e0dd', end: '#f5f4f1' }, // blush pink → cream (rare)
};

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l]; // achromatic

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let hue = 0;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / d + 2) / 6;
  else hue = ((r - g) / d + 4) / 6;

  return [hue, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  if (s === 0) {
    const v = Math.round(l * 255);
    return `#${v.toString(16).padStart(2, '0').repeat(3)}`;
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function saturateHex(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  const newS = Math.min(1, Math.max(0, s + amount));
  return hslToHex(h, newS, l);
}

export function getPlantGradientColors(
  rarity: number,
  bloomMonths: number[],
  currentMonth?: number,
): [string, string] {
  const base = RARITY_GRADIENT[rarity] ?? RARITY_GRADIENT[1];
  const month = currentMonth ?? new Date().getMonth() + 1;
  const inBloom = bloomMonths.includes(month);
  const start = inBloom ? saturateHex(base.start, 0.1) : base.start;
  return [start, base.end];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd D:/projects/Games/gardern/pixel-herbarium && npx jest __tests__/utils/plant-gradient.test.ts`
Expected: 10 tests PASS

- [ ] **Step 5: Commit utility + tests**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git add src/utils/plant-gradient.ts __tests__/utils/plant-gradient.test.ts
git commit -m "feat: add getPlantGradientColors utility with tests"
```

---

### Task 3: Integrate gradient into plant detail page

**Files:**
- Modify: `src/app/plant/[id].tsx:1-14` (imports), `src/app/plant/[id].tsx:92-113` (render), `src/app/plant/[id].tsx:287` (styles)

- [ ] **Step 6: Add imports**

At top of `src/app/plant/[id].tsx`, add after the existing imports:

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { getPlantGradientColors } from '@/utils/plant-gradient';
```

- [ ] **Step 7: Compute gradient colors and update posterArea JSX**

After line 92 (`const rarityColor = ...`), add:

```typescript
const gradientColors = getPlantGradientColors(plant.rarity, plant.bloom_months);
```

Replace the posterArea View (line 113):

Before:
```tsx
<View ref={posterRef} style={[styles.posterArea, { borderColor: rarityColor, backgroundColor: colors.white }]}>
```

After:
```tsx
<View ref={posterRef} style={[styles.posterArea, { borderColor: rarityColor }]}>
  <LinearGradient
    colors={gradientColors}
    style={StyleSheet.absoluteFill}
    start={{ x: 0.5, y: 0 }}
    end={{ x: 0.5, y: 1 }}
  />
```

> **Critical**: Remove `backgroundColor: colors.white` from the inline style object.
> If left in, the white background will sit above the LinearGradient child and make
> the gradient invisible.

> **Important**: The existing children (Image, posterName, posterHanakotoba) remain unchanged.
> The closing `</View>` for posterArea also stays in place. LinearGradient is inserted as the
> first child only.

- [ ] **Step 8: Add overflow: 'hidden' to posterArea style**

In the StyleSheet (line 287), update `posterArea`:

Before:
```typescript
posterArea: { width: 220, alignItems: 'center', borderWidth: 2, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.sm, gap: 4 },
```

After:
```typescript
posterArea: { width: 220, alignItems: 'center', borderWidth: 2, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.sm, gap: 4, overflow: 'hidden' },
```

- [ ] **Step 9: Run full test suite**

Run: `cd D:/projects/Games/gardern/pixel-herbarium && npx jest`
Expected: All tests pass (existing 182 + 10 new = 192 tests)

- [ ] **Step 10: Commit UI integration**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
git add src/app/plant/[id].tsx
git commit -m "feat: add rarity gradient background to plant detail hero area"
```

---

## Verification Checklist (post-implementation)

After all tasks are committed, verify on device (Expo Go or EAS dev build):

- [ ] Common plant (★): sage green → cream gradient in posterArea
- [ ] Uncommon plant (★★): sky blue → cream gradient
- [ ] Rare plant (★★★): blush pink → cream gradient
- [ ] Plant currently in bloom: slightly more saturated start color
- [ ] Plant not in bloom: base gradient color
- [ ] Poster share captures gradient correctly (🌸 share button)
- [ ] Text readability on all three gradient backgrounds
- [ ] Page background below posterArea remains cream (#f5f4f1)
- [ ] Loading and error states unaffected
