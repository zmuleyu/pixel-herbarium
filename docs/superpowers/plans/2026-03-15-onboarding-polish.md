# Onboarding Polish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the 3-slide onboarding screen with per-slide gradient backgrounds, emoji glow circles, content fade+translate animations, haptic feedback, animated dot indicators, swipe gestures, step counter, and back navigation.

**Architecture:** Extract all control logic into a new `useOnboardingControls` hook (animations, navigation, haptics, SecureStore). Rewrite `onboarding.tsx` as a thin rendering component consuming the hook and `expo-linear-gradient`. No changes to routing, i18n keys, or SecureStore key.

**Tech Stack:** React Native Animated API, expo-haptics, expo-linear-gradient, expo-secure-store, expo-router, @expo/vector-icons (Ionicons — already in package.json v15.1.1)

**Spec:** `docs/superpowers/specs/2026-03-15-onboarding-polish-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/hooks/useOnboardingControls.ts` | **Create** | Page state, scroll ref, Animated values, goNext/goBack/finish/onSwipeEnd, ONBOARDING_KEY |
| `src/app/onboarding.tsx` | **Full rewrite** | Render-only: gradient slides, header/footer layout, dot animation wiring |
| `__tests__/hooks/useOnboardingControls.test.ts` | **Create** | Unit tests for hook logic (state, guards, haptics, SecureStore) |
| `package.json` | **Modify** | Add expo-haptics, expo-linear-gradient via npx expo install |

---

## Chunk 1: Dependencies and Hook

### Task 1: Install new packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
cd D:/projects/Games/gardern/pixel-herbarium
npx expo install expo-haptics expo-linear-gradient
```

Expected: both packages added to `dependencies` in `package.json`.

- [ ] **Step 2: Verify both packages appear in package.json**

```bash
grep -E "expo-haptics|expo-linear-gradient" package.json
```

Expected output (exact versions may vary):
```
"expo-haptics": "~14.0.1",
"expo-linear-gradient": "~14.0.2",
```

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "deps: install expo-haptics and expo-linear-gradient"
```

---

### Task 2: Write failing tests for useOnboardingControls

**Files:**
- Create: `__tests__/hooks/useOnboardingControls.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
// __tests__/hooks/useOnboardingControls.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useOnboardingControls, ONBOARDING_KEY } from '@/hooks/useOnboardingControls';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light' },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ONBOARDING_KEY', () => {
  it('equals the versioned storage key', () => {
    expect(ONBOARDING_KEY).toBe('onboarding_done_v1');
  });
});

describe('useOnboardingControls — initial state', () => {
  it('starts on page 0', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    expect(result.current.page).toBe(0);
  });

  it('returns slideAnims array of length equal to slideCount', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    expect(result.current.slideAnims).toHaveLength(3);
  });

  it('returns scrollRef and dotAnim', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    expect(result.current.scrollRef).toBeDefined();
    expect(result.current.dotAnim).toBeDefined();
  });
});

describe('useOnboardingControls — goNext', () => {
  it('increments page by 1', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    act(() => { result.current.goNext(); });
    expect(result.current.page).toBe(1);
  });

  it('triggers haptic feedback', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    act(() => { result.current.goNext(); });
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it('calls finish (not increment) when already on last slide', async () => {
    // slideCount=1 means page 0 is the last slide
    const { result } = renderHook(() => useOnboardingControls(1));
    await act(async () => { result.current.goNext(); });
    expect(result.current.page).toBe(0); // page did not increment
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(ONBOARDING_KEY, '1');
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/discover');
  });

  it('triggers haptic when calling finish via goNext on last slide', async () => {
    const { result } = renderHook(() => useOnboardingControls(1));
    await act(async () => { result.current.goNext(); });
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });
});

describe('useOnboardingControls — goBack', () => {
  it('decrements page by 1', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    act(() => { result.current.goNext(); }); // advance to page 1
    act(() => { result.current.goBack(); });
    expect(result.current.page).toBe(0);
  });

  it('triggers haptic feedback', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    act(() => { result.current.goNext(); }); // advance to page 1
    jest.clearAllMocks();
    act(() => { result.current.goBack(); });
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it('is a no-op on page 0 — page stays 0', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    act(() => { result.current.goBack(); });
    expect(result.current.page).toBe(0);
  });

  it('is a no-op on page 0 — no haptic fires', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    act(() => { result.current.goBack(); });
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });
});

describe('useOnboardingControls — finish', () => {
  it('writes onboarding key to SecureStore', async () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    await act(async () => { result.current.finish(); });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(ONBOARDING_KEY, '1');
  });

  it('navigates to discover tab', async () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    await act(async () => { result.current.finish(); });
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/discover');
  });

  it('triggers haptic feedback', async () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    await act(async () => { result.current.finish(); });
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });
});

describe('useOnboardingControls — onSwipeEnd', () => {
  function makeSwipeEvent(x: number) {
    return { nativeEvent: { contentOffset: { x } } } as any;
  }

  it('does not throw when called', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    expect(() => {
      act(() => { result.current.onSwipeEnd(makeSwipeEvent(0)); });
    }).not.toThrow();
  });

  it('is a no-op (no extra haptic) when isProgrammaticScroll guard is active', () => {
    const { result } = renderHook(() => useOnboardingControls(3));
    // goNext sets isProgrammaticScroll = true internally
    act(() => { result.current.goNext(); });
    const hapticCallCount = (Haptics.impactAsync as jest.Mock).mock.calls.length;
    // The programmatic scroll event fires — should be swallowed by guard
    act(() => { result.current.onSwipeEnd(makeSwipeEvent(375)); });
    // No additional haptic should have fired
    expect((Haptics.impactAsync as jest.Mock).mock.calls.length).toBe(hapticCallCount);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx jest __tests__/hooks/useOnboardingControls.test.ts --no-coverage 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module '@/hooks/useOnboardingControls'`

