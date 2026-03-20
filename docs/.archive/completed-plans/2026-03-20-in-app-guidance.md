# In-App Guidance System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-time Coach Mark guidance for Discover, Stamp Editor, Herbarium, and Map tabs, plus a Settings help page that lets users re-view any guide.

**Architecture:** A reusable `CoachMark` component renders a warm-tinted full-screen overlay with a transparent spotlight cutout. A `GuideMeasureContext` collects `onLayout` measurements from target elements. A `GuideWrapper` encapsulates all guide hooks — existing screen files add only JSX wrappers and `onLayout` props (zero new hooks, OTA-safe).

**Tech Stack:** React Native + Expo 55, AsyncStorage, `expo-haptics`, `react-i18next`, existing `shallowRender` test pattern, `jest.fn()` mocks.

---

## File Map

### New files
| Path | Responsibility |
|------|---------------|
| `src/components/guide/GuideMeasureContext.tsx` | Context + `useMeasureContext` hook; stores `onLayout` rects by string key |
| `src/components/guide/CoachMark.tsx` | Full-screen overlay: 4-rect spotlight frame + tooltip card + step dots + button |
| `src/components/guide/GuideWrapper.tsx` | Provides `GuideMeasureContext`; reads `useGuideState`; renders `CoachMark` after delay when not seen |
| `src/components/guide/index.ts` | Barrel: `export { GuideWrapper } from './GuideWrapper'` |
| `src/hooks/useGuideState.ts` | AsyncStorage read/write for `guide_seen_{key}_v1`; returns `{ seen, loading, markSeen, reset }` |
| `src/utils/guide-storage.ts` | `resetGuide(feature)`, `resetAllGuides()` |
| `src/constants/guide-steps.ts` | Step arrays for discover / stamp / herbarium / map features |
| `src/app/guide.tsx` | Settings help page: 4 feature cards + "もう一度見る" + "すべてリセット" |

### Modified files (JSX only — zero new hooks in screen files)
| Path | Change |
|------|--------|
| `src/app/(tabs)/discover.tsx` | Wrap camera section in `<GuideWrapper>`, add `onLayout` to viewfinder View + GPS badge View |
| `src/app/(tabs)/checkin.tsx` | Wrap stamp preview section in `<GuideWrapper>` |
| `src/components/stamps/StampPreview.tsx` | Add `onLayout` to PositionSelector wrapper, StyleSelector wrapper, opacity sliderRow, CTA button |
| `src/app/(tabs)/herbarium.tsx` | Wrap main container in `<GuideWrapper>`, add `onLayout` to progress bar View |
| `src/app/(tabs)/map.tsx` | Wrap main container in `<GuideWrapper>`, add `onLayout` to heatmap toggle + layer toggle |
| `src/app/(tabs)/settings.tsx` | Add 使い方ガイド menu row between Privacy and Version |
| `src/i18n/ja.json` | Add `guide.*` keys |
| `src/i18n/en.json` | Add `guide.*` keys |

### Test files
| Path | Tests |
|------|-------|
| `__tests__/hooks/useGuideState.test.ts` | seen/markSeen/reset cycle with mocked AsyncStorage |
| `__tests__/components/guide/GuideMeasureContext.test.tsx` | register + retrieve measurements |
| `__tests__/components/guide/CoachMark.test.tsx` | tooltip text, step advance, dismiss, last-step button label |
| `__tests__/components/guide/GuideWrapper.test.tsx` | shows coach mark when not seen, hides when seen |

---

## Task 1: useGuideState hook

**Files:**
- Create: `src/hooks/useGuideState.ts`
- Create: `__tests__/hooks/useGuideState.test.ts`

- [ ] **Step 1.1: Write failing tests**

```typescript
// __tests__/hooks/useGuideState.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...args: any[]) => mockGetItem(...args),
  setItem: (...args: any[]) => mockSetItem(...args),
  removeItem: (...args: any[]) => mockRemoveItem(...args),
}));

// Must import after mocks
let useGuideState: (key: string) => any;

beforeAll(async () => {
  const mod = await import('@/hooks/useGuideState');
  useGuideState = mod.useGuideState;
});

describe('useGuideState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('seen=false when AsyncStorage returns null', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const React = await import('react');
    const { renderHook, act } = await import('@testing-library/react-hooks');
    const { result, waitForNextUpdate } = renderHook(() => useGuideState('discover'));
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.seen).toBe(false);
    expect(mockGetItem).toHaveBeenCalledWith('guide_seen_discover_v1');
  });

  it('seen=true when AsyncStorage returns "1"', async () => {
    mockGetItem.mockResolvedValueOnce('1');
    const { renderHook } = await import('@testing-library/react-hooks');
    const { result, waitForNextUpdate } = renderHook(() => useGuideState('herbarium'));
    await waitForNextUpdate();
    expect(result.current.seen).toBe(true);
  });

  it('markSeen writes to AsyncStorage and sets seen=true', async () => {
    mockGetItem.mockResolvedValueOnce(null);
    mockSetItem.mockResolvedValueOnce(undefined);
    const { renderHook, act } = await import('@testing-library/react-hooks');
    const { result, waitForNextUpdate } = renderHook(() => useGuideState('stamp'));
    await waitForNextUpdate();
    await act(async () => { await result.current.markSeen(); });
    expect(mockSetItem).toHaveBeenCalledWith('guide_seen_stamp_v1', '1');
    expect(result.current.seen).toBe(true);
  });

  it('reset removes key and sets seen=false', async () => {
    mockGetItem.mockResolvedValueOnce('1');
    mockRemoveItem.mockResolvedValueOnce(undefined);
    const { renderHook, act } = await import('@testing-library/react-hooks');
    const { result, waitForNextUpdate } = renderHook(() => useGuideState('map'));
    await waitForNextUpdate();
    await act(async () => { await result.current.reset(); });
    expect(mockRemoveItem).toHaveBeenCalledWith('guide_seen_map_v1');
    expect(result.current.seen).toBe(false);
  });
});
```

- [ ] **Step 1.2: Run to confirm failure**

```bash
cd "D:\projects\Games\gardern\pixel-herbarium"
npx jest __tests__/hooks/useGuideState.test.ts --no-coverage 2>&1 | tail -20
```
Expected: FAIL — `Cannot find module '@/hooks/useGuideState'`

- [ ] **Step 1.3: Implement**

