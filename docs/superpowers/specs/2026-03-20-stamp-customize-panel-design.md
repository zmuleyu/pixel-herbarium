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

**Restore logic**: After `AsyncStorage.getItem(CUSTOM_COLOR_KEY)`, check if result `=== null` (never set) OR `=== 'undefined'` (explicitly cleared). Both cases → use `undefined` (season default). For enum keys (effectType/textMode/decorationKey), treat `null` as the default value.

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

**`StampOverlay.tsx`**: Add `customOptions?: CustomOptions` to `StampOverlayProps`; forward to `StampRenderer`.

**`StampRenderer.tsx`**: Accept `customOptions?: CustomOptions`; forward to individual stamp components.

**Individual stamp components** (ClassicStamp, ReliefStamp, PostcardStamp, MedallionStamp, WindowStamp, MinimalStamp):
- New optional props:
  ```typescript
  customColor?: string;
  effectType?: 'none' | 'shadow' | 'glow';
  customText?: string;       // derived: textMode='custom' → customTextValue, textMode='hanakotoba' → spot.hanakotoba?.slice(0,12)
  decorationKey?: 'none' | 'petals' | 'branch' | 'stars';
  ```
- `customColor` overrides `themeColor` (Classic/Relief/Postcard/Medallion/Window) or `accentColor` (Minimal) when defined. `StampRenderer` passes `customColor` as the relevant prop for each component's signature.
- `customText` renders as extra subtitle line at stamp bottom (font-size: small, muted color)
- `effectType` applies via `style` prop on stamp's outermost wrapper View (see Effect Rendering section)
- `decorationKey` is forwarded to `StampRenderer` only. Individual stamp components do NOT render `<StampDecoration>` directly (see below).

### New Sub-component: `StampDecoration.tsx`

**Location**: `src/components/stamps/StampDecoration.tsx`

**Placement**: Rendered in `StampRenderer` as a `position: 'absolute'` sibling **wrapping the stamp component**, NOT as a child inside individual stamp components. This avoids the `overflow: 'hidden'` clipping present on ReliefStamp, PostcardStamp, MedallionStamp, and WindowStamp.

```typescript
// StampRenderer renders:
<View style={{ position: 'relative' }}>
  <ClassicStamp ... />   {/* or whichever style */}
  {decorationKey !== 'none' && (
    <StampDecoration
      decorationKey={decorationKey}
      color={resolvedColor}
      styleId={styleId}
    />
  )}
</View>
```

Props:
```typescript
interface StampDecorationProps {
  decorationKey: 'petals' | 'branch' | 'stars';  // 'none' filtered out before render
  color: string;   // resolved color: customColor ?? themeColor (or accentColor for Minimal)
  styleId: StampStyleId;  // used to look up per-style size constants
}
```

Size mapping lives inside `StampDecoration` using a constant map indexed by `styleId`. Known stamp sizes:
- `medallion`: 72×72 (DIAMETER constant)
- `classic`: 130 min-width (use 130×96)
- `relief`: 120×90
- `postcard`: 120×auto (use 120×130)
- `window`: 116×auto (use 116×130)
- `minimal`: no fixed size (no corner decorations; render a simple inline petal row)

SVG elements are contained within the stamp bounds (no bleed beyond edges). Opacity 0.3–0.5. Uses react-native-svg. This component is rendered within the `viewShotRef` boundary so decorations appear in the saved PNG.

---

## 添え文字 Logic

### 花言葉 Data Source

`FlowerSpot` does not currently have a `hanakotoba` field. This spec requires adding:

```typescript
// src/types/hanami.ts — add to FlowerSpot interface
hanakotoba?: string;  // flower meaning in Japanese, ≤30 chars
```

The field is optional. When undefined or empty, `textMode = 'hanakotoba'` silently renders nothing (no crash, no placeholder). Content pack JSON files can populate this field incrementally.

### Derivation Logic

```
textMode = 'none'        → customText = undefined (no rendering)
textMode = 'hanakotoba'  → customText = spot.hanakotoba?.slice(0, 12) ?? undefined
textMode = 'custom'      → customText = customTextValue (max 12 chars, set via TextInput)
```

Derived `customText` string is computed in `StampPreview` and passed as a single optional `string` prop to stamp components. Stamp components receive final string only, no mode logic.

