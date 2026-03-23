# Context: Petal Press Checkin Animation

**What we're building:** A 4-stage stamp animation (~1.2s) that plays after checkin save, before the success overlay. Borrows the Drop→Press→Settle→Complete structure from WaxSealStamp but uses PH's soft botanical visual language (petal particles, seasonal color halos).

**Locked decisions:**
- Pure Reanimated implementation, no Canvas/Skia — OTA safe
- Animation triggers after captureRef, before onSave callback
- 4 stages: Float Down (0.3s) → Press & Bloom (0.4s) → Settle (0.3s) → Complete (0.2s)
- Petal particles: 3-5 circles, two-tone (themeColor@60% + brandMid), random burst directions
- Haptic feedback at Press stage (ImpactFeedbackStyle.Medium)
- Respects reduceMotion — skip animation when enabled
- Emotional tone: soft and botanical, not heavy/historical

**Non-goals / constraints:**
- Not implementing wax material texture (user clarified: animation is the focus, not material)
- Not changing existing 6 stamp styles
- Not applying to preview/share flows yet (primary scope: checkin save only)
- No new native dependencies allowed

**Resolved edge cases:**
- captureRef timing → screenshot taken BEFORE animation starts (no animation artifacts in saved image)
- Busy state → animation period covered by existing `busy` flag in StampPreview
- Coordinate source → `currentTransform` stores top-left; compute center as `+ STAMP_APPROX_SIZE/2`
- Transform undefined → fallback to GestureStampOverlay's initial position (55%W, 70%H) + half stamp size
- handleCTA restructure → `pendingUri` state bridges captureRef and animation; onSave deferred to onComplete

## Transition Checklist

- [x] Scope: single system (stamp animation component + StampPreview integration)
- [x] Evidence: Reanimated already used in GestureStampOverlay [EVIDENCE]; Haptics in CheckinSuccessOverlay [EVIDENCE]; captureRef flow confirmed in StampPreview [EVIDENCE]
- [x] Anti-pattern: Wishful Dependency risk — Reanimated `withSequence`/`withSpring` must chain correctly with `runOnJS` callback; validate in Task 1 that timing callbacks fire reliably