```typescript
// src/hooks/useGuideState.ts
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GuideState {
  seen: boolean;
  loading: boolean;
  markSeen: () => Promise<void>;
  reset: () => Promise<void>;
}

export function useGuideState(key: string): GuideState {
  const storageKey = `guide_seen_${key}_v1`;
  const [seen, setSeen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((val) => setSeen(val === '1'))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storageKey]);

  async function markSeen(): Promise<void> {
    try {
      await AsyncStorage.setItem(storageKey, '1');
      setSeen(true);
    } catch {}
  }

  async function reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(storageKey);
      setSeen(false);
    } catch {}
  }

  return { seen, loading, markSeen, reset };
}
```

- [ ] **Step 1.4: Run tests — expect PASS**

```bash
npx jest __tests__/hooks/useGuideState.test.ts --no-coverage 2>&1 | tail -10
```

- [ ] **Step 1.5: Commit**

```bash
git add src/hooks/useGuideState.ts __tests__/hooks/useGuideState.test.ts
git commit -m "feat(guide): add useGuideState hook with AsyncStorage persistence"
```

---

## Task 2: guide-storage utilities

**Files:**
- Create: `src/utils/guide-storage.ts`
- Create: `__tests__/utils/guide-storage.test.ts`

- [ ] **Step 2.1: Write failing test**

```typescript
// __tests__/utils/guide-storage.test.ts
const mockMultiRemove = jest.fn();
const mockRemoveItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: (...args: any[]) => mockRemoveItem(...args),
  multiRemove: (...args: any[]) => mockMultiRemove(...args),
}));

let resetGuide: (f: string) => Promise<void>;
let resetAllGuides: () => Promise<void>;
let GUIDE_KEYS: readonly string[];

beforeAll(async () => {
  const mod = await import('@/utils/guide-storage');
  resetGuide = mod.resetGuide;
  resetAllGuides = mod.resetAllGuides;
  GUIDE_KEYS = mod.GUIDE_KEYS;
});

describe('guide-storage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resetGuide removes the correct key', async () => {
    mockRemoveItem.mockResolvedValueOnce(undefined);
    await resetGuide('discover');
    expect(mockRemoveItem).toHaveBeenCalledWith('guide_seen_discover_v1');
  });

  it('resetAllGuides removes all 4 keys', async () => {
    mockMultiRemove.mockResolvedValueOnce(undefined);
    await resetAllGuides();
    expect(mockMultiRemove).toHaveBeenCalledWith(expect.arrayContaining([
      'guide_seen_discover_v1', 'guide_seen_stamp_v1',
      'guide_seen_herbarium_v1', 'guide_seen_map_v1',
    ]));
  });
});
```

- [ ] **Step 2.2: Run to confirm failure**

```bash
cd "D:\projects\Games\gardern\pixel-herbarium"
npx jest __tests__/utils/guide-storage.test.ts --no-coverage 2>&1 | tail -10
```

- [ ] **Step 2.3: Implement**

```typescript
// src/utils/guide-storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const GUIDE_KEYS = [
  'guide_seen_discover_v1',
  'guide_seen_stamp_v1',
  'guide_seen_herbarium_v1',
  'guide_seen_map_v1',
] as const;

export async function resetGuide(feature: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`guide_seen_${feature}_v1`);
  } catch {}
}

export async function resetAllGuides(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([...GUIDE_KEYS]);
  } catch {}
}
```

- [ ] **Step 2.4: Run tests — expect PASS**

```bash
npx jest __tests__/utils/guide-storage.test.ts --no-coverage 2>&1 | tail -10
```

- [ ] **Step 2.5: Commit**

```bash
git add src/utils/guide-storage.ts __tests__/utils/guide-storage.test.ts
git commit -m "feat(guide): add resetGuide / resetAllGuides utilities with tests"
```

---

## Task 3: GuideMeasureContext

**Files:**
- Create: `src/components/guide/GuideMeasureContext.tsx`
- Create: `__tests__/components/guide/GuideMeasureContext.test.tsx`

- [ ] **Step 3.1: Write failing tests**

```typescript
// __tests__/components/guide/GuideMeasureContext.test.tsx
import React from 'react';

let GuideMeasureContext: any, GuideMeasureProvider: any, useGuideMeasure: any;

beforeAll(async () => {
  const mod = await import('@/components/guide/GuideMeasureContext');
  GuideMeasureContext = mod.GuideMeasureContext;
  GuideMeasureProvider = mod.GuideMeasureProvider;
  useGuideMeasure = mod.useGuideMeasure;
});

describe('GuideMeasureContext', () => {
  it('provides register and getRect functions', () => {
    const { renderHook } = require('@testing-library/react-hooks');
    const wrapper = ({ children }: any) =>
      React.createElement(GuideMeasureProvider, null, children);
    const { result } = renderHook(() => useGuideMeasure(), { wrapper });
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.getRect).toBe('function');
  });

  it('getRect returns null before registration', () => {
    const { renderHook } = require('@testing-library/react-hooks');
    const wrapper = ({ children }: any) =>
      React.createElement(GuideMeasureProvider, null, children);
    const { result } = renderHook(() => useGuideMeasure(), { wrapper });
    expect(result.current.getRect('unknown.key')).toBeNull();
  });

  it('getRect returns registered rect after register called', () => {
    const { renderHook, act } = require('@testing-library/react-hooks');
    const wrapper = ({ children }: any) =>
      React.createElement(GuideMeasureProvider, null, children);
    const { result } = renderHook(() => useGuideMeasure(), { wrapper });
    const fakeEvent = { nativeEvent: { layout: { x: 10, y: 20, width: 100, height: 50 } } };
    act(() => { result.current.register('discover.viewfinder', fakeEvent as any); });
    expect(result.current.getRect('discover.viewfinder')).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });
});
```

- [ ] **Step 3.2: Run to confirm failure**

```bash
npx jest __tests__/components/guide/GuideMeasureContext.test.tsx --no-coverage 2>&1 | tail -10
```

- [ ] **Step 3.3: Implement**

```tsx
// src/components/guide/GuideMeasureContext.tsx
import React, { createContext, useContext, useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Rect { x: number; y: number; width: number; height: number }

interface GuideMeasureValue {
  register: (key: string, event: LayoutChangeEvent) => void;
  getRect: (key: string) => Rect | null;
}

export const GuideMeasureContext = createContext<GuideMeasureValue>({
  register: () => {},
  getRect: () => null,
});

export function GuideMeasureProvider({ children }: { children: React.ReactNode }) {
  const rects = useRef<Map<string, Rect>>(new Map());

  function register(key: string, event: LayoutChangeEvent) {
    const { x, y, width, height } = event.nativeEvent.layout;
    rects.current.set(key, { x, y, width, height });
  }

  function getRect(key: string): Rect | null {
    return rects.current.get(key) ?? null;
  }

  return (
    <GuideMeasureContext.Provider value={{ register, getRect }}>
      {children}
    </GuideMeasureContext.Provider>
  );
}

export function useGuideMeasure(): GuideMeasureValue {
  return useContext(GuideMeasureContext);
}
```

