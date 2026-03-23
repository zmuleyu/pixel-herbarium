# Design: Petal Press — Checkin Stamp Animation

**Date:** 2026-03-22
**Status:** Approved
**Scope:** Stamp animation system for checkin flow

## Problem

The current checkin flow lacks animated feedback. After tapping "Save", the app jumps directly to the success overlay without any transitional moment. This misses an opportunity to reinforce the ritual of collecting flower stamps — the emotional core of Pixel Herbarium.

## Reference

`C:\Users\Admin\Desktop\WaxSealStamp` — a web Canvas implementation of wax seal stamp animations featuring:
- 4-stage animation: Drop → Press → Cool → Lift
- Perlin noise for organic wax edges
- Radial gradient + gloss highlight for material feel
- GSAP timeline sequencing

We borrow the **4-stage structure** but reinterpret the visual language to match PH's soft botanical aesthetic.

## Design

### Animation: Petal Press (花瓣印圧)

A 4-stage stamp animation (~1.2s total) that plays after save, before the success overlay.

| Stage | Name | Duration | Visual | Implementation |
|-------|------|----------|--------|----------------|
| 1 | Float Down | 0.3s | Stamp floats down from ~120px above with gentle deceleration | `withSpring(translateY, {damping:15, stiffness:90})`, opacity 0→1 |
| 2 | Press & Bloom | 0.4s | Stamp compresses to 0.88x then bounces to 1.02x; seasonal color halo radiates outward; 3-5 petal particles burst from center | `withSequence(withTiming(0.88), withSpring(1.02))` + halo View scale 0→1.5 + particle Views |
| 3 | Settle | 0.3s | Gentle breathing pulse 1.02→1.0; particles fade out | `withSpring(1.0, {damping:20})` |
| 4 | Complete | 0.2s | Stamp solidifies at final opacity; triggers onComplete callback | `runOnJS(onComplete)()` |

### Petal Particle System

- 3-5 `Animated.View` circles (8x8px)
- Colors: use `themeColor` directly at 60% opacity for lighter variant, and `getStampColors().brandMid` for deeper variant. Two-tone particles add depth without needing new color utilities.
- Each particle: random direction (angle), distance 30-80px, rotation, opacity 1→0
- Triggered at Stage 2 start, fully faded by Stage 3 end

### Halo Effect

- Single circular `Animated.View`, backgroundColor = `themeColor` at 20% opacity
- Scale 0→1.5 during Stage 2, opacity 0.3→0
- Centered on stamp position

### Haptic Feedback

- `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` at Stage 2 (Press moment)
- Note: `CheckinSuccessOverlay` uses `Light` intensity; we use `Medium` here for a more pronounced "press" sensation

### Integration Point

**Modified `handleCTA` flow in StampPreview.tsx:**

```typescript
// New state in StampPreview
const [pendingUri, setPendingUri] = useState<string | null>(null);

async function handleCTA() {
  if (busy) return;
  setBusy(true);
  try {
    setIsCapturing(true);
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    const composedUri = await captureRef(viewShotRef, { format: 'png', quality: 1 });
    setIsCapturing(false);
    // Instead of calling onSave immediately, store URI and trigger animation
    setPendingUri(composedUri);
  } catch {
    setIsCapturing(false);
    setBusy(false);
  }
}

function handleAnimationComplete() {
  if (pendingUri) {
    onSave(pendingUri, stampStyle, currentTransform);
    setPendingUri(null);
  }
  setBusy(false);
}

// In render: show PetalPressAnimation when pendingUri is set
{pendingUri != null && (
  <PetalPressAnimation
    stampX={...}
    stampY={...}
    themeColor={season.themeColor}
    onComplete={handleAnimationComplete}
  >
    <StampRenderer ... />
  </PetalPressAnimation>
)}
```

Key constraint: `captureRef` must complete BEFORE animation starts (screenshot should not include animation artifacts).

### Accessibility

- When `AccessibilityInfo.isReduceMotionEnabled()` is true: skip all animation, call `onComplete` immediately
- Consistent with existing `CheckinSuccessOverlay` pattern

### Component Interface

```typescript
// Exported constant (also used by GestureStampOverlay)
export const STAMP_APPROX_SIZE = 80;

interface PetalPressAnimationProps {
  /** Stamp center X relative to container. Computed from GestureStampOverlay transform. */
  stampX: number;
  /** Stamp center Y relative to container. */
  stampY: number;
  /** Seasonal theme color for halo + petals */
  themeColor: string;
  /** Called when all 4 stages complete */
  onComplete: () => void;
  /** StampRenderer output */
  children: React.ReactNode;
}
```

### Stamp Position Resolution

`currentTransform` from `GestureStampOverlay` stores the **top-left** position (`translateX`, `translateY`). The stamp approximate size is 80px (local constant `STAMP_SIZE` in `GestureStampOverlay.tsx`).

**Center coordinate computation:**
```typescript
const STAMP_HALF = STAMP_APPROX_SIZE / 2; // 40

// When currentTransform is available (user dragged the stamp)
stampX = currentTransform.x + STAMP_HALF;
stampY = currentTransform.y + STAMP_HALF;

// Fallback when currentTransform is undefined (user never dragged)
// Uses the same initial position as GestureStampOverlay lines 41-42
stampX = photoContainerSize.width * 0.55 + STAMP_HALF;
stampY = photoContainerSize.height * 0.70 + STAMP_HALF;
```

Note: `STAMP_SIZE` in `GestureStampOverlay.tsx` should be refactored to import `STAMP_APPROX_SIZE` from the new file for consistency.

### Files

| File | Action |
|------|--------|
| `src/components/stamps/PetalPressAnimation.tsx` | **Create** |
| `src/components/stamps/StampPreview.tsx` | **Modify** — integrate animation into save flow |
| `src/components/stamps/index.ts` | **Modify** — add export |
| `src/components/stamps/__tests__/PetalPressAnimation.test.tsx` | **Create** |

### Reused Code

| Existing | Path | Purpose |
|----------|------|---------|
| `getStampColors()` | `src/utils/stamp-colors.ts` | Petal color derivation |
| `gridPositionToCoords()` | `src/utils/stamp-position.ts` | Coordinate reference |
| Haptics pattern | `src/components/CheckinSuccessOverlay.tsx` | Haptic feedback |
| `StampRenderer` | `src/components/stamps/StampRenderer.tsx` | Stamp content as children |

### Constraints

- Pure Reanimated + Haptics — no Canvas/Skia, 100% OTA safe
- No new native dependencies
- Animation must not interfere with captureRef screenshot
- Must respect reduceMotion accessibility setting

### Technical Note: Animation Paradigms

The project uses two animation APIs:
- **Classic `Animated`** (from `react-native`): used in `CheckinSuccessOverlay.tsx`
- **Reanimated** (`react-native-reanimated`): used in `GestureStampOverlay.tsx`

This component uses **Reanimated** for consistency with the stamp subsystem. Both APIs coexist without issue. Future cleanup could migrate `CheckinSuccessOverlay` to Reanimated, but that is out of scope.

## Non-Goals

- Wax material texture rendering (not needed — focus is animation, not material)
- Video export of the animation
- Custom stamp icon picker (existing stamp styles are sufficient)
- Applying animation to preview/share flows (future scope)

## Future Extensions

- Preview mode: play mini-animation when switching stamp styles
- Share flow: brief animation before export
- Seasonal animation variants (sakura petals in spring, maple leaves in autumn)
