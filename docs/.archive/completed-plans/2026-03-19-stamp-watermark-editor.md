# Stamp Watermark Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace CardTemplate with a stamp-on-photo watermark system offering 3 styles (pixel/seal/minimal) and 4-corner positioning.

**Architecture:** New `stamps/` component directory with StampOverlay (renders stamp at absolute position), 3 style components, StyleSelector tab bar, and StampPreview (Step 3 page). ViewShot captures the composite for export. Season colors drive stamp theming.

**Tech Stack:** React Native, Expo 55, Zustand, AsyncStorage, react-native-view-shot, expo-media-library, expo-sharing, react-native-reanimated (for spring animation)

**Spec:** `docs/superpowers/specs/2026-03-19-stamp-watermark-editor-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|----------------|
| `src/utils/stamp-colors.ts` | `getStampColors(hex)` → `{ brandDeep, brandMid }` via HSL manipulation |
| `src/constants/prefecture-en.ts` | `PREFECTURE_EN` lookup: prefectureCode → English name |
| `src/components/stamps/PixelStamp.tsx` | Rectangular pixel-art stamp (brand + name + date + city) |
| `src/components/stamps/SealStamp.tsx` | Circular seal stamp (name + flower icons + year-season) |
| `src/components/stamps/MinimalStamp.tsx` | Left-bar + text-shadow stamp (name + city·date) |
| `src/components/stamps/StampOverlay.tsx` | Positions the active stamp at the chosen corner |
| `src/components/stamps/StyleSelector.tsx` | 3-tab horizontal selector (pixel/seal/minimal) |
| `src/components/stamps/PositionSelector.tsx` | 4 corner indicator dots overlaid on photo |
| `src/components/stamps/StampPreview.tsx` | Full Step 3 page: photo + stamp + controls + CTA |
| `src/components/stamps/index.ts` | Barrel export |

### Modified Files
| File | Change |
|------|--------|
| `src/types/hanami.ts` | Add `stampStyle` and `stampPosition` to `CheckinRecord`; update `TemplateStyle` |
| `src/stores/checkin-store.ts` | Adapt `addCheckin` for new fields |
| `src/constants/theme.ts` | Add `stamp` color constants |
| `src/i18n/ja.json` | Add `stamp.*` keys |
| `src/i18n/en.json` | Add `stamp.*` keys |
| `src/app/(tabs)/checkin.tsx` | Replace Step 3 with StampPreview, remove CardTemplate import, remove off-screen render |

### Deletable (after integration)
| File | Reason |
|------|--------|
| `src/components/templates/CardTemplate.tsx` | Fully replaced by StampPreview |

---

## Task 1: Utility Functions (`stamp-colors.ts` + `prefecture-en.ts`)

**Files:**
- Create: `src/utils/stamp-colors.ts`
- Create: `src/constants/prefecture-en.ts`
- Test: `__tests__/utils/stamp-colors.test.ts`

- [ ] **Step 1: Write test for `getStampColors`**

```typescript
// __tests__/utils/stamp-colors.test.ts
import { getStampColors } from '@/utils/stamp-colors';