- [ ] **Step 3.4: Run tests — expect PASS**

```bash
npx jest __tests__/components/guide/GuideMeasureContext.test.tsx --no-coverage 2>&1 | tail -10
```

- [ ] **Step 3.5: Commit**

```bash
git add src/components/guide/GuideMeasureContext.tsx __tests__/components/guide/GuideMeasureContext.test.tsx
git commit -m "feat(guide): add GuideMeasureContext for onLayout-based element measurement"
```

---

## Task 4: CoachMark component

**Files:**
- Create: `src/components/guide/CoachMark.tsx`
- Create: `__tests__/components/guide/CoachMark.test.tsx`

- [ ] **Step 4.1: Write failing tests**

```typescript
// __tests__/components/guide/CoachMark.test.tsx
import React from 'react';

jest.mock('@/constants/theme', () => ({
  colors: {
    white: '#ffffff', text: '#3a3a3a', textSecondary: '#7a7a7a',
    border: '#e8e6e1', plantPrimary: '#9fb69f', background: '#f5f4f1',
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { sm: 13, md: 15, lg: 18 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  borderRadius: { sm: 6, md: 12, lg: 20 },
  shadows: { cardSubtle: { shadowOpacity: 0.05 } },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'guide.next': '次へ',
      'guide.gotIt': 'わかった',
    }[key] ?? key),
  }),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'Light' },
}));

jest.mock('react-native', () => ({
  View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity',
  Animated: { Value: jest.fn(() => ({ _value: 0 })), timing: jest.fn(() => ({ start: jest.fn() })), parallel: jest.fn(() => ({ start: (cb: any) => cb?.() })) },
  StyleSheet: { create: (s: any) => s, absoluteFillObject: {} },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  AccessibilityInfo: { isReduceMotionEnabled: jest.fn().mockResolvedValue(false) },
}));

// Shallow-render helper (same pattern as HanakotobaFlipCard tests)
function shallowRender(el: any, depth = 8): any {
  if (el == null || typeof el !== 'object' || !el.type) return el;
  if (typeof el.type === 'function' && depth > 0)
    return shallowRender(el.type({ ...el.props }), depth - 1);
  return {
    type: typeof el.type === 'string' ? el.type : (el.type?.name ?? 'Unknown'),
    props: { ...el.props, children: undefined },
    children: el.props?.children != null
      ? (Array.isArray(el.props.children)
          ? el.props.children.map((c: any) => shallowRender(c, depth))
          : shallowRender(el.props.children, depth))
      : undefined,
  };
}

let CoachMark: any;
beforeAll(async () => {
  const mod = await import('@/components/guide/CoachMark');
  CoachMark = mod.CoachMark;
});

const mockSteps = [
  { targetKey: 'discover.viewfinder', body: 'guide.discover.step1', icon: '📸' },
  { targetKey: 'discover.gpsBadge', body: 'guide.discover.step2', icon: '📍' },
];

const mockRect = { x: 75, y: 200, width: 240, height: 240 };

describe('CoachMark', () => {
  const baseProps = {
    steps: mockSteps,
    currentStep: 0,
    targetRect: mockRect,
    onNext: jest.fn(),
    onDismiss: jest.fn(),
    visible: true,
  };

  it('renders body text for current step', () => {
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, baseProps)));
    expect(tree).toContain('guide.discover.step1');
  });

  it('renders icon for current step', () => {
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, baseProps)));
    expect(tree).toContain('📸');
  });

  it('shows "次へ" when not on last step', () => {
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, baseProps)));
    expect(tree).toContain('次へ');
  });

  it('shows "わかった" on last step', () => {
    const lastProps = { ...baseProps, currentStep: 1 };
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, lastProps)));
    expect(tree).toContain('わかった');
  });

  it('returns null when visible=false', () => {
    const el = React.createElement(CoachMark, { ...baseProps, visible: false });
    const result = typeof el.type === 'function' ? el.type({ ...el.props }) : null;
    expect(result).toBeNull();
  });

  it('renders step indicator "1 / 2"', () => {
    const tree = JSON.stringify(shallowRender(React.createElement(CoachMark, baseProps)));
    expect(tree).toContain('1');
    expect(tree).toContain('2');
  });
});
```

- [ ] **Step 4.2: Run to confirm failure**

```bash
npx jest __tests__/components/guide/CoachMark.test.tsx --no-coverage 2>&1 | tail -10
```

- [ ] **Step 4.3: Implement CoachMark**

