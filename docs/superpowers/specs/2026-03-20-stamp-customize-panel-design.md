# Spec: PH Stamp Customization Panel (Phase B1)

**Date**: 2026-03-20
**Status**: Approved
**Scope**: User-controllable color / effect / text / decoration layer for all 6 stamp styles
**Prerequisite**: Phase A (stamp style library) must be merged to master

---

## Problem

Phase A delivered 6 stamp style presets (Classic/Relief/Postcard/Medallion/Window/Minimal). Users have no way to personalize stamps beyond style selection. A customization layer lets users express individuality within PH's gentle, poetic aesthetic.

---

## Design Decisions

### Entry Pattern: Collapsible Inline Accordion

A dashed-border row labeled "✎ カスタマイズ" sits between the existing style/position controls and the save button. Tapping expands it in-place; save button shifts down. Collapsed state is visually minimal (≤36px row).

Rejected alternatives:
- **Bottom sheet**: disrupts main flow, harder to preview changes live
- **Always-expanded tabs**: takes permanent vertical space, PH aesthetic prefers non-intrusive

### Panel Content: Vertical 4 Rows

Expanded panel renders 4 labeled rows in order:
1. **線の色** — horizontal row of 8 color circles + season default indicator
2. **効果** — 3 chip pills: `なし` / `淡い影` / `柔光`
3. **添え文字** — 3 chip pills: `なし` / `花言葉` / `自由入力` (selecting 自由入力 reveals inline TextInput)
4. **装飾** — 4 chip pills: `なし` / `花びら` / `枝` / `星`

Rejected alternative:
- **2×2 grid cells**: color swatches become cramped, labels less clear

### Decoration: Static SVG Overlays

SVG elements rendered on top of the stamp with absolute positioning. No animation. Three defined patterns:
- `petals` — 3 petal ellipses at top-left and bottom-right stamp corners
- `branch` — thin arc + 2 tiny flowers along top edge
- `stars` — 4 small star points at 4 corners
- `none` — renders nothing

Static chosen over animated: `react-native-view-shot` captures static content cleanly; animated frames require manual freeze logic with high risk of inconsistent save output.

---

## Data Model

### CustomOptions Interface

```typescript
interface CustomOptions {
  customColor?: string;           // undefined = 季節テーマ色
  effectType: 'none' | 'shadow' | 'glow';
  textMode: 'none' | 'hanakotoba' | 'custom';
  customTextValue: string;        // ≤12 chars, used when textMode='custom'
  decorationKey: 'none' | 'petals' | 'branch' | 'stars';
}

const DEFAULT_CUSTOM_OPTIONS: CustomOptions = {
  customColor: undefined,
  effectType: 'none',
  textMode: 'none',
  customTextValue: '',
  decorationKey: 'none',
};
```

### AsyncStorage Keys

Follows existing convention (`_preference` suffix matches `stamp_opacity_preference`, `stamp_size_preference`):

| Key | Type | Default |
|-----|------|---------|
| `stamp_custom_color_preference` | `string \| 'undefined'` | `'undefined'` |
| `stamp_effect_type_preference` | `'none' \| 'shadow' \| 'glow'` | `'none'` |
| `stamp_text_mode_preference` | `'none' \| 'hanakotoba' \| 'custom'` | `'none'` |
| `stamp_decoration_key_preference` | `'none' \| 'petals' \| 'branch' \| 'stars'` | `'none'` |

Note: `customTextValue` is NOT persisted (transient per session, TextInput manages it).

### Color Palette

8 fixed colors added to `src/constants/theme.ts`:

```typescript
export const STAMP_COLOR_PALETTE = [
  '#e8a5b0', // 桜色 (season default for sakura)
  '#7B9FCC', // 空色
  '#d4a645', // 山吹色
  '#b07090', // 藤色
  '#6b8f5e', // 萌葱色
  '#8899aa', // 青鼠色
  '#c8a060', // 砂色
  '#aaaaaa', // 薄墨色
];
```

