# Onboarding Polish Design

**Date:** 2026-03-15
**Status:** Approved
**Scope:** `src/app/onboarding.tsx` + `src/hooks/useOnboardingControls.ts` (new)

---

## Context

Pixel Herbarium v1.0.0 onboarding is functional but minimal: 3 slides with emoji icons, static dot indicators, no animations, and no interaction feedback. Pre-TestFlight polish pass to improve first-run impression without changing content or routing logic.

---

## Goals

- Reinforce Adult Kawaii aesthetic on first screen users ever see
- Add motion and tactile feedback for a premium feel
- Enable back navigation and swipe gestures for natural mobile UX

---

## New Dependencies (must install before implementation)

```bash
npx expo install expo-haptics expo-linear-gradient
```

Both are in the Expo SDK ecosystem and compatible with Expo 55. Neither requires native configuration beyond the install.

---

## Visual Design: Gradient Background + Emoji Glow Circle

Each slide gets a unique `<LinearGradient>` background (via `expo-linear-gradient`) and emoji container color. The gradient transitions to the shared cream base at the bottom, creating visual variety without disrupting the calm aesthetic.

| Slide | Emoji | Theme | Gradient (top → bottom) | Glow color |
|-------|-------|-------|--------------------------|------------|
| 1 — Welcome | 🌸 | Sage green | `#e8f0e8 → #f5f4f1` | `rgba(159,182,159,0.18)` |
| 2 — Shoot & Identify | 📷 | Warm amber | `#f5ede0 → #f5f4f1` | `rgba(210,160,90,0.15)` |
| 3 — Record Discoveries | 🗺️ | Soft blue-grey | `#e0eaf5 → #f5f4f1` | `rgba(100,140,190,0.15)` |

The emoji sits inside a circular container (90×90, `borderRadius: 45`) filled with the glow color, centered in the gradient area. Emoji size is 52px (down from 80px) to fit inside the circle.

---

## Layout Structure

```
┌──────────────────────────────────┐
│ Skip (left)         1 / 3 (right)│  ← Header row (top padding)
├──────────────────────────────────┤
│                                  │
│   ┌─────────────────────────┐    │
│   │  <LinearGradient>       │    │  ← Gradient area (flex: 1)
│   │    ⬤ emoji glow circle  │    │
│   │    Title                │    │
│   │    Body text            │    │
│   └─────────────────────────┘    │
│                                  │
│     •  ○  ○   (dot indicators)   │  ← Dot row
│                                  │
│ [‹ Back]             [次へ →]    │  ← Footer row (space-between)
└──────────────────────────────────┘
```

**Header row:** `flexDirection: 'row'`, `justifyContent: 'space-between'`. Skip (left, hidden on Slide 3 via `opacity: 0` to preserve spacing). Step counter (right, always visible). This is a layout change from the current implementation where Skip was in the footer.

**Footer row:** `[Back] [Next/Start]` with `justifyContent: 'space-between'`. Back button hidden on Slide 1 via `opacity: 0` (placeholder view maintains symmetry). Next becomes "はじめる 🌱" on Slide 3.

---

## Interaction Polish

### ① Haptic Feedback (`expo-haptics`)
- `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` on every Next, Back, Get Started press
- Also fires on swipe completion (in `onSwipeEnd`)

### ② Slide Content Fade-In + Translate
- When a slide becomes active: `opacity 0→1` + `translateY 12→0`
- Duration: 280ms, easing: `Easing.out(Easing.ease)`, `useNativeDriver: true`
- Each slide has its own `Animated.Value` (range 0–1). Opacity is driven directly. `translateY` uses `interpolate`: `inputRange: [0, 1]`, `outputRange: [12, 0]`
- On page change: reset the incoming slide's anim to 0, then run `Animated.timing` to 1

### ③ Dot Width + Color Animation
- A single `Animated.Value` tracks `page` (0, 1, 2); changes via `Animated.timing` over 250ms
- Each dot interpolates its `width`: `inputRange: [i-0.5, i, i+0.5]`, `outputRange: [6, 20, 6]`
- `backgroundColor` cannot be animated with `useNativeDriver: true`. Solution: render two overlapping dots per position — one active-colored (sage green), one inactive-colored (border grey) — and animate their opacity. Active dot: `opacity` 0→1 at `inputRange [i-0.5, i]`. Inactive dot: inverse. This avoids JS-driver overhead on a layout property.