```tsx
// src/components/guide/CoachMark.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Animated, StyleSheet,
  Dimensions, AccessibilityInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius, shadows } from '@/constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');
const SPOTLIGHT_PAD = 8;

export interface CoachStep {
  targetKey?: string;
  targetRect?: { x: number; y: number; width: number; height: number };
  body: string;        // i18n key
  icon?: string;
  position?: 'above' | 'below' | 'auto';
  spotlightPadding?: number;
  spotlightShape?: 'rect' | 'circle';
}

interface CoachMarkProps {
  steps: CoachStep[];
  currentStep: number;
  /** Resolved rect for the current step's target element */
  targetRect: { x: number; y: number; width: number; height: number } | null;
  onNext: () => void;
  onDismiss: () => void;
  visible: boolean;
  overlayVariant?: 'light' | 'dark';
}

export function CoachMark({
  steps, currentStep, targetRect, onNext, onDismiss, visible, overlayVariant = 'light',
}: CoachMarkProps) {
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (!visible) return;
    fadeAnim.setValue(0);
    scaleAnim.setValue(reduceMotion ? 1 : 0.92);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [visible, currentStep, reduceMotion]);

  if (!visible) return null;

  const step = steps[currentStep];
  if (!step) return null;
  const isLast = currentStep === steps.length - 1;

  const pad = step.spotlightPadding ?? SPOTLIGHT_PAD;
  const overlayColor = overlayVariant === 'dark'
    ? 'rgba(80, 74, 70, 0.65)'
    : 'rgba(159, 146, 140, 0.55)';

  // Compute spotlight rect
  const sl = targetRect
    ? { x: targetRect.x - pad, y: targetRect.y - pad, w: targetRect.width + pad * 2, h: targetRect.height + pad * 2 }
    : { x: SW * 0.1, y: SH * 0.35, w: SW * 0.8, h: SW * 0.8 };

  // Four rects that form frame around spotlight
  const top =    { left: 0, top: 0, right: 0, height: sl.y };
  const bottom = { left: 0, top: sl.y + sl.h, right: 0, bottom: 0 };
  const left =   { left: 0, top: sl.y, width: sl.x, height: sl.h };
  const right =  { left: sl.x + sl.w, top: sl.y, right: 0, height: sl.h };

  // Tooltip position
  const tooltipBelow = sl.y + sl.h + 60 < SH * 0.75;
  const tooltipTop = tooltipBelow ? sl.y + sl.h + 16 : sl.y - 16 - 120;

  function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) onDismiss();
    else onNext();
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.root, { opacity: fadeAnim }]}>
      {/* Four-rect frame overlay */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }, top as any]} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }, bottom as any]} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }, left as any]} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor }, right as any]} />

      {/* Tap outside to dismiss */}
      <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onDismiss} activeOpacity={1} />

      {/* Tooltip card */}
      <Animated.View
        style={[styles.tooltip, { top: tooltipTop, transform: [{ scale: scaleAnim }] }]}
        accessibilityRole="alert"
        accessibilityLabel={t(step.body)}
      >
        {step.icon && <Text style={styles.icon}>{step.icon}</Text>}
        <Text style={styles.body}>{t(step.body)}</Text>

        {/* Step dots */}
        <View style={styles.dots} accessibilityLabel={`ステップ ${currentStep + 1}/${steps.length}`}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentStep && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={handleNext}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isLast ? t('guide.gotIt') : t('guide.next')}
        >
          <Text style={styles.btnText}>{isLast ? t('guide.gotIt') : t('guide.next')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 9999 },
  tooltip: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.cardSubtle,
  },
  icon: { fontSize: 24, textAlign: 'center' },
  body: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: typography.fontSize.md * 1.7,
    textAlign: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.plantPrimary },
  btn: {
    backgroundColor: colors.plantPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.white,
    fontWeight: '600',
  },
});
```

- [ ] **Step 4.4: Run tests — expect PASS**

```bash
npx jest __tests__/components/guide/CoachMark.test.tsx --no-coverage 2>&1 | tail -10
```

- [ ] **Step 4.5: Commit**

```bash
git add src/components/guide/CoachMark.tsx __tests__/components/guide/CoachMark.test.tsx
git commit -m "feat(guide): add CoachMark component with warm overlay and spotlight"
```

---

## Task 5: GuideWrapper component

**Files:**
- Create: `src/components/guide/GuideWrapper.tsx`
- Create: `src/components/guide/index.ts`
- Create: `__tests__/components/guide/GuideWrapper.test.tsx`

- [ ] **Step 5.1: Write failing tests**

```typescript
// __tests__/components/guide/GuideWrapper.test.tsx
import React from 'react';

const mockSeen = jest.fn(() => false);
const mockLoading = jest.fn(() => false);
const mockMarkSeen = jest.fn();

jest.mock('@/hooks/useGuideState', () => ({
  useGuideState: (key: string) => ({
    seen: mockSeen(),
    loading: mockLoading(),
    markSeen: mockMarkSeen,
    reset: jest.fn(),
  }),
}));

jest.mock('@/components/guide/GuideMeasureContext', () => ({
  GuideMeasureProvider: ({ children }: any) => children,
  useGuideMeasure: () => ({
    register: jest.fn(),
    getRect: () => ({ x: 10, y: 20, width: 100, height: 50 }),
  }),
}));

jest.mock('@/components/guide/CoachMark', () => ({
  CoachMark: ({ visible, steps, currentStep }: any) =>
    visible ? React.createElement('View', { testID: 'coach-mark', 'data-step': currentStep }) : null,
}));

jest.mock('@/constants/guide-steps', () => ({
  GUIDE_STEPS: {
    discover: [{ targetKey: 'discover.viewfinder', body: 'guide.discover.step1' }],
  },
}));

function shallowRender(el: any, depth = 6): any {
  if (el == null || typeof el !== 'object' || !el.type) return el;
  if (typeof el.type === 'function' && depth > 0)
    return shallowRender(el.type({ ...el.props }), depth - 1);
  return {
    type: typeof el.type === 'string' ? el.type : (el.type?.name ?? 'Unknown'),
    props: { ...el.props, children: undefined },
    children: el.props?.children != null
      ? (Array.isArray(el.props.children)
          ? el.props.children.map((c: any) => shallowRender(c, depth))
          : shallowRender(el.props.children, depth))
      : undefined,
  };
}

let GuideWrapper: any;
beforeAll(async () => {
  const mod = await import('@/components/guide/GuideWrapper');
  GuideWrapper = mod.GuideWrapper;
});

describe('GuideWrapper', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders children', () => {
    mockSeen.mockReturnValue(false);
    mockLoading.mockReturnValue(false);
    const child = React.createElement('View', { testID: 'child' });
    const el = React.createElement(GuideWrapper, { guideKey: 'discover', steps: [] }, child);
    const tree = JSON.stringify(shallowRender(el));
    expect(tree).toContain('child');
  });

  it('renders CoachMark when not seen and not loading', () => {
    mockSeen.mockReturnValue(false);
    mockLoading.mockReturnValue(false);
    const el = React.createElement(GuideWrapper, { guideKey: 'discover', steps: [{ targetKey: 'x', body: 'y' }] });
    const tree = JSON.stringify(shallowRender(el));
    expect(tree).toContain('coach-mark');
  });

  it('does not render CoachMark when already seen', () => {
    mockSeen.mockReturnValue(true);
    mockLoading.mockReturnValue(false);
    const el = React.createElement(GuideWrapper, { guideKey: 'discover', steps: [{ targetKey: 'x', body: 'y' }] });
    const tree = JSON.stringify(shallowRender(el));
    expect(tree).not.toContain('coach-mark');
  });

  it('does not render CoachMark while loading', () => {
    mockSeen.mockReturnValue(false);
    mockLoading.mockReturnValue(true);
    const el = React.createElement(GuideWrapper, { guideKey: 'discover', steps: [{ targetKey: 'x', body: 'y' }] });
    const tree = JSON.stringify(shallowRender(el));
    expect(tree).not.toContain('coach-mark');
  });
});
```