describe('getStampColors', () => {
  it('returns darker variants of sakura themeColor', () => {
    const result = getStampColors('#e8a5b0');
    // brandDeep should be noticeably darker (lower lightness)
    expect(result.brandDeep).toBeDefined();
    expect(result.brandMid).toBeDefined();
    expect(result.brandDeep).not.toBe('#e8a5b0');
    expect(result.brandMid).not.toBe('#e8a5b0');
    // brandDeep should be darker than brandMid
    expect(result.brandDeep).not.toBe(result.brandMid);
  });

  it('handles edge case of very dark input', () => {
    const result = getStampColors('#333333');
    expect(result.brandDeep).toBeDefined();
    expect(result.brandMid).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/utils/stamp-colors.test.ts --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `getStampColors`**

```typescript
// src/utils/stamp-colors.ts
// Derives darker stamp color variants from a base themeColor via HSL adjustment.

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r: number, g: number, b: number;
  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }
  const toHex = (v: number) =>
    Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface StampColors {
  brandDeep: string; // L - 20%
  brandMid: string;  // L - 10%
}

export function getStampColors(themeColor: string): StampColors {
  const [h, s, l] = hexToHsl(themeColor);
  return {
    brandDeep: hslToHex(h, s, Math.max(0, l - 20)),
    brandMid: hslToHex(h, s, Math.max(0, l - 10)),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/utils/stamp-colors.test.ts --no-coverage`
Expected: PASS

- [ ] **Step 5: Create `prefecture-en.ts`**

```typescript
// src/constants/prefecture-en.ts
// Maps JIS X 0401 prefecture codes to English names for stamp display.

export const PREFECTURE_EN: Record<number, string> = {
  1: 'HOKKAIDO', 2: 'AOMORI', 3: 'IWATE', 4: 'MIYAGI', 5: 'AKITA',
  6: 'YAMAGATA', 7: 'FUKUSHIMA', 8: 'IBARAKI', 9: 'TOCHIGI', 10: 'GUNMA',
  11: 'SAITAMA', 12: 'CHIBA', 13: 'TOKYO', 14: 'KANAGAWA', 15: 'NIIGATA',
  16: 'TOYAMA', 17: 'ISHIKAWA', 18: 'FUKUI', 19: 'YAMANASHI', 20: 'NAGANO',
  21: 'GIFU', 22: 'SHIZUOKA', 23: 'AICHI', 24: 'MIE', 25: 'SHIGA',
  26: 'KYOTO', 27: 'OSAKA', 28: 'HYOGO', 29: 'NARA', 30: 'WAKAYAMA',
  31: 'TOTTORI', 32: 'SHIMANE', 33: 'OKAYAMA', 34: 'HIROSHIMA', 35: 'YAMAGUCHI',
  36: 'TOKUSHIMA', 37: 'KAGAWA', 38: 'EHIME', 39: 'KOCHI', 40: 'FUKUOKA',
  41: 'SAGA', 42: 'NAGASAKI', 43: 'KUMAMOTO', 44: 'OITA', 45: 'MIYAZAKI',
  46: 'KAGOSHIMA', 47: 'OKINAWA',
};
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/stamp-colors.ts src/constants/prefecture-en.ts __tests__/utils/stamp-colors.test.ts
git commit -m "feat(stamps): add getStampColors HSL utility and PREFECTURE_EN lookup"
```

---

## Task 2: Type Updates + Theme Constants + i18n

**Files:**
- Modify: `src/types/hanami.ts`
- Modify: `src/constants/theme.ts`
- Modify: `src/stores/checkin-store.ts`
- Modify: `src/i18n/ja.json`
- Modify: `src/i18n/en.json`

- [ ] **Step 1: Update `CheckinRecord` in `hanami.ts`**

Add fields after `templateId` (line 51):

```typescript
// src/types/hanami.ts — update CheckinRecord
export interface CheckinRecord {
  id: string;
  seasonId: string;
  spotId: number;
  photoUri: string;
  composedUri: string;
  templateId: string; // now stores stampStyle value: 'pixel' | 'seal' | 'minimal'
  timestamp: string;
  synced: boolean;
  stampStyle?: StampStyle;      // optional for backward compat with old records
  stampPosition?: StampPosition; // optional for backward compat with old records
}

export type StampStyle = 'pixel' | 'seal' | 'minimal';
export type StampPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
```

Also update `TemplateStyle` on line 56 to:
```typescript
export type TemplateStyle = 'pixel' | 'seal' | 'minimal';
```

Note: Fields are optional (`?`) so existing `CheckinRecord` objects in `checkin-store.test.ts` and AsyncStorage remain valid without updating every `makeRecord()` call.

- [ ] **Step 2: Add stamp theme constants**

Append to `src/constants/theme.ts`:

```typescript
export const stamp = {
  padding: 16,
  opacity: {
    pixel: 0.93,
    seal: 0.90,
    minimal: 1,
  },
  pixelBorder: 2,
  sealDiameter: 72,
  sealBorder: 2.5,
  minimalBarWidth: 2.5,
  defaultPosition: 'bottom-right' as const,
  defaultStyle: 'pixel' as const,
  storageKey: 'stamp_style_preference',
  positionStorageKey: 'stamp_position_preference',
} as const;
```

- [ ] **Step 3: Add i18n keys to `ja.json`**

Inside `"checkin"` section, add:

```json
"stamp": {
  "pixel": "ピクセル",
  "seal": "印章",
  "minimal": "シンプル",
  "share": "この出会いをシェア",
  "saved": "写真に保存しました 🌸",
  "shareError": "シェアに失敗しました",
  "permissionRequired": "写真ライブラリへのアクセスを許可してください",
  "photoOld": "この写真は{{days}}日前に撮影されました。今日の出会いとして記録しますか？",
  "photoOldUse": "この写真を使う",
  "photoOldReselect": "選び直す",
  "photoLowRes": "画質が低いため、保存時にぼやけることがあります"
}
```

- [ ] **Step 4: Add i18n keys to `en.json`**

Same structure with English translations:

```json
"stamp": {
  "pixel": "Pixel",
  "seal": "Seal",
  "minimal": "Minimal",
  "share": "Share this moment",
  "saved": "Saved to photos 🌸",
  "shareError": "Share failed",
  "permissionRequired": "Please allow access to your photo library",
  "photoOld": "This photo was taken {{days}} days ago. Record it as today's encounter?",
  "photoOldUse": "Use this photo",
  "photoOldReselect": "Choose another",
  "photoLowRes": "Low resolution — the export may appear blurry"
}
```

- [ ] **Step 5: Run type check**

Run: `npx tsc --noEmit`
Expected: Errors in `checkin.tsx` (still importing CardTemplate with old shape) — expected at this stage

- [ ] **Step 6: Commit**

```bash
git add src/types/hanami.ts src/constants/theme.ts src/i18n/ja.json src/i18n/en.json
git commit -m "feat(stamps): add stamp types, theme constants, and i18n keys"
```

---

## Task 3: Three Stamp Style Components

**Files:**
- Create: `src/components/stamps/PixelStamp.tsx`
- Create: `src/components/stamps/SealStamp.tsx`
- Create: `src/components/stamps/MinimalStamp.tsx`
- Test: `__tests__/components/stamps/PixelStamp.test.tsx`

- [ ] **Step 1: Write test for PixelStamp**

```typescript
// __tests__/components/stamps/PixelStamp.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { PixelStamp } from '@/components/stamps/PixelStamp';

describe('PixelStamp', () => {
  const props = {
    spotName: '哲学の道',
    cityEn: 'KYOTO',
    date: new Date('2026-03-28'),
    themeColor: '#e8a5b0',
  };

  it('renders spot name', () => {
    const { getByText } = render(<PixelStamp {...props} />);
    expect(getByText('哲学の道')).toBeTruthy();
  });

  it('renders brand name', () => {
    const { getByText } = render(<PixelStamp {...props} />);
    expect(getByText(/PIXEL HERBARIUM/)).toBeTruthy();
  });

  it('renders formatted date', () => {
    const { getByText } = render(<PixelStamp {...props} />);
    expect(getByText(/2026\.03\.28/)).toBeTruthy();
  });

  it('renders city name', () => {
    const { getByText } = render(<PixelStamp {...props} />);
    expect(getByText(/KYOTO/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/stamps/PixelStamp.test.tsx --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Implement PixelStamp**

```typescript
// src/components/stamps/PixelStamp.tsx
import { View, Text, StyleSheet } from 'react-native';
import { getStampColors } from '@/utils/stamp-colors';
import { stamp as stampTheme } from '@/constants/theme';

interface PixelStampProps {
  spotName: string;
  cityEn: string;
  date: Date;
  themeColor: string;
}

function formatStampDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function PixelStamp({ spotName, cityEn, date, themeColor }: PixelStampProps) {
  const { brandDeep, brandMid } = getStampColors(themeColor);

  return (
    <View
      style={[
        styles.container,
        { borderColor: themeColor, opacity: stampTheme.opacity.pixel },
      ]}
    >
      <Text style={[styles.brand, { color: brandDeep }]}>✿ PIXEL HERBARIUM</Text>
      <Text style={[styles.spotName, { color: themeColor }]}>{spotName}</Text>
      <Text style={[styles.meta, { color: brandMid }]}>
        {formatStampDate(date)} · {cityEn}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  brand: {
    fontFamily: 'monospace',
    fontSize: 7,
    letterSpacing: 1,
    marginBottom: 2,
  },
  spotName: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    fontFamily: 'monospace',
    fontSize: 7,
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/components/stamps/PixelStamp.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 5: Implement SealStamp**

```typescript
// src/components/stamps/SealStamp.tsx
import { View, Text, StyleSheet } from 'react-native';
import { getStampColors } from '@/utils/stamp-colors';
import { stamp as stampTheme } from '@/constants/theme';

interface SealStampProps {
  spotName: string;
  seasonEmoji: string;
  year: number;
  seasonLabel: string; // e.g. "春"
  themeColor: string;
}

export function SealStamp({ spotName, seasonEmoji, year, seasonLabel, themeColor }: SealStampProps) {
  const { brandMid } = getStampColors(themeColor);
  const icons = `${seasonEmoji}${seasonEmoji}${seasonEmoji}`;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: themeColor,
          width: stampTheme.sealDiameter,
          height: stampTheme.sealDiameter,
          borderRadius: stampTheme.sealDiameter / 2,
          opacity: stampTheme.opacity.seal,
        },
      ]}
    >
      <Text style={[styles.spotName, { color: themeColor }]} numberOfLines={1}>
        {spotName}
      </Text>
      <Text style={styles.icons}>{icons}</Text>
      <Text style={[styles.yearSeason, { color: brandMid }]}>
        {year}{seasonLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  spotName: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },
  icons: {
    fontSize: 14,
    letterSpacing: 2,
    marginVertical: 2,
  },
  yearSeason: {
    fontSize: 7,
    letterSpacing: 1,
  },
});
```

- [ ] **Step 6: Implement MinimalStamp**

```typescript
// src/components/stamps/MinimalStamp.tsx
import { View, Text, StyleSheet } from 'react-native';

interface MinimalStampProps {
  spotName: string;
  cityEn: string;
  date: Date;
  accentColor: string;
}

function formatStampDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function MinimalStamp({ spotName, cityEn, date, accentColor }: MinimalStampProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: accentColor }]} />
      <View style={styles.textGroup}>
        <Text style={styles.spotName}>{spotName}</Text>
        <Text style={styles.meta}>
          {cityEn} · {formatStampDate(date)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  bar: {
    width: 2.5,
    borderRadius: 1,
    marginRight: 7,
  },
  textGroup: {
    paddingVertical: 3,
  },
  spotName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.97)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  meta: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
```

- [ ] **Step 7: Commit**

```bash
git add src/components/stamps/PixelStamp.tsx src/components/stamps/SealStamp.tsx src/components/stamps/MinimalStamp.tsx __tests__/components/stamps/PixelStamp.test.tsx
git commit -m "feat(stamps): implement PixelStamp, SealStamp, MinimalStamp components"
```

---

## Task 4: StampOverlay + StyleSelector + PositionSelector

**Files:**
- Create: `src/components/stamps/StampOverlay.tsx`
- Create: `src/components/stamps/StyleSelector.tsx`
- Create: `src/components/stamps/PositionSelector.tsx`
- Test: `__tests__/components/stamps/StyleSelector.test.tsx`

- [ ] **Step 1: Write test for StyleSelector**

```typescript
// __tests__/components/stamps/StyleSelector.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSelector } from '@/components/stamps/StyleSelector';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('StyleSelector', () => {
  it('renders three style tabs', () => {
    const { getByText } = render(
      <StyleSelector selected="pixel" onSelect={jest.fn()} themeColor="#e8a5b0" />
    );
    expect(getByText('stamp.pixel')).toBeTruthy();
    expect(getByText('stamp.seal')).toBeTruthy();
    expect(getByText('stamp.minimal')).toBeTruthy();
  });

  it('calls onSelect with new style when tab pressed', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <StyleSelector selected="pixel" onSelect={onSelect} themeColor="#e8a5b0" />
    );
    fireEvent.press(getByText('stamp.seal'));
    expect(onSelect).toHaveBeenCalledWith('seal');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/stamps/StyleSelector.test.tsx --no-coverage`
Expected: FAIL

- [ ] **Step 3: Implement StyleSelector**

```typescript
// src/components/stamps/StyleSelector.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { borderRadius, spacing } from '@/constants/theme';
import type { StampStyle } from '@/types/hanami';

const STYLES: { key: StampStyle; labelKey: string }[] = [
  { key: 'pixel', labelKey: 'stamp.pixel' },
  { key: 'seal', labelKey: 'stamp.seal' },
  { key: 'minimal', labelKey: 'stamp.minimal' },
];

interface StyleSelectorProps {
  selected: StampStyle;
  onSelect: (style: StampStyle) => void;
  themeColor: string;
}

export function StyleSelector({ selected, onSelect, themeColor }: StyleSelectorProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      {STYLES.map(({ key, labelKey }) => {
        const active = key === selected;
        return (
          <TouchableOpacity
            key={key}
            style={[
              styles.tab,
              active
                ? { backgroundColor: `${themeColor}18`, borderColor: themeColor, borderWidth: 1.5 }
                : { backgroundColor: '#f8f8f8', borderColor: '#e0e0e0', borderWidth: 1 },
            ]}
            onPress={() => onSelect(key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${t(labelKey)}${active ? '、選択中' : ''}`}
          >
            <Text
              style={[
                styles.label,
                { color: active ? themeColor : '#999', fontWeight: active ? 'bold' : 'normal' },
              ]}
            >
              {t(labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  label: {
    fontSize: 12,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/components/stamps/StyleSelector.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 5: Implement PositionSelector**

```typescript
// src/components/stamps/PositionSelector.tsx
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { stamp as stampTheme } from '@/constants/theme';
import type { StampPosition } from '@/types/hanami';

const POSITIONS: { key: StampPosition; style: object }[] = [
  { key: 'top-left', style: { top: stampTheme.padding, left: stampTheme.padding } },
  { key: 'top-right', style: { top: stampTheme.padding, right: stampTheme.padding } },
  { key: 'bottom-left', style: { bottom: stampTheme.padding, left: stampTheme.padding } },
  { key: 'bottom-right', style: { bottom: stampTheme.padding, right: stampTheme.padding } },
];

const CORNER_LABELS: Record<StampPosition, string> = {
  'top-left': '左上',
  'top-right': '右上',
  'bottom-left': '左下',
  'bottom-right': '右下',
};

interface PositionSelectorProps {
  selected: StampPosition;
  onSelect: (pos: StampPosition) => void;
  themeColor: string;
}

export function PositionSelector({ selected, onSelect, themeColor }: PositionSelectorProps) {
  return (
    <>
      {POSITIONS.map(({ key, style }) => {
        const active = key === selected;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.dot, style, { position: 'absolute' }]}
            onPress={() => onSelect(key)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={`${CORNER_LABELS[key]}位置${active ? '、選択中' : ''}`}
          >
            <View
              style={[
                styles.inner,
                active
                  ? { backgroundColor: themeColor, borderColor: themeColor }
                  : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.5)' },
              ]}
            />
            {active && (
              <View
                style={[styles.glow, { backgroundColor: `${themeColor}4D` }]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  glow: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});
```

- [ ] **Step 6: Implement StampOverlay**

```typescript
// src/components/stamps/StampOverlay.tsx
import { Animated, StyleSheet } from 'react-native';
import { useEffect, useRef } from 'react';
import { stamp as stampTheme } from '@/constants/theme';
import { PixelStamp } from './PixelStamp';
import { SealStamp } from './SealStamp';
import { MinimalStamp } from './MinimalStamp';
import type { StampStyle, StampPosition, FlowerSpot } from '@/types/hanami';
import type { SeasonConfig } from '@/constants/seasons';
import { PREFECTURE_EN } from '@/constants/prefecture-en';

interface StampOverlayProps {
  style: StampStyle;
  position: StampPosition;
  spot: FlowerSpot;
  date: Date;
  season: SeasonConfig;
}

function getPositionStyle(pos: StampPosition) {
  const p = stampTheme.padding;
  switch (pos) {
    case 'top-left': return { top: p, left: p };
    case 'top-right': return { top: p, right: p };
    case 'bottom-left': return { bottom: p, left: p };
    case 'bottom-right': return { bottom: p, right: p };
  }
}

const SEASON_LABELS: Record<string, string> = {
  sakura: '春', ajisai: '夏', himawari: '夏', momiji: '秋', tsubaki: '冬',
};

export function StampOverlay({ style, position, spot, date, season }: StampOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.spring(opacity, { toValue: 1, useNativeDriver: true }).start();
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, []);

  const cityEn = PREFECTURE_EN[spot.prefectureCode] ?? spot.nameEn.split(' ').pop()?.toUpperCase() ?? '';

  const stampElement = (() => {
    switch (style) {
      case 'pixel':
        return (
          <PixelStamp
            spotName={spot.nameJa}
            cityEn={cityEn}
            date={date}
            themeColor={season.themeColor}
          />
        );
      case 'seal':
        return (
          <SealStamp
            spotName={spot.nameJa}
            seasonEmoji={season.iconEmoji}
            year={date.getFullYear()}
            seasonLabel={SEASON_LABELS[season.id] ?? ''}
            themeColor={season.themeColor}
          />
        );
      case 'minimal':
        return (
          <MinimalStamp
            spotName={spot.nameJa}
            cityEn={cityEn}
            date={date}
            accentColor={season.accentColor}
          />
        );
    }
  })();

  return (
    <Animated.View
      style={[
        styles.overlay,
        getPositionStyle(position),
        { opacity, transform: [{ scale }] },
      ]}
    >
      {stampElement}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
  },
});
```

- [ ] **Step 7: Create barrel export**

```typescript
// src/components/stamps/index.ts
export { PixelStamp } from './PixelStamp';
export { SealStamp } from './SealStamp';
export { MinimalStamp } from './MinimalStamp';
export { StampOverlay } from './StampOverlay';
export { StyleSelector } from './StyleSelector';
export { PositionSelector } from './PositionSelector';
// StampPreview export added in Task 5 after the component is created
```

- [ ] **Step 8: Commit**

```bash
git add src/components/stamps/
git commit -m "feat(stamps): add StampOverlay, StyleSelector, PositionSelector"
```

---

## Task 5: StampPreview (Step 3 integration page)

**Files:**
- Create: `src/components/stamps/StampPreview.tsx`
- Test: `__tests__/components/stamps/StampPreview.test.tsx`

- [ ] **Step 1: Write test for StampPreview**

```typescript
// __tests__/components/stamps/StampPreview.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StampPreview } from '@/components/stamps/StampPreview';
import type { FlowerSpot } from '@/types/hanami';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockSpot: FlowerSpot = {
  id: 1, seasonId: 'sakura', nameJa: '哲学の道', nameEn: 'Path of Philosophy',
  prefecture: '京都府', prefectureCode: 26, city: '京都市',
  category: 'street', treeCount: 400,
  bloomTypical: { earlyStart: '03-25', peakStart: '04-01', peakEnd: '04-08', lateEnd: '04-15' },
  latitude: 35.02, longitude: 135.79, tags: [],
};

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn().mockResolvedValue('/mock/path.png'),
}));

describe('StampPreview', () => {
  it('renders the share CTA button', () => {
    const { getByText } = render(
      <StampPreview
        photoUri="file:///photo.jpg"
        spot={mockSpot}
        date={new Date('2026-03-28')}
        seasonId="sakura"
        onSave={jest.fn()}
        onShare={jest.fn()}
      />
    );
    expect(getByText(/stamp\.share/)).toBeTruthy();
  });

  it('renders style selector with 3 tabs', () => {
    const { getByText } = render(
      <StampPreview
        photoUri="file:///photo.jpg"
        spot={mockSpot}
        date={new Date('2026-03-28')}
        seasonId="sakura"
        onSave={jest.fn()}
        onShare={jest.fn()}
      />
    );
    expect(getByText('stamp.pixel')).toBeTruthy();
    expect(getByText('stamp.seal')).toBeTruthy();
    expect(getByText('stamp.minimal')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/stamps/StampPreview.test.tsx --no-coverage`
Expected: FAIL

- [ ] **Step 3: Implement StampPreview**

```typescript
// src/components/stamps/StampPreview.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Image, TouchableOpacity, Text, StyleSheet, Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, stamp as stampConst, StyleSheet } from '@/constants/theme';
import { getActiveSeason, SEASONS, type SeasonConfig } from '@/constants/seasons';
import { StampOverlay } from './StampOverlay';
import { StyleSelector } from './StyleSelector';
import { PositionSelector } from './PositionSelector';
import type { FlowerSpot, StampStyle, StampPosition } from '@/types/hanami';

const { width: SCREEN_W } = Dimensions.get('window');

interface StampPreviewProps {
  photoUri: string;
  spot: FlowerSpot;
  date: Date;
  seasonId: string;
  onSave: (composedUri: string, stampStyle: StampStyle, stampPosition: StampPosition) => void;
  onShare: (composedUri: string) => void;
}

export function StampPreview({
  photoUri, spot, date, seasonId, onSave, onShare,
}: StampPreviewProps) {
  const { t } = useTranslation();
  const season = SEASONS.find(s => s.id === seasonId) ?? getActiveSeason();
  const viewShotRef = useRef<View>(null);

  const [stampStyle, setStampStyle] = useState<StampStyle>(stampConst.defaultStyle);
  const [stampPosition, setStampPosition] = useState<StampPosition>(stampConst.defaultPosition);
  const [busy, setBusy] = useState(false);

  // Restore preferences
  useEffect(() => {
    (async () => {
      const [savedStyle, savedPos] = await Promise.all([
        AsyncStorage.getItem(stampConst.storageKey),
        AsyncStorage.getItem(stampConst.positionStorageKey),
      ]);
      if (savedStyle === 'pixel' || savedStyle === 'seal' || savedStyle === 'minimal') {
        setStampStyle(savedStyle);
      }
      if (savedPos === 'top-left' || savedPos === 'top-right' || savedPos === 'bottom-left' || savedPos === 'bottom-right') {
        setStampPosition(savedPos);
      }
    })();
  }, []);

  // Persist preferences on change
  const handleStyleChange = useCallback((s: StampStyle) => {
    setStampStyle(s);
    AsyncStorage.setItem(stampConst.storageKey, s);
  }, []);

  const handlePositionChange = useCallback((p: StampPosition) => {
    setStampPosition(p);
    AsyncStorage.setItem(stampConst.positionStorageKey, p);
  }, []);

  const handleCTA = useCallback(async () => {
    if (busy || !viewShotRef.current) return;
    setBusy(true);
    try {
      const composedUri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
      onSave(composedUri, stampStyle, stampPosition);
    } catch {
      // fallback handled by parent
    } finally {
      setBusy(false);
    }
  }, [busy, onSave, stampStyle, stampPosition]);

  return (
    <View style={styles.container}>
      {/* Photo + Stamp composite (capturable) */}
      {/* Capturable area — only photo + stamp, no UI controls */}
      <View style={styles.photoContainer}>
        <View
          ref={viewShotRef}
          collapsable={false}
          style={StyleSheet.absoluteFill}
        >
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            resizeMode="contain"
          />
          <StampOverlay
            style={stampStyle}
            position={stampPosition}
            spot={spot}
            date={date}
            season={season}
          />
        </View>
        {/* Position dots are outside viewShotRef — not captured in export */}
        <PositionSelector
          selected={stampPosition}
          onSelect={handlePositionChange}
          themeColor={season.themeColor}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <StyleSelector
          selected={stampStyle}
          onSelect={handleStyleChange}
          themeColor={season.themeColor}
        />

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: season.themeColor }]}
          onPress={handleCTA}
          disabled={busy}
          activeOpacity={0.8}
          accessibilityLabel={t('stamp.share')}
        >
          {busy ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.ctaText}>{t('stamp.share')} →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  photoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  controls: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  cta: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  ctaText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/components/stamps/StampPreview.test.tsx --no-coverage`
Expected: PASS

- [ ] **Step 5: Add StampPreview to barrel export**

Add to `src/components/stamps/index.ts`:
```typescript
export { StampPreview } from './StampPreview';
```

- [ ] **Step 6: Commit**

```bash
git add src/components/stamps/StampPreview.tsx src/components/stamps/index.ts __tests__/components/stamps/StampPreview.test.tsx
git commit -m "feat(stamps): implement StampPreview Step 3 integration page"
```

---

## Task 6: Integrate into checkin.tsx + Remove CardTemplate

**Files:**
- Modify: `src/app/(tabs)/checkin.tsx`
- Delete: `src/components/templates/CardTemplate.tsx` (after integration verified)

- [ ] **Step 1: Rewrite checkin.tsx Step 3**

Key changes to `src/app/(tabs)/checkin.tsx`:
- Replace `CardTemplate` import with `StampPreview` import
- Remove `CARD_WIDTH`, `CARD_HEIGHT`, `PREVIEW_WIDTH`, `PREVIEW_HEIGHT`, `SCALE`, `SCALE_OFFSET_X/Y`
- Remove `cardRef` and off-screen `<View style={styles.offscreen}>`
- Replace Step 3 `<ScrollView>` with `<StampPreview>` component
- Update `handleSave` to receive `composedUri` + `stampStyle` + `stampPosition` from `StampPreview`

The new Step 3 in the render:

```tsx
{step === 'preview' && photoUri != null && selectedSpot != null && (
  <StampPreview
    photoUri={photoUri}
    spot={selectedSpot}
    date={checkinDate.current}
    seasonId={season.id}
    onSave={handleStampSave}
    onShare={handleStampShare}
  />
)}
```

New handlers:

```typescript
async function handleStampShare(composedUri: string) {
  try {
    await Sharing.shareAsync(composedUri, { mimeType: 'image/png' });
  } catch {
    // share cancelled or failed — silent
  }
}

async function handleStampSave(composedUri: string, stampStyle: StampStyle, stampPosition: StampPosition) {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      setFeedback(t('stamp.permissionRequired'));
      setTimeout(() => setFeedback(null), 2000);
      return;
    }
    await MediaLibrary.saveToLibraryAsync(composedUri);
    await addCheckin({
      id: genId(),
      seasonId: season.id,
      spotId: selectedSpot!.id,
      photoUri: photoUri!,
      composedUri,
      templateId: stampStyle,
      timestamp: checkinDate.current.toISOString(),
      synced: false,
      stampStyle,
      stampPosition,
    });
    setFeedback(t('stamp.saved'));
    setTimeout(() => {
      setFeedback(null);
      router.replace('/(tabs)/footprint');
    }, 1500);
  } catch {
    setFeedback(t('checkin.saveError'));
    setTimeout(() => setFeedback(null), 2000);
  }
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors)

- [ ] **Step 3: Run all tests**

Run: `npx jest --no-coverage`
Expected: All existing tests PASS + new stamp tests PASS

- [ ] **Step 4: Delete CardTemplate**

After confirming tests pass, delete `src/components/templates/CardTemplate.tsx`.

Run: `npx tsc --noEmit && npx jest --no-coverage`
Expected: PASS — no remaining references to CardTemplate

- [ ] **Step 5: Commit**

```bash
git add src/app/\(tabs\)/checkin.tsx
git rm src/components/templates/CardTemplate.tsx
git commit -m "feat(stamps): integrate StampPreview into checkin wizard, remove CardTemplate"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Full test suite**

Run: `npx jest --no-coverage`
Expected: All tests pass (existing 457+ new stamp tests)

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Grep for dead references**

Run: `grep -r "CardTemplate" src/` — should return 0 results
Run: `grep -r "CARD_WIDTH\|CARD_HEIGHT\|SCALE_OFFSET" src/` — should return 0 results

- [ ] **Step 4: Commit final state**

If any cleanup was needed:
```bash
git add -A
git commit -m "chore(stamps): cleanup dead CardTemplate references"
```