The first color in the palette that matches the current season's primary color should show a "季節" label (or be visually distinguished with a leaf badge). When `customColor = undefined`, season theme color is used automatically.

---

## Component Architecture

### New Component: `CustomizationPanel.tsx`

**Location**: `src/components/stamps/CustomizationPanel.tsx`

**Props**:
```typescript
interface CustomizationPanelProps {
  options: CustomOptions;
  onChange: (patch: Partial<CustomOptions>) => void;
  seasonColor: string;   // current season primary for default badge
}
```

**Behavior**:
- Manages expand/collapse with internal `useState(false)` — OTA safe (no new hooks in parent)
- Collapsed: dashed border row "✎ カスタマイズ ▾"
- Expanded: 4-row vertical layout + "▴" chevron
- Color row: 8 circles, selected has 2px border ring matching theme.primary; season default has tiny 🌸 leaf badge
- Chip pills: selected has `backgroundColor: theme.bgAccent`, `borderColor: theme.primary`; unselected is neutral
- TextInput for custom text: appears inline only when `textMode='custom'`, `maxLength={12}`, persisted on `onBlur`

### Modified Components

**`StampPreview.tsx`**:
- Add `customOptions` state initialized from `DEFAULT_CUSTOM_OPTIONS`
- Load from AsyncStorage on mount (4 keys)
- Save to AsyncStorage on each `onChange` call
- Render `<CustomizationPanel>` between position/opacity controls and save button
- Pass `customOptions` to `StampOverlay`

**`StampOverlay.tsx`** (if exists) or **`StampRenderer.tsx`**:
- Accept `customOptions?: CustomOptions`
- Forward to individual stamp components

**Individual stamp components** (ClassicStamp, ReliefStamp, PostcardStamp, MedallionStamp, WindowStamp, MinimalStamp):
- New optional props:
  ```typescript
  customColor?: string;
  effectType?: 'none' | 'shadow' | 'glow';
  customText?: string;       // derived: textMode='custom' → customTextValue, textMode='hanakotoba' → spot.hanakotoba?.slice(0,12)
  decorationKey?: 'none' | 'petals' | 'branch' | 'stars';
  ```
- `customColor` overrides `themeColor` when defined
- `customText` renders as extra subtitle line at stamp bottom (font-size: small, muted color)
- `effectType` applies via `style` prop: `shadow` = drop shadow, `glow` = outer glow
- `decorationKey` renders `<StampDecoration>` overlay around stamp

### New Sub-component: `StampDecoration.tsx`

**Location**: `src/components/stamps/StampDecoration.tsx`

Renders static SVG decoration based on `decorationKey`:
```typescript
interface StampDecorationProps {
  decorationKey: 'none' | 'petals' | 'branch' | 'stars';
  color: string;       // uses resolved stamp color (custom or season)
  stampSize: { width: number; height: number };
}
```

Uses react-native-svg. All elements positioned absolutely relative to stamp container. Opacity 0.3–0.5 to remain non-intrusive.

---

## 添え文字 Logic

```
textMode = 'none'        → no extra text rendered
textMode = 'hanakotoba'  → spot.hanakotoba?.slice(0, 12) ?? ''
                           (if spot has no hanakotoba: shows nothing, does not error)
textMode = 'custom'      → customTextValue (max 12 chars, set via TextInput)
```

Derived `customText` string is computed in `StampPreview` and passed as a prop. Stamp components receive final string only, no mode logic.

---

## Effect Rendering

```
effectType = 'none'    → no additional style
effectType = 'shadow'  → { shadowColor: '#00000022', shadowOffset: {x:2,y:2}, shadowRadius: 4 }
effectType = 'glow'    → { shadowColor: resolvedColor + '66', shadowOffset: {x:0,y:0}, shadowRadius: 8 }
```

Applied to the stamp's outermost wrapper `<View>` via the `style` prop. Compatible with `react-native-view-shot` (shadow is captured in PNG).