- [ ] **Step 5.2: Run to confirm failure**

```bash
npx jest __tests__/components/guide/GuideWrapper.test.tsx --no-coverage 2>&1 | tail -10
```

- [ ] **Step 5.3: Implement GuideWrapper**

```tsx
// src/components/guide/GuideWrapper.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { GuideMeasureProvider, useGuideMeasure } from './GuideMeasureContext';
import { CoachMark, type CoachStep } from './CoachMark';
import { useGuideState } from '@/hooks/useGuideState';

interface GuideWrapperProps {
  guideKey: string;
  steps: CoachStep[];
  children: React.ReactNode;
  overlayVariant?: 'light' | 'dark';
  /** Delay in ms before showing coach mark (default 0). Useful to let layout settle first. */
  delay?: number;
}

function GuideWrapperInner({ guideKey, steps, children, overlayVariant, delay = 0 }: GuideWrapperProps) {
  const { seen, loading, markSeen } = useGuideState(guideKey);
  const { getRect } = useGuideMeasure();
  const [currentStep, setCurrentStep] = useState(0);
  const [delayPassed, setDelayPassed] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    const timer = setTimeout(() => setDelayPassed(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const showGuide = !loading && !seen && steps.length > 0 && delayPassed;
  const step = steps[currentStep];
  const targetRect = step?.targetKey ? getRect(step.targetKey) : (step?.targetRect ?? null);

  async function handleDismiss() {
    await markSeen();
    setCurrentStep(0);
  }

  return (
    <View style={styles.fill}>
      {children}
      <CoachMark
        steps={steps}
        currentStep={currentStep}
        targetRect={targetRect}
        onNext={() => setCurrentStep((s) => s + 1)}
        onDismiss={handleDismiss}
        visible={showGuide}
        overlayVariant={overlayVariant}
      />
    </View>
  );
}

export function GuideWrapper(props: GuideWrapperProps) {
  return (
    <GuideMeasureProvider>
      <GuideWrapperInner {...props} />
    </GuideMeasureProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
```

```typescript
// src/components/guide/index.ts
export { GuideWrapper } from './GuideWrapper';
export type { CoachStep } from './CoachMark';
```

- [ ] **Step 5.4: Run tests — expect PASS**

```bash
npx jest __tests__/components/guide/GuideWrapper.test.tsx --no-coverage 2>&1 | tail -10
```

- [ ] **Step 5.5: Run all guide tests together**

```bash
npx jest __tests__/components/guide/ __tests__/hooks/useGuideState.test.ts --no-coverage 2>&1 | tail -15
```

- [ ] **Step 5.6: Commit**

```bash
git add src/components/guide/ __tests__/components/guide/GuideWrapper.test.tsx
git commit -m "feat(guide): add GuideWrapper (OTA-safe) with CoachMark orchestration"
```

---

## Task 6: i18n keys and guide-steps constants

**Files:**
- Modify: `src/i18n/ja.json`
- Modify: `src/i18n/en.json`
- Create: `src/constants/guide-steps.ts`

- [ ] **Step 6.1: Add i18n keys to ja.json**

Open `src/i18n/ja.json` and add before the closing `}`:

```json
  "guide": {
    "next": "次へ",
    "gotIt": "わかった",
    "title": "使い方ガイド",
    "viewAgain": "もう一度見る",
    "resetAll": "すべてのガイドをリセット",
    "resetAllDone": "ガイドをリセットしました",
    "discover": {
      "step1": "ここでお花を撮影できます。近づいて、花をフレームの中に合わせてください",
      "step2": "位置情報を使って、どこで花を見つけたか記録します。GPSマークが表示されていれば準備完了です",
      "step3": "シャッターを押して花を識別します。月ごとに撮影回数があるので、大切に使ってください"
    },
    "stamp": {
      "step1": "スタンプの位置を変えられます。お好みの場所をタップしてみてください",
      "step2": "ピクセル、印章、シンプルの3種類からお好きなスタイルを",
      "step3": "透明度を調整して、写真との馴染みを変えられます",
      "step4": "準備ができたら、ここを押して保存とシェアをしましょう"
    },
    "herbarium": {
      "step1": "ここに集めた植物の数が表示されます。全種をコンプリートしましょう",
      "step2": "グレーのマスはまだ見つけていない植物です。タップすると開花時期のヒントが見られます"
    },
    "map": {
      "step1": "熱図ボタンで、この地域の花の分布を見られます。色が濃いほど発見が多い場所です",
      "step2": "レイヤーを切り替えると桜スポットマップを見られます。500m以内に近づくと打卡できます"
    },
    "featureDiscover": "花を識別する",
    "featureDiscoverDesc": "カメラで花を撮影して、AIが植物を識別します。毎月の撮影枠内でお楽しみください。",
    "featureStamp": "打卡カードを作る",
    "featureStampDesc": "チェックインで撮った写真にスタンプを重ねて、オリジナルカードを作りましょう。",
    "featureHerbarium": "図鑑をコンプリートする",
    "featureHerbariumDesc": "発見した植物は図鑑に登録されます。全種の花言葉を集めましょう。",
    "featureMap": "花のマップを見る",
    "featureMapDesc": "近くの花の分布をヒートマップで確認。桜スポットでは500m以内で打卡できます。"
  }
```

Also add to `settings` section:
```json
    "guide": "使い方ガイド",
    "guideSubtitle": "機能の使い方をもう一度確認できます"
```

- [ ] **Step 6.2: Add i18n keys to en.json** (same structure, English text)