### ④ Swipe Gesture Navigation
- Enable `scrollEnabled={true}` on the ScrollView
- Listen to `onMomentumScrollEnd` for swipe detection
- **Programmatic scroll guard:** use a `isProgrammaticScroll` ref (`useRef(false)`). Set to `true` before calling `scrollRef.current?.scrollTo()`, back to `false` in the `onMomentumScrollEnd` handler if the ref is set — and return early to prevent double-triggering animations and haptics
- Swipe-past-last-slide: with `pagingEnabled={true}`, RN naturally prevents scrolling beyond the last page, so `onMomentumScrollEnd` simply returns `x = 2 * SCREEN_WIDTH` again — no action needed

### ⑤ Step Counter
- Position: header row right side, `colors.textSecondary`, 13px
- Format: `{page + 1} / {slides.length}` — numeral format is language-agnostic, no i18n key needed

### ⑥ Back Button
- Visible on Slides 2 and 3; `opacity: 0` (not unmounted) on Slide 1 to maintain layout balance
- Icon: `<Ionicons name="chevron-back" size={20} color={colors.textSecondary} />` — `@expo/vector-icons` v15.1.1 is already in `package.json`; import `Ionicons` into `onboarding.tsx`
- `goBack()` guard: `if (page === 0) return` — prevents accidental scroll to `x = -SCREEN_WIDTH`

---

## Architecture

### New file: `src/hooks/useOnboardingControls.ts`

External dependencies: `react`, `react-native` (Animated, Easing, ScrollView), `expo-router`, `expo-secure-store`, `expo-haptics`.

```ts
export function useOnboardingControls(slideCount: number) {
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isProgrammaticScroll = useRef(false);

  // One Animated.Value per slide (0 = invisible, 1 = visible)
  const slideAnims = useRef(
    Array.from({ length: slideCount }, () => new Animated.Value(0))
  ).current;

  // Single value tracking current page for dot interpolation
  const dotAnim = useRef(new Animated.Value(0)).current;

  function animateIn(index: number): void { /* reset + timing to 1 */ }

  function scrollTo(index: number): void {
    isProgrammaticScroll.current = true;
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setPage(index);
    Animated.timing(dotAnim, { toValue: index, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
    animateIn(index);
  }

  function goNext(): void {
    if (page >= slideCount - 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scrollTo(page + 1);
  }

  function goBack(): void {
    if (page === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scrollTo(page - 1);
  }

  async function finish(): Promise<void> {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
    router.replace('/(tabs)/discover');
  }

  function onSwipeEnd(event: NativeSyntheticEvent<NativeScrollEvent>): void {
    if (isProgrammaticScroll.current) {
      isProgrammaticScroll.current = false;
      return;
    }
    const newPage = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newPage === page) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPage(newPage);
    Animated.timing(dotAnim, { toValue: newPage, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
    animateIn(newPage);
  }

  return { page, scrollRef, slideAnims, dotAnim, goNext, goBack, finish, onSwipeEnd };
}
```

### Updated file: `src/app/onboarding.tsx`

Full rewrite. Responsibilities:
- Import `LinearGradient` from `expo-linear-gradient`
- Import `Ionicons` from `@expo/vector-icons`
- Consume `useOnboardingControls`
- Render header (Skip + counter), gradient slides, dot row, footer (Back + Next)
- Wire `slideAnims[i]` to each slide's opacity and translateY via `interpolate`

---

## What Does Not Change

| Item | Reason |
|------|--------|
| i18n strings | Text content is already correct and translated |
| `onboarding_done_v1` SecureStore key | Completion tracking is correct |
| Routing logic in `_layout.tsx` | Route guard is correct |
| 3-slide structure and content | Content is sufficient for MVP |

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/onboarding.tsx` | Full rewrite: gradient slides, header/footer layout, animation wiring |
| `src/hooks/useOnboardingControls.ts` | New file: all animation + navigation logic |
| `package.json` | `expo-haptics` + `expo-linear-gradient` added via `npx expo install` |

---

## Testing

- Run `npx expo install expo-haptics expo-linear-gradient` before writing any code
- Manual: iOS simulator — verify animations, gradient rendering, counter, Back/Next/swipe all work
- Haptic: must test on physical device (simulator shows no haptic)
- Verify `isProgrammaticScroll` guard prevents double animation on button tap
- Verify Back is invisible (not absent) on Slide 1 — layout should not shift
- Verify swipe past last slide does nothing
- Verify `goBack()` on page 0 is a no-op
- No changes to `__tests__/` needed (onboarding.tsx has no existing unit tests)