`customTextValue` is held in `StampPreview` state. Collapsing and re-expanding `CustomizationPanel` does NOT lose the value (the panel's `useState` only controls visibility, not data).

---

## Effect Rendering

### Resolved Color

Before applying effects, compute `resolvedColor` in each stamp component:

```typescript
// For ClassicStamp, ReliefStamp, PostcardStamp, MedallionStamp, WindowStamp:
const resolvedColor = customColor ?? themeColor;

// For MinimalStamp:
const resolvedColor = customColor ?? accentColor;
```

### Effect Styles

Applied to the stamp's outermost wrapper `<View>`. React Native uses `{ width, height }` for `shadowOffset`, `shadowOpacity` on iOS, and `elevation` on Android:

```
effectType = 'none'    → no additional style

effectType = 'shadow'  → {
  shadowColor: '#000000',
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 0.13,
  shadowRadius: 4,
  elevation: 3,
}

effectType = 'glow'    → {
  shadowColor: resolvedColor,   // color-tinted glow
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.40,
  shadowRadius: 8,
  elevation: 6,
}
```

Compatible with `react-native-view-shot` (shadow is captured in PNG).

---

## i18n Keys

Key names to use (use `t('customize.XXX')` in component):

| Key | ja | en |
|-----|----|----|
| `customize.title` | ✎ カスタマイズ | ✎ Customize |
| `customize.lineColor` | 線の色 | Line Color |
| `customize.seasonDefault` | 季節色 | Season |
| `customize.effect` | 効果 | Effect |
| `customize.effectNone` | なし | None |
| `customize.effectShadow` | 淡い影 | Soft Shadow |
| `customize.effectGlow` | 柔光 | Glow |
| `customize.addText` | 添え文字 | Caption |
| `customize.textNone` | なし | None |
| `customize.textHanakotoba` | 花言葉 | Flower Meaning |
| `customize.textCustom` | 自由入力 | Custom |
| `customize.textPlaceholder` | 12文字以内 | Up to 12 chars |
| `customize.decoration` | 装飾 | Decoration |
| `customize.decorNone` | なし | None |
| `customize.decorPetals` | 花びら | Petals |
| `customize.decorBranch` | 枝 | Branch |
| `customize.decorStars` | 星 | Stars |

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
- `StampPreview` already has **one `useEffect`** (line 62) that loads style/position/opacity/size from AsyncStorage using `Promise.all`
- The 4 new custom option keys should be added to this **same existing `useEffect`** (extend the `Promise.all` array) — this keeps hook count unchanged and is OTA safe
- Do NOT add a separate `useEffect` for custom options — adding a second `useEffect` changes the hook execution order and requires a native build
- **Action**: In `StampPreview`'s existing `useEffect`, add 4 new `AsyncStorage.getItem` calls to the existing `Promise.all`

---

## Files Affected

| File | Change |
|------|--------|
| `src/types/hanami.ts` | Add `hanakotoba?` to `FlowerSpot`; add `CustomOptions` interface + `DEFAULT_CUSTOM_OPTIONS` |
| `src/constants/theme.ts` | Add `STAMP_COLOR_PALETTE` |
| `src/components/stamps/CustomizationPanel.tsx` | **New** |
| `src/components/stamps/StampDecoration.tsx` | **New** |
| `src/components/stamps/StampPreview.tsx` | Extend existing `useEffect` + add state + AsyncStorage + CustomizationPanel |
| `src/components/stamps/StampOverlay.tsx` | Add `customOptions?` prop + forward to StampRenderer |
| `src/components/stamps/StampRenderer.tsx` | Accept + forward `customOptions` |
| `src/components/stamps/ClassicStamp.tsx` | Add custom* props |
| `src/components/stamps/ReliefStamp.tsx` | Add custom* props |
| `src/components/stamps/PostcardStamp.tsx` | Add custom* props |
| `src/components/stamps/MedallionStamp.tsx` | Add custom* props |
| `src/components/stamps/WindowStamp.tsx` | Add custom* props |
| `src/components/stamps/MinimalStamp.tsx` | Add custom* props (accentColor override) |
| `src/i18n/ja.json` | Add `customize.*` keys |
| `src/i18n/en.json` | Add `customize.*` keys |

---

## Testing

1. `npx jest` — all existing suites pass
2. Custom color overrides season color in rendered stamp (ClassicStamp's `themeColor`, MinimalStamp's `accentColor`)
3. `textMode = 'hanakotoba'` truncates to 12 chars; no crash when `spot.hanakotoba` is undefined (renders nothing)
4. `textMode = 'custom'` TextInput has `maxLength={12}`; value persists across panel close/reopen within session
5. AsyncStorage persistence: navigate away and back to preview step, all 4 options restore correctly
6. `decorationKey='petals'/'branch'/'stars'` renders expected SVG elements inside the stamp boundary; captured in view-shot PNG
7. `effectType='shadow'` visible with drop shadow in Expo Go and in saved PNG
8. `effectType='glow'` visible with outer glow in Expo Go and in saved PNG
9. Expo Go: expand/collapse is smooth; save button shifts down when expanded
10. OTA check: `StampPreview.tsx` hook count before and after change is identical (only extended existing `useEffect`, no new hooks added)

---

## Notes on Excluded Files

`PixelStamp.tsx` and `SealStamp.tsx` exist in the stamps directory but are dead code — `StampRenderer` remaps `pixel → classic` and `seal → medallion` via a migration map and never renders them. They are intentionally excluded from the files affected table.

## Color Row Default Indicator

When `customColor` is `undefined` (season default active), the season color circle in the palette should display a subtle "季" badge (small text label below the circle) or a thin checkmark ring in `theme.primary`. No circle should appear pre-selected when `customColor` is set to a non-season color. The implementer may choose the precise visual form; the constraint is that the season default state is visually distinguishable from the explicitly-selected-same-color state.

## Out of Scope (Phase B2+)

- Per-spot hanakotoba data (currently `spot.hanakotoba` may not be populated — acceptable, shows nothing gracefully)
- Animated decoration
- Season-locked styles or achievement-unlocked styles
- Sharing custom options state between different stamps
