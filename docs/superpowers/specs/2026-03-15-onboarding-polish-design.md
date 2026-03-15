# Onboarding Polish Design

**Date:** 2026-03-15
**Status:** Approved
**Scope:** `src/app/onboarding.tsx` + `src/i18n/` (no changes)

---

## Context

Pixel Herbarium v1.0.0 onboarding is functional but minimal: 3 slides with emoji icons, static dot indicators, no animations, and no interaction feedback. Pre-TestFlight polish pass to improve first-run impression without changing content or routing logic.

---

## Goals

- Reinforce Adult Kawaii aesthetic on first screen users ever see
- Add motion and tactile feedback for a premium feel
- Enable back navigation and swipe gestures for natural mobile UX
- No new dependencies beyond what's already in Expo SDK

---

## Visual Design: Gradient Background + Emoji Glow Circle

Each slide gets a unique gradient background and emoji container color, transitioning to the shared cream background at the bottom. This creates visual variety without disrupting the calm, cohesive aesthetic.

| Slide | Emoji | Theme | Gradient (top → bottom) | Glow color |
|-------|-------|-------|--------------------------|------------|
| 1 — Welcome | 🌸 | Sage green | `#e8f0e8 → #f5f4f1` | `rgba(159,182,159,0.18)` |
| 2 — Shoot & Identify | 📷 | Warm amber | `#f5ede0 → #f5f4f1` | `rgba(210,160,90,0.15)` |
| 3 — Record Discoveries | 🗺️ | Soft blue-grey | `#e0eaf5 → #f5f4f1` | `rgba(100,140,190,0.15)` |

The emoji is placed inside a circular container (90×90, `border-radius: 45`) filled with the glow color, floating on the gradient background. Emoji size reduces from 80px to 52px to fit comfortably inside the circle.

---

## Interaction Polish

### ① Haptic Feedback
- Library: `expo-haptics` (included in Expo SDK, no install needed)
- Trigger: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` on every Next, Back, and Get Started press
- Also trigger on swipe completion (see ④)

### ② Slide Content Fade-In
- When a slide becomes active, its emoji, title, and body text animate in: `opacity 0→1` + `translateY 12→0`
- Duration: 280ms, easing: `Easing.out(Easing.ease)`
- Implementation: `useRef<Animated.Value[]>` array (one per slide), reset to 0 and play forward on each page change
- The animation fires both on button navigation and swipe navigation

### ③ Dot Width Interpolation
- Current: instant width jump from 6px to 20px via StyleSheet
- New: `Animated.Value` tracking current page (0, 1, 2), each dot uses `interpolate` to map its active state to `width: 20` and inactive to `width: 6`
- `backgroundColor` cannot be interpolated directly in RN; use two overlapping dots (active color at full opacity, inactive color at 0) with opacity interpolation instead
- Duration: 250ms, easing: `Easing.out(Easing.ease)`

### ④ Swipe Gesture Navigation
- Enable `scrollEnabled={true}` on the ScrollView
- Listen to `onMomentumScrollEnd`: compute new page from `event.nativeEvent.contentOffset.x / SCREEN_WIDTH`, update `page` state
- On swipe completion: trigger haptic (①) and fade-in animation (②) for the new slide
- `pagingEnabled` remains `true` — snapping behaviour is unchanged

### ⑤ Step Counter (1 / 3)
- Position: top-right corner, same horizontal row as Skip button
- Skip on left, `1 / 3` on right — both in `colors.textSecondary` at 13px
- On Slide 3: Skip is hidden (existing behaviour), counter stays visible
- Format: `{page + 1} / {slides.length}` — i18n not required (numeral format is universal)

### ⑥ Back Button
- Visible on Slides 2 and 3; hidden (but space preserved) on Slide 1
- Positioned bottom-left, symmetrical with Next button on bottom-right
- Icon: `‹` character or `@expo/vector-icons` `Ionicons` `chevron-back` — whichever is already imported
- Tapping triggers: `goBack()` → scroll to previous slide + haptic + fade-in of previous slide content
- On Slide 1 the back button position renders an empty `<View>` to maintain layout balance

---

## Architecture

### Hook: `useOnboardingControls`

Extract all control logic from the component into a custom hook. This keeps `onboarding.tsx` readable as the file grows with animation values.

```ts
// src/hooks/useOnboardingControls.ts
export function useOnboardingControls(slideCount: number) {
  // State
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Animation values
  const fadeAnims = useRef(
    Array.from({ length: slideCount }, () => new Animated.Value(0))
  ).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  // Actions
  function animateIn(index: number) { /* fade + translate */ }
  function goNext() { /* scroll + haptic + animate */ }
  function goBack() { /* scroll + haptic + animate */ }
  function finish() { /* SecureStore + router */ }
  function onSwipeEnd(newPage: number) { /* sync page + animate */ }

  return { page, scrollRef, fadeAnims, dotAnim, goNext, goBack, finish, onSwipeEnd };
}
```

### Component: `onboarding.tsx`

Consumes the hook. Responsibilities limited to:
- Rendering the 3 slides with gradient backgrounds and emoji glow circles
- Rendering the header row (Skip left, counter right)
- Rendering the dot indicator row
- Rendering the footer row (Back left, Next/Start right)

No animation logic lives in the component file.

---

## What Does Not Change

| Item | Reason |
|------|--------|
| i18n strings | Text content is already correct and translated |
| `onboarding_done_v1` SecureStore key | Completion tracking is correct |
| Routing logic in `_layout.tsx` | Route guard is correct |
| 3-slide structure | Content is sufficient for MVP |
| `skip` button behaviour | Remains on Slides 1–2 only |

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/onboarding.tsx` | Full rewrite of component (visual + wiring); logic extracted to hook |
| `src/hooks/useOnboardingControls.ts` | New file: animation + navigation logic |

---

## Testing

- Manual: run on iOS simulator, verify all 6 polish items
- Existing tests in `__tests__/` do not cover `onboarding.tsx` directly — no test changes needed
- Verify: swipe + button navigation both trigger animations correctly
- Verify: haptic fires on every interaction (simulator shows no feedback — test on physical device)
- Verify: gradient backgrounds render correctly on cream base without harsh edges
- Verify: back button is absent on Slide 1 and present on Slides 2–3
- Verify: step counter increments correctly across all navigation paths (button + swipe)