```json
  "guide": {
    "next": "Next",
    "gotIt": "Got it",
    "title": "Usage Guide",
    "viewAgain": "View again",
    "resetAll": "Reset all guides",
    "resetAllDone": "Guides have been reset",
    "discover": {
      "step1": "You can photograph flowers here. Get close and align the flower within the frame",
      "step2": "Your location is recorded with each discovery. When you see the GPS mark, you're ready",
      "step3": "Press the shutter to identify a flower. You have a monthly quota, so use it wisely"
    },
    "stamp": {
      "step1": "You can change the stamp position. Tap your preferred location",
      "step2": "Choose from pixel, seal, or minimal stamp styles",
      "step3": "Adjust transparency to blend the stamp with your photo",
      "step4": "When you're happy, tap here to save and share"
    },
    "herbarium": {
      "step1": "This shows how many plants you've collected. Try to complete all species",
      "step2": "Grey cells are undiscovered plants. Tap one to see a bloom season hint"
    },
    "map": {
      "step1": "Toggle the heatmap to see flower distribution. Darker colors mean more discoveries",
      "step2": "Switch layers to see sakura spots. You can check in when within 500m"
    },
    "featureDiscover": "Identify Flowers",
    "featureDiscoverDesc": "Photograph flowers with the camera and let AI identify the plant. Enjoy within your monthly quota.",
    "featureStamp": "Create Check-in Cards",
    "featureStampDesc": "Overlay stamps on your check-in photos to create original cards.",
    "featureHerbarium": "Complete the Herbarium",
    "featureHerbariumDesc": "Discovered plants are added to your herbarium. Collect all flower meanings.",
    "featureMap": "Explore the Flower Map",
    "featureMapDesc": "See nearby flower distribution on a heatmap. Check in at sakura spots within 500m."
  }
```

Also add to `settings` section: `"guide": "Usage Guide"` and `"guideSubtitle": "Review how to use each feature"`

- [ ] **Step 6.3: Create guide-steps.ts**

```typescript
// src/constants/guide-steps.ts
import type { CoachStep } from '@/components/guide';

export const DISCOVER_STEPS: CoachStep[] = [
  { targetKey: 'discover.viewfinder', body: 'guide.discover.step1', icon: '📸', spotlightShape: 'circle' },
  { targetKey: 'discover.gpsBadge',   body: 'guide.discover.step2', icon: '📍' },
  { targetKey: 'discover.capture',    body: 'guide.discover.step3', icon: '🌸' },
];

export const STAMP_STEPS: CoachStep[] = [
  { targetKey: 'stamp.positionGrid',   body: 'guide.stamp.step1', icon: '📐' },
  { targetKey: 'stamp.styleSelector', body: 'guide.stamp.step2', icon: '🎨' },
  { targetKey: 'stamp.opacitySlider', body: 'guide.stamp.step3', icon: '🔅' },
  { targetKey: 'stamp.saveButton',    body: 'guide.stamp.step4', icon: '✨' },
];

export const HERBARIUM_STEPS: CoachStep[] = [
  { targetKey: 'herbarium.progressBar', body: 'guide.herbarium.step1', icon: '📊' },
  { targetKey: 'herbarium.lockedCell',  body: 'guide.herbarium.step2', icon: '🔒' },
];

export const MAP_STEPS: CoachStep[] = [
  { targetKey: 'map.heatmapToggle', body: 'guide.map.step1', icon: '🗺️' },
  { targetKey: 'map.layerToggle',   body: 'guide.map.step2', icon: '🌸' },
];
```

- [ ] **Step 6.4: Commit**

```bash
git add src/i18n/ja.json src/i18n/en.json src/constants/guide-steps.ts
git commit -m "feat(guide): add i18n keys and step definitions for all 4 features"
```

---

## Task 7: Integrate into Discover tab

**Files:**
- Modify: `src/app/(tabs)/discover.tsx`

The JSX return section starts at line 150. Strategy: use `MeasuredView` — a thin `<View>` wrapper that calls `useGuideMeasure()` internally. Screen files only swap `<View>` → `<MeasuredView measureKey="...">` (JSX only, zero new hooks in screen files).

- [ ] **Step 7.1: Create MeasuredView**

```tsx
// src/components/guide/MeasuredView.tsx
import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useGuideMeasure } from './GuideMeasureContext';

interface MeasuredViewProps extends ViewProps {
  measureKey: string;
}

export function MeasuredView({ measureKey, ...props }: MeasuredViewProps) {
  const { register } = useGuideMeasure();
  return (
    <View
      {...props}
      onLayout={(e) => {
        register(measureKey, e);
        props.onLayout?.(e);
      }}
    />
  );
}
```

Update `src/components/guide/index.ts`:

```typescript
export { GuideWrapper } from './GuideWrapper';
export { MeasuredView } from './MeasuredView';
export type { CoachStep } from './CoachMark';
```

- [ ] **Step 7.2: Modify discover.tsx**

Add imports at top (after existing imports):
```typescript
import { GuideWrapper, MeasuredView } from '@/components/guide';
import { DISCOVER_STEPS } from '@/constants/guide-steps';
```

Wrap outer container (around line 150–152):
```tsx
// Change:
return (
  <ErrorBoundary fallbackLabel={t('discover.cameraError')}>
  <View style={styles.container}>

// To:
return (
  <ErrorBoundary fallbackLabel={t('discover.cameraError')}>
  <GuideWrapper guideKey="discover" steps={DISCOVER_STEPS} overlayVariant="dark">
  <View style={styles.container}>
```

Close the GuideWrapper before `</ErrorBoundary>`:
```tsx
// Before:
    </View>
    {showModal && ...}
  </ErrorBoundary>

// After (closing GuideWrapper):
    </View>
  </GuideWrapper>
  {showModal && ...}
  </ErrorBoundary>
```

Replace GPS badge `<View style={styles.gpsBadge}>` with `<MeasuredView measureKey="discover.gpsBadge" style={styles.gpsBadge}>`.

Wrap the viewfinder component with a `MeasuredView`:
```tsx
// Change:
<ViewfinderFrame isReady={...} />

// To:
<MeasuredView measureKey="discover.viewfinder" style={styles.viewfinderWrapper}>
  <ViewfinderFrame isReady={...} />
</MeasuredView>
```

Add `viewfinderWrapper: { alignItems: 'center', justifyContent: 'center' }` to styles (or use existing container style).

Note: `discover.capture` testID already exists on the capture button (line 195).

- [ ] **Step 7.3: Verify no new hooks**

```bash
cd "D:\projects\Games\gardern\pixel-herbarium"
git diff src/app/\(tabs\)/discover.tsx | grep "^+" | grep -E "use[A-Z]" | grep -v "useTranslation\|useCapture\|useDiscovery\|useAuthStore\|useHerbariumStore"
```
Expected: empty output (no new hooks)

- [ ] **Step 7.4: Run existing discover tests**

```bash
npx jest __tests__/screens/DiscoverScreen.test.tsx --no-coverage 2>&1 | tail -10
```
Expected: PASS (same as before)

- [ ] **Step 7.5: Commit**

```bash
git add src/app/\(tabs\)/discover.tsx src/components/guide/MeasuredView.tsx src/components/guide/index.ts
git commit -m "feat(guide): integrate discover guide — GuideWrapper + MeasuredView targets"
```