---

### Task 3: Implement the hook

**Files:**
- Create: `src/hooks/useOnboardingControls.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/hooks/useOnboardingControls.ts
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

export const ONBOARDING_KEY = 'onboarding_done_v1';

const SCREEN_WIDTH = Dimensions.get('window').width;

export function useOnboardingControls(slideCount: number) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isProgrammaticScroll = useRef(false);

  // One Animated.Value per slide: 0 = invisible, 1 = fully visible.
  // The component drives opacity and translateY via interpolate on this value.
  const slideAnims = useRef(
    Array.from({ length: slideCount }, () => new Animated.Value(0))
  ).current;

  // Tracks current page as a float for dot interpolation.
  // useNativeDriver: false required because it drives width/opacity layout props.
  const dotAnim = useRef(new Animated.Value(0)).current;

  function animateIn(index: number): void {
    const anim = slideAnims[index];
    if (!anim) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }

  function animateDot(toPage: number): void {
    Animated.timing(dotAnim, {
      toValue: toPage,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // drives width — native driver cannot handle layout props
    }).start();
  }

  function scrollTo(index: number): void {
    isProgrammaticScroll.current = true;
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setPage(index);
    animateDot(index);
    animateIn(index);
  }

  // Note: goNext() calls finish() on the last slide.
  // The spec's architecture code-sketch shows `return` (no-op) at this point — that is
  // a stale error in the spec. The correct behaviour is to call finish(), as verified by tests.
  function goNext(): void {
    if (page >= slideCount - 1) {
      finish();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scrollTo(page + 1);
  }

  function goBack(): void {
    if (page === 0) return; // no-op guard: prevents scroll to x = -SCREEN_WIDTH
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scrollTo(page - 1);
  }

  async function finish(): Promise<void> {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
    router.replace('/(tabs)/discover');
  }

  function onSwipeEnd(event: NativeSyntheticEvent<NativeScrollEvent>): void {
    // Guard: programmatic scrollTo also fires onMomentumScrollEnd.
    // Reset the flag and return early to avoid double-animating.
    if (isProgrammaticScroll.current) {
      isProgrammaticScroll.current = false;
      return;
    }
    const newPage = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newPage === page) return; // same page (e.g. attempted swipe past last slide)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPage(newPage);
    animateDot(newPage);
    animateIn(newPage);
  }

  // Animate the first slide in on mount
  useEffect(() => {
    animateIn(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { page, scrollRef, slideAnims, dotAnim, goNext, goBack, finish, onSwipeEnd };
}
```

