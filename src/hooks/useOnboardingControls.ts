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
    try {
      await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
    } catch {
      // Write failed — still navigate (worst case: user sees onboarding again)
    }
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