---

## Task 8: Integrate into Stamp Editor

**Files:**
- Modify: `src/app/(tabs)/checkin.tsx`
- Modify: `src/components/stamps/StampPreview.tsx`

- [ ] **Step 8.1: Wrap StampPreview in checkin.tsx**

In checkin.tsx, find the `{step === 'preview' && ...}` block (around line 195). Wrap just the `<StampPreview .../>` component:

```tsx
// Add import at top:
import { GuideWrapper } from '@/components/guide';
import { STAMP_STEPS } from '@/constants/guide-steps';

// Wrap StampPreview:
<GuideWrapper guideKey="stamp" steps={STAMP_STEPS}>
  <StampPreview ... />
</GuideWrapper>
```

- [ ] **Step 8.2: Add MeasuredView targets in StampPreview.tsx**

Add import at top of StampPreview.tsx:
```typescript
import { MeasuredView } from '@/components/guide';
```

Replace the `PositionSelector` wrapper:
```tsx
// Change: <PositionSelector .../>  (already inside photoContainer)
// Wrap with:
<MeasuredView measureKey="stamp.positionGrid">
  <PositionSelector ... />
</MeasuredView>
```

Replace the `<StyleSelector .../>` wrapper:
```tsx
<MeasuredView measureKey="stamp.styleSelector">
  <StyleSelector ... />
</MeasuredView>
```

Replace the opacity `<View style={styles.sliderRow}>`:
```tsx
<MeasuredView measureKey="stamp.opacitySlider" style={styles.sliderRow}>
  {/* opacity slider contents */}
</MeasuredView>
```

Replace the CTA `<TouchableOpacity ...>` — wrap it:
```tsx
<MeasuredView measureKey="stamp.saveButton">
  <TouchableOpacity ... >
    ...
  </TouchableOpacity>
</MeasuredView>
```

- [ ] **Step 8.3: Verify no new hooks in screen files**

```bash
git diff src/app/\(tabs\)/checkin.tsx | grep "^+" | grep -E "use[A-Z]"
```
Expected: empty (only `import` lines, no new hook calls)

- [ ] **Step 8.4: Run existing stamp tests**

```bash
npx jest __tests__/components/stamps/StampPreview.test.tsx --no-coverage 2>&1 | tail -10
```
Expected: PASS

- [ ] **Step 8.5: Commit**

```bash
git add src/app/\(tabs\)/checkin.tsx src/components/stamps/StampPreview.tsx
git commit -m "feat(guide): integrate stamp editor guide — wrap StampPreview + MeasuredView targets"
```

---

## Task 9: Integrate into Herbarium tab

**Files:**
- Modify: `src/app/(tabs)/herbarium.tsx`

- [ ] **Step 9.1: Add imports and wrap**

Add at top:
```typescript
import { GuideWrapper, MeasuredView } from '@/components/guide';
import { HERBARIUM_STEPS } from '@/constants/guide-steps';
```

In the main `return` (around line 74), wrap the outer `<View style={styles.container}>`:
```tsx
return (
  <GuideWrapper guideKey="herbarium" steps={HERBARIUM_STEPS}>
    <View style={styles.container}>
      ...
    </View>
  </GuideWrapper>
);
```

Find the progress bar View (in the header section after `headerRight` — look for the progress track View). Wrap it:
```tsx
<MeasuredView measureKey="herbarium.progressBar" style={styles.progressTrack}>
  <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
</MeasuredView>
```

Also add `onLayout` on the first locked cell in the FlatList's `renderItem` — but only the first locked cell needs measuring. Add a `onLayout` prop to the locked cell view conditionally:
```tsx
// In renderItem, if it's the first locked cell:
const isFirstLocked = !collected.has(item.id) && item.id === firstLockedId;
// Then:
<MeasuredView
  measureKey="herbarium.lockedCell"
  style={...}
  // Only register first locked cell
>
```

To find `firstLockedId`, compute it once from `filteredPlants` — this is a simple derived value from existing state, no new hook needed.

- [ ] **Step 9.2: Verify no new hooks**

```bash
git diff src/app/\(tabs\)/herbarium.tsx | grep "^+" | grep -E "use[A-Z]" | grep -v "useRouter\|useTranslation\|useHerbarium\|useHerbariumFilter\|useAuthStore\|useSpotStore"
```

- [ ] **Step 9.3: Run existing herbarium tests**

```bash
npx jest __tests__/screens/HerbariumScreen.test.tsx --no-coverage 2>&1 | tail -10
```

- [ ] **Step 9.4: Commit**

```bash
git add src/app/\(tabs\)/herbarium.tsx
git commit -m "feat(guide): integrate herbarium guide — GuideWrapper + progress bar target"
```

---

## Task 10: Integrate into Map tab

**Files:**
- Modify: `src/app/(tabs)/map.tsx`

- [ ] **Step 10.1: Add imports and wrap**

Add at top:
```typescript
import { GuideWrapper, MeasuredView } from '@/components/guide';
import { MAP_STEPS } from '@/constants/guide-steps';
```

Wrap the `<View style={styles.container}>` inside `<ErrorBoundary>` (line 134) with `<GuideWrapper guideKey="map" steps={MAP_STEPS}>`.

**Layer toggle** (line 137 — `<View style={styles.layerToggle}>`): this View wraps two layer buttons. Replace it with `<MeasuredView measureKey="map.layerToggle" style={styles.layerToggle}>` (and its closing tag):
```tsx
// Change:
<View style={styles.layerToggle}>
  <TouchableOpacity ... onPress={() => setMapLayer('discoveries')}>...</TouchableOpacity>
  <TouchableOpacity ... onPress={() => setMapLayer('spots')}>...</TouchableOpacity>
</View>

// To:
<MeasuredView measureKey="map.layerToggle" style={styles.layerToggle}>
  <TouchableOpacity ... onPress={() => setMapLayer('discoveries')}>...</TouchableOpacity>
  <TouchableOpacity ... onPress={() => setMapLayer('spots')}>...</TouchableOpacity>
</MeasuredView>
```