- [ ] **Step 2: Run tests — verify they pass**

```bash
npx jest __tests__/hooks/useOnboardingControls.test.ts --no-coverage 2>&1 | tail -10
```

Expected:
```
Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
```

- [ ] **Step 3: Run full test suite — verify no regressions**

```bash
npx jest --no-coverage 2>&1 | tail -5
```

Expected: all 165+ tests pass (new suite adds ~13).

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useOnboardingControls.ts __tests__/hooks/useOnboardingControls.test.ts
git commit -m "feat: add useOnboardingControls hook with tests"
```

---

## Chunk 2: Component Rewrite

### Task 4: Rewrite onboarding.tsx

**Files:**
- Modify: `src/app/onboarding.tsx` (full rewrite)

Note: `ONBOARDING_KEY` moves to the hook. Re-export it from `onboarding.tsx` so `_layout.tsx` (which imports it) needs no changes.

- [ ] **Step 1: Rewrite the file**

```typescript
// src/app/onboarding.tsx
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { useOnboardingControls, ONBOARDING_KEY } from '@/hooks/useOnboardingControls';

// Re-export so _layout.tsx import path remains unchanged
export { ONBOARDING_KEY };

const SCREEN_WIDTH = Dimensions.get('window').width;

// Per-slide visual config: gradient and emoji glow colour
const SLIDE_CONFIG = [
  {
    emoji: '🌸',
    gradientColors: ['#e8f0e8', '#f5f4f1'] as const,
    glowColor: 'rgba(159,182,159,0.18)',
  },
  {
    emoji: '📷',
    gradientColors: ['#f5ede0', '#f5f4f1'] as const,
    glowColor: 'rgba(210,160,90,0.15)',
  },
  {
    emoji: '🗺️',
    gradientColors: ['#e0eaf5', '#f5f4f1'] as const,
    glowColor: 'rgba(100,140,190,0.15)',
  },
] as const;

