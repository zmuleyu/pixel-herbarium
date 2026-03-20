# In-App Guidance System — Design Spec

**Date:** 2026-03-20
**Status:** Draft
**Scope:** First-time usage tips for core features + Settings help page

## Context

Pixel Herbarium (花図鉑) is a seasonal flower discovery app targeting Japanese users with an "Adult Kawaii" aesthetic. The app currently has a 3-slide onboarding carousel for first launch, plus scattered contextual hints (locked plant bloom hints, viewfinder text, empty states). However, several core features lack first-time guidance:

- **Discover** (AI plant identification) — camera viewfinder operation, GPS dependency, monthly quota
- **Check-in stamp editor** — 9-grid position, style selector, opacity/size sliders
- **Herbarium** (collection) — progress bar meaning, locked vs unlocked plant interaction
- **Map** — heatmap toggle, layer switching, 500m proximity check-in range
- **Settings** — no help/FAQ page, no way to re-view guidance

Japanese users expect **おもてなし** (hospitality) in UX — polite progressive disclosure via coach marks is standard in LINE, PayPay, メルカリ. This spec adds that layer while respecting PH's warm, non-anxious tone.

## Design Decisions

### Visual Style: Warm Coach Mark

Standard coach marks use harsh black overlays. PH adapts this to Adult Kawaii:

| Element | PH Spec | Standard |
|---------|---------|----------|
| Overlay | `rgba(159, 146, 140, 0.55)` warm gray-brown (light bg); `rgba(80, 74, 70, 0.65)` (dark bg like camera) | `rgba(0,0,0,0.5)` |
| Spotlight | Transparent cutout, 8px padding, rounded corners | Same |
| Tooltip | White card, `borderRadius: 12`, `cardSubtle` shadow | Same |
| Font | HiraginoMaruGothicProN 15px, `colors.text` (#3a3a3a) | System |
| Button | Sage green (#9fb69f) bg + white text | Blue |
| Step dots | Sage green active, `#e8e6e1` inactive | Same |
| Animation | Fade + scale(0.92→1), 300ms ease-in-out | Same |

### Trigger: First-time only

Each feature's guide shows once, stored in AsyncStorage. Users can re-view from Settings > 使い方ガイド.

### OTA Safety: GuideWrapper pattern

**Constraint:** OTA updates cannot change React hook count in existing screen files (causes crash).

**Solution:** All hooks live inside a new `GuideWrapper` component. Existing screen files only gain:
- A `<GuideWrapper>` JSX wrapper (no hooks)
- A few `testID` attributes on existing elements (for spotlight targeting)

Target element positions are measured via `onLayout` callbacks injected as JSX props on existing elements — this is OTA-safe (no new hooks, just a prop addition).

## Component Architecture

### A. CoachMark (`src/components/guide/CoachMark.tsx`)

Full-screen overlay rendered as a portal. Uses four `View` rectangles forming a frame around the spotlight area (avoids `MaskedView` dependency).

```typescript
interface CoachMarkProps {
  steps: CoachStep[];
  currentStep: number;
  onNext: () => void;
  onDismiss: () => void;
  visible: boolean;
}

interface CoachStep {
  /** Key used by GuideMeasureContext to look up the measured rect */
  targetKey?: string;
  /** Manual rect fallback (for dynamic elements like FlatList cells) */
  targetRect?: { x: number; y: number; width: number; height: number };
  body: string;                 // i18n key
  icon?: string;                // emoji
  position?: 'above' | 'below' | 'auto';  // tooltip position
  spotlightPadding?: number;    // default 8
  spotlightShape?: 'rect' | 'circle';     // default 'rect'
}
// At least one of targetKey or targetRect must be provided.
```

### A.1. GuideMeasureContext (`src/components/guide/GuideMeasureContext.tsx`)

A React Context that collects element layout measurements from `onLayout` callbacks. The `GuideWrapper` provides this context; child elements register their measurements by adding an `onLayout` prop:

```tsx
// In discover.tsx (JSX-only change, no hooks):
<View
  onLayout={(e) => guideMeasure('discover.viewfinder', e)}
  style={styles.viewfinder}
>
```

The `guideMeasure` function is obtained from context, not a hook. It stores `{ x, y, width, height }` in a ref-based map. The `CoachMark` reads these measurements to position spotlights.

**Why not `UIManager.measure()` by testID?** React Native has no API to look up a node by `testID` at runtime. `UIManager.measure()` requires a native node handle from `findNodeHandle(ref)`. The `onLayout` approach is simpler, more reliable, and avoids ref threading.
```

**Behavior:**
- Fade in overlay (opacity 0→1, 300ms)
- Tooltip scale(0.92→1) spring entrance
- Tap "次へ" or tap overlay → advance step
- Last step button shows "わかった" instead of "次へ"
- Haptic feedback (Light) on step advance
- Respect `AccessibilityInfo.isReduceMotionEnabled()` — skip scale animation
- VoiceOver: tooltip text has `accessibilityRole="alert"`, button has `accessibilityRole="button"`

### B. GuideWrapper (`src/components/guide/GuideWrapper.tsx`)

```typescript
interface GuideWrapperProps {
  guideKey: string;             // e.g. 'discover'
  steps: CoachStep[];
  children: React.ReactNode;
  /** Delay before showing guide (ms). Default 500. */
  delay?: number;
}
```

Internally uses `useGuideState(guideKey)`. If not seen, renders `CoachMark` overlay after `delay` ms. On dismiss, calls `markSeen()`.

### C. useGuideState (`src/hooks/useGuideState.ts`)

```typescript
interface GuideState {
  seen: boolean;
  loading: boolean;
  markSeen: () => Promise<void>;
  reset: () => Promise<void>;
}

function useGuideState(key: string): GuideState
```

Follows the `useOnboardingControls` pattern — reads `guide_seen_{key}_v1` from AsyncStorage on mount.

### D. guide-storage utilities (`src/utils/guide-storage.ts`)

```typescript
const GUIDE_KEYS = [
  'guide_seen_discover_v1',
  'guide_seen_stamp_v1',
  'guide_seen_herbarium_v1',
  'guide_seen_map_v1',
];

export async function resetAllGuides(): Promise<void>;
export async function resetGuide(feature: string): Promise<void>;
```

## Guidance Sequences

### 1. Discover Tab (識花) — 3 steps

**Trigger:** First time camera is ready on Discover tab, `guide_seen_discover_v1` not set.

| Step | Target testID | Icon | Body (ja) | Body (en) |
|------|--------------|------|-----------|-----------|
| 1 | `discover.viewfinder` (circle) | 📸 | ここでお花を撮影できます。近づいて、花をフレームの中に合わせてください | You can photograph flowers here. Get close and align the flower within the frame |
| 2 | `discover.gpsBadge` | 📍 | 位置情報を使って、どこで花を見つけたか記録します。GPSマークが表示されていれば準備完了です | Your location is recorded with each discovery. When you see the GPS mark, you're ready |
| 3 | `discover.capture` | 🌸 | シャッターを押して花を識別します。月ごとに撮影回数があるので、大切に使ってください | Press the shutter to identify a flower. You have a monthly quota, so use it wisely |

Step 1 uses `spotlightShape: 'circle'` to match the circular viewfinder.

### 2. Stamp Editor (打卡スタンプ) — 4 steps

**Trigger:** First time `step === 'preview'` in CheckinScreen, `guide_seen_stamp_v1` not set.

| Step | Target testID | Icon | Body (ja) | Body (en) |
|------|--------------|------|-----------|-----------|
| 1 | `stamp.positionGrid` | 📐 | スタンプの位置を変えられます。お好みの場所をタップしてみてください | You can change the stamp position. Tap your preferred location |
| 2 | `stamp.styleSelector` | 🎨 | ピクセル、印章、シンプルの3種類からお好きなスタイルを | Choose from pixel, seal, or minimal stamp styles |
| 3 | `stamp.opacitySlider` | 🔅 | 透明度を調整して、写真との馴染みを変えられます | Adjust transparency to blend the stamp with your photo |
| 4 | `stamp.saveButton` | ✨ | 準備ができたら、ここを押して保存とシェアをしましょう | When you're happy, tap here to save and share |

### 3. Herbarium Tab (図鑑) — 2 steps

**Trigger:** First visit with loaded data, `guide_seen_herbarium_v1` not set.

| Step | Target testID | Icon | Body (ja) | Body (en) |
|------|--------------|------|-----------|-----------|
| 1 | `herbarium.progressBar` | 📊 | ここに集めた植物の数が表示されます。全種をコンプリートしましょう | This shows how many plants you've collected. Try to complete all species |
| 2 | First locked cell (dynamic rect) | 🔒 | グレーのマスはまだ見つけていない植物です。タップすると開花時期のヒントが見られます | Grey cells are undiscovered plants. Tap one to see a bloom season hint |

Step 2 uses `targetRect` (manual measurement via `onLayout` on the first locked cell) since its position is dynamic in FlatList.

### 4. Map Tab (マップ) — 2 steps

**Trigger:** First visit with `userLocation` available, `guide_seen_map_v1` not set.

| Step | Target testID | Icon | Body (ja) | Body (en) |
|------|--------------|------|-----------|-----------|
| 1 | `map.heatmapToggle` | 🗺️ | 熱図ボタンで、この地域の花の分布を見られます。色が濃いほど発見が多い場所です | Toggle the heatmap to see flower distribution. Darker colors mean more discoveries |
| 2 | `map.layerToggle` | 🌸 | レイヤーを切り替えると桜スポットマップを見られます。500m以内に近づくと打卡できます | Switch layers to see sakura spots. You can check in when within 500m |

## Settings Help Page

### New route: `src/app/guide.tsx`

**Entry point:** New menu row in `settings.tsx` between Privacy and Version:

```
使い方ガイド  ›
```

**Page layout:**

```
┌─────────────────────────────────┐
│ 使い方ガイド            (title) │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📸 花を識別する             │ │
│ │ カメラで花を撮影して、AI が │ │
│ │ 植物を識別します。          │ │
│ │        [もう一度見る]       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🎨 打卡カードを作る         │ │
│ │ チェックインで撮った写真に  │ │
│ │ スタンプを重ねて...         │ │
│ │        [もう一度見る]       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📊 図鑑をコンプリートする   │ │
│ │ 発見した植物は図鑑に登録... │ │
│ │        [もう一度見る]       │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🗺️ 花のマップを見る         │ │
│ │ 近くの花の分布をヒートマッ  │ │
│ │ プで確認...                 │ │
│ │        [もう一度見る]       │ │
│ └─────────────────────────────┘ │
│                                 │
│   [すべてのガイドをリセット]    │
└─────────────────────────────────┘
```

**"もう一度見る" behavior:** Calls `resetGuide(feature)` then navigates to the corresponding tab. Next time the user enters that tab, the guide replays.

**"すべてリセット" behavior:** Calls `resetAllGuides()`, shows toast "ガイドをリセットしました".

## i18n Keys

All text uses i18n keys under `guide.*` namespace. Full key list in `src/constants/guide-steps.ts`.

**Settings section additions:**
- `settings.guide` → "使い方ガイド" / "Usage Guide"
- `settings.guideSubtitle` → "機能の使い方をもう一度確認できます" / "Review how to use each feature"

**Guide page:**
- `guide.title` → "使い方ガイド" / "Usage Guide"
- `guide.viewAgain` → "もう一度見る" / "View again"
- `guide.resetAll` → "すべてのガイドをリセット" / "Reset all guides"
- `guide.resetAllDone` → "ガイドをリセットしました" / "Guides have been reset"
- `guide.next` → "次へ" / "Next"
- `guide.gotIt` → "わかった" / "Got it"

**Per-feature titles and descriptions:** (see Guidance Sequences tables above)

## File Changes Summary

### New files (6)

| File | Purpose |
|------|---------|
| `src/components/guide/CoachMark.tsx` | Warm overlay + spotlight + tooltip |
| `src/components/guide/GuideWrapper.tsx` | OTA-safe wrapper managing display state |
| `src/components/guide/GuideMeasureContext.tsx` | Context for collecting onLayout measurements |
| `src/components/guide/index.ts` | Barrel export |
| `src/hooks/useGuideState.ts` | AsyncStorage-backed state hook |
| `src/utils/guide-storage.ts` | Reset utilities |
| `src/constants/guide-steps.ts` | All step definitions per feature |
| `src/app/guide.tsx` | Settings help page |

### Modified files (7, JSX-only changes — zero new hooks)

| File | Changes |
|------|---------|
| `src/app/(tabs)/discover.tsx` | + GuideWrapper wrap + 3 `onLayout` callbacks on viewfinder/GPS/capture |
| `src/app/(tabs)/checkin.tsx` | + GuideWrapper wrap around stamp preview section |
| `src/app/(tabs)/herbarium.tsx` | + GuideWrapper wrap + 1 `onLayout` on progress bar |
| `src/app/(tabs)/map.tsx` | + GuideWrapper wrap + 2 `onLayout` on heatmap/layer toggles |
| `src/app/(tabs)/settings.tsx` | + 使い方ガイド menu row |
| `src/components/stamps/StampPreview.tsx` | + 4 `onLayout` callbacks on position/style/opacity/save |
| `src/i18n/ja.json` + `src/i18n/en.json` | + guide.* keys |

### Existing patterns reused

| Pattern | Source | Reuse |
|---------|--------|-------|
| AsyncStorage read/write | `useOnboardingControls.ts` | `useGuideState` follows same pattern |
| Overlay animation | `CheckinSuccessOverlay.tsx` | Fade + scale with reduce-motion check |
| Menu row style | `settings.tsx` menuRow | Help page entry uses identical style |
| PressableCard | `src/components/PressableCard.tsx` | Help page feature cards |
| Haptic feedback | `useOnboardingControls.ts` | Step advance feedback |

## Edge Cases

### Permission gate on Discover
If camera/location permissions are denied, `discover.tsx` renders a permission request screen instead of the viewfinder. The `GuideWrapper` must check that target measurements exist before showing the coach mark. If no measurements are registered (permission gate view), the guide silently defers — it will trigger next time the camera view actually renders.

### Overlay on dark vs light backgrounds
The Discover screen has a black camera background; other tabs have cream backgrounds. The overlay uses two tints:
- **Light background** (herbarium, map, settings): `rgba(159, 146, 140, 0.55)` — warm gray-brown
- **Dark background** (discover camera): `rgba(80, 74, 70, 0.65)` — darker warm tone for sufficient contrast

The `GuideWrapper` accepts an optional `overlayVariant: 'light' | 'dark'` prop (default `'light'`).

## Accessibility

- Tooltip: `accessibilityRole="alert"` for VoiceOver announcement
- Buttons: `accessibilityRole="button"` + descriptive `accessibilityLabel`
- Step indicator: `accessibilityLabel="ステップ {n}/{total}"`
- Reduce motion: `AccessibilityInfo.isReduceMotionEnabled()` → skip scale animation, instant opacity

## Verification Plan

1. **Unit tests:**
   - `useGuideState` — mock AsyncStorage, test seen/markSeen/reset
   - `CoachMark` — render with steps, verify text/dots/button behavior
   - `GuideWrapper` — verify children render, coach mark shows/hides based on state

2. **Manual verification:**
   - Clear all `guide_seen_*` keys → enter each tab → verify coach mark sequence
   - Complete guide → re-enter tab → verify no coach mark
   - Settings > 使い方ガイド > もう一度見る → verify guide replays
   - Settings > すべてリセット → verify all guides replay
   - Switch language ja↔en → verify all text changes

3. **Maestro E2E:**
   - `e2e/guide-discover.yaml` — clear state, enter discover, tap through 3 steps, verify dismissed
   - `e2e/guide-settings-reset.yaml` — reset from settings, verify guide reappears

4. **OTA safety check:**
   - `git diff` the modified screen files → confirm zero `use*` hook additions
   - Test OTA update path: old bundle → new bundle with guides → no crash