**Heatmap toggle** (line 153 — `<TouchableOpacity onPress={() => setShowHeatmap(v => !v)}>`): this button has NO outer wrapping View. Wrap it with `MeasuredView`:
```tsx
// Change:
<TouchableOpacity
  onPress={() => setShowHeatmap(v => !v)}
  style={[styles.refreshButton, showHeatmap && styles.toggleActive]}
>
  <Text style={styles.refreshText}>
    {showHeatmap ? t('map.togglePoints') : t('map.toggleHeatmap')}
  </Text>
</TouchableOpacity>

// To:
<MeasuredView measureKey="map.heatmapToggle">
  <TouchableOpacity
    onPress={() => setShowHeatmap(v => !v)}
    style={[styles.refreshButton, showHeatmap && styles.toggleActive]}
  >
    <Text style={styles.refreshText}>
      {showHeatmap ? t('map.togglePoints') : t('map.toggleHeatmap')}
    </Text>
  </TouchableOpacity>
</MeasuredView>
```

- [ ] **Step 10.2: Verify no new hooks**

```bash
git diff src/app/\(tabs\)/map.tsx | grep "^+" | grep -E "use[A-Z]"
```

- [ ] **Step 10.3: Run existing map tests**

```bash
npx jest __tests__/screens/MapScreen.test.tsx --no-coverage 2>&1 | tail -10
```

- [ ] **Step 10.4: Commit**

```bash
git add src/app/\(tabs\)/map.tsx
git commit -m "feat(guide): integrate map guide — GuideWrapper + heatmap/layer targets"
```

---

## Task 11: Settings help page

**Files:**
- Modify: `src/app/(tabs)/settings.tsx`
- Create: `src/app/guide.tsx`

- [ ] **Step 11.1: Add menu row to settings.tsx**

After the Privacy row (line 59–65) and before the Version row (line 68), insert:

```tsx
{/* Usage guide */}
<TouchableOpacity
  testID="settings.guide"
  style={styles.menuRow}
  onPress={() => router.push('/guide' as any)}
>
  <Text style={styles.menuText}>{t('settings.guide')}</Text>
  <Text style={styles.menuArrow}>›</Text>
</TouchableOpacity>
```

- [ ] **Step 11.2: Create guide.tsx**

```tsx
// src/app/guide.tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { resetGuide, resetAllGuides } from '@/utils/guide-storage';
import { colors, typography, spacing, borderRadius, shadows } from '@/constants/theme';

const FEATURES = [
  { key: 'discover',  tab: '/(tabs)/discover',  icon: '📸' },
  { key: 'stamp',     tab: '/(tabs)/checkin',   icon: '🎨' },
  { key: 'herbarium', tab: '/(tabs)/herbarium', icon: '📊' },
  { key: 'map',       tab: '/(tabs)/map',       icon: '🗺️' },
] as const;

export default function GuidePage() {
  const { t } = useTranslation();
  const router = useRouter();

  async function handleViewAgain(feature: string, tab: string) {
    await resetGuide(feature);
    router.replace(tab as any);
  }

  async function handleResetAll() {
    await resetAllGuides();
    Alert.alert('', t('guide.resetAllDone'));
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('guide.title')}</Text>
      {FEATURES.map(({ key, tab, icon }) => (
        <View key={key} style={styles.card}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{t(`guide.feature${key.charAt(0).toUpperCase() + key.slice(1)}`)}</Text>
            <Text style={styles.cardDesc}>{t(`guide.feature${key.charAt(0).toUpperCase() + key.slice(1)}Desc`)}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAgainBtn}
            onPress={() => handleViewAgain(key, tab)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAgainText}>{t('guide.viewAgain')}</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.resetBtn} onPress={handleResetAll} activeOpacity={0.8}>
        <Text style={styles.resetText}>{t('guide.resetAll')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.cardSubtle,
  },
  cardIcon: { fontSize: 28, textAlign: 'center' },
  cardBody: { gap: spacing.xs },
  cardTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    color: colors.text,
  },
  cardDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.7,
  },
  viewAgainBtn: {
    borderWidth: 1.5,
    borderColor: colors.plantPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  viewAgainText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    color: colors.plantPrimary,
  },
  resetBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resetText: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
});
```

- [ ] **Step 11.3: Commit**

```bash
git add src/app/guide.tsx src/app/\(tabs\)/settings.tsx
git commit -m "feat(guide): add Settings help page and 使い方ガイド menu entry"
```

---

## Task 12: Full test run and OTA safety verification

- [ ] **Step 12.1: Run full test suite**

```bash
cd "D:\projects\Games\gardern\pixel-herbarium"
npx jest --no-coverage 2>&1 | tail -20
```
Expected: All suites pass. Count should be ≥ 62 suites (58 existing + 4 new guide suites).

- [ ] **Step 12.2: Verify zero new hooks in screen files**

```bash
git diff HEAD~6 -- src/app/\(tabs\)/discover.tsx src/app/\(tabs\)/checkin.tsx src/app/\(tabs\)/herbarium.tsx src/app/\(tabs\)/map.tsx | grep "^+" | grep -E "\buse[A-Z][a-zA-Z]+\(" | grep -v "useTranslation\|useRouter\|useCapture\|useDiscovery\|useAuthStore\|useHerbariumStore\|useHerbarium\|useHerbariumFilter\|useSpotStore"
```
Expected: empty output

- [ ] **Step 12.3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors

- [ ] **Step 12.4: Final commit**

```bash
git add -A
git commit -m "feat(guide): complete in-app guidance system — 4 features + Settings help page

- CoachMark with warm Adult Kawaii overlay (rgba(159,146,140,0.55))
- GuideWrapper: OTA-safe, zero new hooks in screen files
- GuideMeasureContext: onLayout-based element targeting
- MeasuredView: drop-in <View> replacement for spotlight targets
- useGuideState: AsyncStorage persistence per feature
- guide.tsx: Settings help page with もう一度見る + reset
- 4 guidance sequences: discover(3) / stamp(4) / herbarium(2) / map(2)
- i18n: ja + en, guide.* namespace"
```

---

## Verification Checklist

| Test | Command | Expected |
|------|---------|----------|
| Unit tests | `npx jest --no-coverage` | All pass, ≥62 suites |
| Type check | `npx tsc --noEmit` | No errors |
| OTA safety | Hook diff check (Step 12.2) | Empty output |
| Manual: discover guide | Clear AsyncStorage, open Discover | 3-step coach mark appears |
| Manual: stamp guide | Go to Check-in > take photo > proceed to stamp | 4-step coach mark |
| Manual: herbarium guide | Open Herbarium tab | 2-step coach mark |
| Manual: map guide | Open Map tab | 2-step coach mark |
| Manual: settings | Settings > 使い方ガイド > もう一度見る | Guide replays |
| Manual: reset all | Settings > 使い方ガイド > すべてリセット | All guides replay |