---

## i18n Keys

```json
// ja.json additions
"customize": {
  "title": "カスタマイズ",
  "lineColor": "線の色",
  "seasonDefault": "季節色",
  "effect": "効果",
  "effectNone": "なし",
  "effectShadow": "淡い影",
  "effectGlow": "柔光",
  "addText": "添え文字",
  "textNone": "なし",
  "textHanakotoba": "花言葉",
  "textCustom": "自由入力",
  "textPlaceholder": "12文字以内",
  "decoration": "装飾",
  "decorNone": "なし",
  "decorPetals": "花びら",
  "decorBranch": "枝",
  "decorStars": "星"
}
```

```json
// en.json additions
"customize": {
  "title": "Customize",
  "lineColor": "Line Color",
  "seasonDefault": "Season",
  "effect": "Effect",
  "effectNone": "None",
  "effectShadow": "Soft Shadow",
  "effectGlow": "Glow",
  "addText": "Caption",
  "textNone": "None",
  "textHanakotoba": "Flower Meaning",
  "textCustom": "Custom",
  "textPlaceholder": "Up to 12 chars",
  "decoration": "Decoration",
  "decorNone": "None",
  "decorPetals": "Petals",
  "decorBranch": "Branch",
  "decorStars": "Stars"
}
```

---

## OTA Safety

- `CustomizationPanel` manages expand/collapse with its own internal `useState` — no new hooks added to `StampPreview`
- AsyncStorage load uses `useEffect` already present in `StampPreview` (extend existing effect or add alongside)
- If `StampPreview` currently has no `useEffect`, adding one is a hook count change → must ship in a native build
- **Recommendation**: Verify `StampPreview`'s current hook count before deciding OTA vs native build

---

## Files Affected

| File | Change |
|------|--------|
| `src/types/hanami.ts` | Add `CustomOptions` interface + `DEFAULT_CUSTOM_OPTIONS` |
| `src/constants/theme.ts` | Add `STAMP_COLOR_PALETTE` |
| `src/components/stamps/CustomizationPanel.tsx` | **New** |
| `src/components/stamps/StampDecoration.tsx` | **New** |
| `src/components/stamps/StampPreview.tsx` | Add state + AsyncStorage + CustomizationPanel |
| `src/components/stamps/StampRenderer.tsx` | Forward `customOptions` |
| `src/components/stamps/ClassicStamp.tsx` | Add custom* props |
| `src/components/stamps/ReliefStamp.tsx` | Add custom* props |
| `src/components/stamps/PostcardStamp.tsx` | Add custom* props |
| `src/components/stamps/MedallionStamp.tsx` | Add custom* props |
| `src/components/stamps/WindowStamp.tsx` | Add custom* props |
| `src/components/stamps/MinimalStamp.tsx` | Add custom* props |
| `src/i18n/ja.json` | Add `customize.*` keys |
| `src/i18n/en.json` | Add `customize.*` keys |

---

## Testing

1. `npx jest` — all existing suites pass
2. Custom color overrides season color in rendered stamp
3. `textMode = 'hanakotoba'` truncates to 12 chars, graceful when `spot.hanakotoba` is undefined
4. `textMode = 'custom'` persists TextInput value on blur
5. AsyncStorage persistence: close/reopen preview, options restore correctly
6. `decorationKey` renders expected SVG elements visible in screenshot
7. `effectType = 'shadow'` / `'glow'` visible in Expo Go + captured in view-shot PNG
8. Expo Go: expand/collapse animation smooth, save button shifts down cleanly
9. OTA safety check: confirm no hook count change in `StampPreview`

---

## Out of Scope (Phase B2+)

- Per-spot hanakotoba data (currently `spot.hanakotoba` may not be populated — acceptable, shows nothing gracefully)
- Animated decoration
- Season-locked styles or achievement-unlocked styles
- Sharing custom options state between different stamps