export default function OnboardingScreen() {
  const { t } = useTranslation();

  const slides = [
    { title: t('onboarding.slide1Title'), body: t('onboarding.slide1Body') },
    { title: t('onboarding.slide2Title'), body: t('onboarding.slide2Body') },
    { title: t('onboarding.slide3Title'), body: t('onboarding.slide3Body') },
  ];

  const { page, scrollRef, slideAnims, dotAnim, goNext, goBack, finish, onSwipeEnd } =
    useOnboardingControls(slides.length);

  const isLast = page === slides.length - 1;

  return (
    <View style={styles.container}>
      {/* Header: Skip (left) | Step counter (right) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={finish}
          style={[styles.skipBtn, isLast && styles.invisible]}
          disabled={isLast}
        >
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>{page + 1} / {slides.length}</Text>
      </View>

      {/* Slide pager with gradient backgrounds */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onSwipeEnd}
        style={styles.pager}
      >
        {slides.map((slide, i) => {
          const config = SLIDE_CONFIG[i];
          const anim = slideAnims[i];
          // Both opacity and translateY driven by the same Animated.Value (0→1)
          const opacity = anim;
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          });

          return (
            <LinearGradient
              key={i}
              colors={config.gradientColors}
              style={styles.slide}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            >
              <Animated.View
                style={[styles.slideContent, { opacity, transform: [{ translateY }] }]}
              >
                {/* Emoji inside coloured glow circle */}
                <View style={[styles.emojiCircle, { backgroundColor: config.glowColor }]}>
                  <Text style={styles.slideEmoji}>{config.emoji}</Text>
                </View>
                <Text style={styles.slideTitle}>{slide.title}</Text>
                <Text style={styles.slideBody}>{slide.body}</Text>
              </Animated.View>
            </LinearGradient>
          );
        })}
      </ScrollView>

      {/* Dot indicators — animated width + colour.
          Conscious simplification of the spec's two-layer approach: the inactive colour
          (colors.border) is the static base background — no inverse opacity animation needed
          since the base is always visible. Only the active overlay fades in/out.
          ±0.5 input range: both dots narrow at midpoint of transition (intentional). */}
      <View style={styles.dots}>
        {slides.map((_, i) => {
          const dotWidth = dotAnim.interpolate({
            inputRange: [i - 0.5, i, i + 0.5],
            outputRange: [6, 20, 6],
            extrapolate: 'clamp',
          });
          const activeOpacity = dotAnim.interpolate({
            inputRange: [i - 0.5, i, i + 0.5],
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });

          return (
            // Static border-color base; active sage-green overlay fades in on top
            <Animated.View
              key={i}
              style={[styles.dotBase, { width: dotWidth, backgroundColor: colors.border }]}
            >
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  { borderRadius: 3, backgroundColor: colors.plantPrimary, opacity: activeOpacity },
                ]}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* Footer: Back (left) | Next / Get Started (right) */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={goBack}
          style={[styles.backBtn, page === 0 && styles.invisible]}
          disabled={page === 0}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {isLast ? t('onboarding.start') : t('onboarding.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
  },

  // Header row
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.sm,
  },
  skipBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minWidth: 72,
  },
  skipText: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  counter:  { color: colors.textSecondary, fontSize: typography.fontSize.sm },

  // Slide pager
  pager: { flex: 1 },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emojiCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideEmoji:  { fontSize: 52 },
  slideTitle:  {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
    color: colors.text,
    textAlign: 'center',
  },
  slideBody:   {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * 1.7,
  },

  // Dot indicators
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
  },
  dotBase: { height: 6, borderRadius: 3, overflow: 'hidden' },

  // Footer row
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  nextBtn: {
    backgroundColor: colors.plantPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  nextText: {
    color: colors.white,
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
  },

  // Shared utility
  invisible: { opacity: 0 }, // hides element without removing from layout
});
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit 2>&1
```

Expected: no output (zero errors).

- [ ] **Step 3: Run full test suite**

```bash
npx jest --no-coverage 2>&1 | tail -5
```

Expected:
```
Test Suites: 17 passed, 17 total
Tests:       178 passed, 178 total
```

- [ ] **Step 4: Commit**

```bash
git add src/app/onboarding.tsx
git commit -m "feat: polish onboarding — gradient slides, animations, haptic, swipe, back nav"
```

---

### Task 5: Manual verification checklist

Run the iOS simulator:

```bash
npx expo start --ios
```

In the simulator, navigate to the onboarding screen (delete the app to reset SecureStore, or temporarily disable the `onboarding_done_v1` guard in `_layout.tsx` for testing).

- [ ] **Slide 1** — green gradient background visible; 🌸 inside sage-green glow circle; title + body fade in from below on load
- [ ] **Slide 2** — warm amber gradient; 📷 inside amber glow circle; content animates in on transition
- [ ] **Slide 3** — soft blue-grey gradient; 🗺️ inside blue glow circle; content animates in
- [ ] **Dot indicators** — active dot is wide (20px, sage green); inactive dots narrow (6px, border grey); transition is smooth not instant
- [ ] **Step counter** — shows "1 / 3", "2 / 3", "3 / 3" correctly; always visible
- [ ] **Skip button** — visible on Slides 1–2; invisible (but space preserved, no layout shift) on Slide 3
- [ ] **Next button** — shows "次へ" on Slides 1–2; shows "はじめる 🌱" on Slide 3
- [ ] **Back button** — invisible on Slide 1; visible on Slides 2–3; pressing it goes back correctly
- [ ] **Swipe navigation** — left/right swipe changes slide; animations and haptic fire on swipe
- [ ] **No double animation** — tapping Next button does NOT trigger a second animation from `onMomentumScrollEnd`
- [ ] **Haptic** — test on physical device: Light impact fires on every Next, Back, Skip, and Get Started tap; also fires on swipe completion
- [ ] **Get Started** — marks onboarding complete and navigates to discover tab
- [ ] **Skip** — same result as Get Started (navigates to discover, marks done)

- [ ] **Final commit (if any tweaks were needed during manual testing)**

```bash
git add -p  # stage only changed files
git commit -m "fix: onboarding polish tweaks from manual testing"
```
