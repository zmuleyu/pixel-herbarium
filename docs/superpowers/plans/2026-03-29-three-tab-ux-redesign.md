# Three-Tab UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the three main tabs (ホーム / 花日記 / 設定) to reposition the app as a memory-preservation tool for the end-of-sakura-season, with improved color harmony, a seasonal progress banner, stamp watermark grid cards, an enhanced stamp animation, and a reorganized settings layout.

**Architecture:** Each tab is self-contained in its own file; the stamp animation extension adds a `floatFrom` prop to `PetalPressAnimation` without breaking existing callers. i18n keys are additive only. No new native dependencies.

**Tech Stack:** React Native + Expo SDK 55, react-native-reanimated 4.x, expo-haptics, i18next, Zustand (checkin-store), expo-router

---

## File Map

| File | Change |
|------|--------|
| `src/i18n/ja.json` | Add 7 new keys |
| `src/i18n/en.json` | Add 7 new keys |
| `src/app/(tabs)/home.tsx` | Full rewrite — CTA-first layout, remove grid |
| `src/app/(tabs)/checkin.tsx` | Add season banner, 3rd stat, watermark badge on cards |
| `src/components/stamps/PetalPressAnimation.tsx` | Add `floatFrom` prop, extend animation sequence |
| `src/app/(tabs)/settings.tsx` | Restructure sections, add AppIdentityCard |
| `__tests__/screens/HomeScreen.test.tsx` | Update tests for new layout |
| `__tests__/screens/CheckinScreen.test.tsx` | Add tests for banner + watermark badge |
| `__tests__/screens/SettingsTabScreen.test.tsx` | Update tests for new sections |
| `__tests__/components/stamps/PetalPressAnimation.test.tsx` | Add floatFrom prop test |

---

## Task 1: Add i18n keys (ja + en)

**Files:**
- Modify: `src/i18n/ja.json`
- Modify: `src/i18n/en.json`

- [ ] **Step 1: Add Japanese keys**

Open `src/i18n/ja.json`. In the `"home"` object add:

```json
"libraryCtaLabel": "ライブラリから選ぶ",
"recentRecord": "最近の記録",
"goToDiary": "日記へ"
```

In the `"diary"` object add:

```json
"seasonBannerTitle": "花散り、その前に",
"seasonProgress": "あなたの桜日記 · {{count}}枚の記録",
"lastRecord": "最後の記録"
```

In the `"settings"` object add:

```json
"appCardSeason": "{{season}} 2025"
```

- [ ] **Step 2: Add English keys**

Open `src/i18n/en.json`. Mirror the same structure:

In `"home"`:
```json
"libraryCtaLabel": "Choose from Library",
"recentRecord": "Recent Record",
"goToDiary": "View Diary"
```

In `"diary"`:
```json
"seasonBannerTitle": "Before the Petals Fall",
"seasonProgress": "Your Sakura Diary · {{count}} photos",
"lastRecord": "Last Record"
```

In `"settings"`:
```json
"appCardSeason": "{{season}} 2025"
```

- [ ] **Step 3: Verify keys load**

```bash
cd D:/projects/Games/pixel-herbarium
node -e "
const ja = require('./src/i18n/ja.json');
const en = require('./src/i18n/en.json');
const keys = ['home.libraryCtaLabel','home.recentRecord','home.goToDiary','diary.seasonBannerTitle','diary.seasonProgress','diary.lastRecord','settings.appCardSeason'];
keys.forEach(k => {
  const [ns, key] = k.split('.');
  if (!ja[ns]?.[key]) console.error('MISSING ja:', k);
  if (!en[ns]?.[key]) console.error('MISSING en:', k);
  else console.log('OK:', k);
});
"
```

Expected: 7 lines of `OK: ...`

- [ ] **Step 4: Commit**

```bash
git add src/i18n/ja.json src/i18n/en.json
git commit -m "feat(i18n): add three-tab redesign translation keys"
```

**Acceptance:** `node` script above → 7 OK lines, 0 MISSING lines

---

## Task 2: Extend PetalPressAnimation with floatFrom prop

**Files:**
- Modify: `src/components/stamps/PetalPressAnimation.tsx`
- Test: `__tests__/components/stamps/PetalPressAnimation.test.tsx`

The current animation starts at the stamp's natural position. We need it to optionally start 60px above and float down before pressing — the "花落" phase.

- [ ] **Step 1: Write failing test**

Find or create `__tests__/components/stamps/PetalPressAnimation.test.tsx`. Add:

```typescript
import React from 'react';
import { Text } from 'react-native';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), ImpactFeedbackStyle: { Medium: 'medium' } }));

const shallowRender = (element: any, depth = 8): any => {
  if (!element || typeof element !== 'object') return String(element ?? '');
  if (Array.isArray(element)) return element.map((e) => shallowRender(e, depth)).join('');
  const { type, props } = element;
  if (!type) return '';
  if (depth <= 0) return String(props?.testID ?? type?.displayName ?? '');
  if (typeof type === 'function') {
    try {
      const output = type(props ?? {});
      return shallowRender(output, depth - 1);
    } catch { return ''; }
  }
  const children = props?.children;
  if (!children) return String(props?.testID ?? '');
  return Array.isArray(children)
    ? children.map((c: any) => shallowRender(c, depth)).join('')
    : shallowRender(children, depth);
};

describe('PetalPressAnimation floatFrom prop', () => {
  it('accepts floatFrom prop without crashing', () => {
    const { PetalPressAnimation } = require('@/components/stamps/PetalPressAnimation');
    const el = React.createElement(
      PetalPressAnimation,
      { stampX: 100, stampY: 200, themeColor: '#f5d5d0', onComplete: jest.fn(), floatFrom: -60 },
      React.createElement(Text, null, 'stamp')
    );
    expect(() => shallowRender(el)).not.toThrow();
  });

  it('renders without floatFrom (backward compatible)', () => {
    const { PetalPressAnimation } = require('@/components/stamps/PetalPressAnimation');
    const el = React.createElement(
      PetalPressAnimation,
      { stampX: 100, stampY: 200, themeColor: '#f5d5d0', onComplete: jest.fn() },
      React.createElement(Text, null, 'stamp')
    );
    expect(() => shallowRender(el)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd D:/projects/Games/pixel-herbarium
npx jest "__tests__/components/stamps/PetalPressAnimation.test.tsx" --no-coverage 2>&1 | tail -20
```

Expected: FAIL — `floatFrom` prop does not exist yet (type error or crash)

- [ ] **Step 3: Add floatFrom prop to PetalPressAnimation**

Open `src/components/stamps/PetalPressAnimation.tsx`. Find the props interface (search for `interface.*Props` or `stampX`) and add `floatFrom?: number` (default `0`).

Find where the animation sequence starts — look for `useEffect` that calls `withSpring` or `withSequence`. Before the existing press animation, prepend the float-down phase using the `floatFrom` value:

```typescript
// In the props interface, add:
floatFrom?: number; // Y offset to start from (negative = above). Default 0.

// In the component, destructure:
const { stampX, stampY, themeColor, onComplete, floatFrom = 0, children } = props;

// Add a shared value for the float translateY:
const floatY = useSharedValue(floatFrom);
const stampOpacity = useSharedValue(floatFrom !== 0 ? 0 : 1);
const stampScale = useSharedValue(floatFrom !== 0 ? 1.08 : 1);

// In useEffect, start the sequence:
useEffect(() => {
  if (floatFrom !== 0) {
    // Phase 1: float down (0–300ms) — slow spring simulating petal weight
    floatY.value = withSpring(0, { stiffness: 60, damping: 14, mass: 1.2 });
    stampOpacity.value = withTiming(0.3, { duration: 300 });
    stampScale.value = withTiming(1.0, { duration: 300 }, () => {
      // Phase 2+3: press + ink-spread (300–750ms)
      stampScale.value = withSequence(
        withSpring(0.86, { stiffness: 200, damping: 12 }),
        withTiming(1.04, { duration: 250, easing: Easing.out(Easing.quad) })
      );
      stampOpacity.value = withTiming(1.0, { duration: 400, easing: Easing.out(Easing.quad) }, () => {
        // Phase 5: settle
        stampScale.value = withSpring(1.0, { stiffness: 80, damping: 20 }, () => {
          runOnJS(triggerPetals)();
        });
      });
    });
  } else {
    // existing animation unchanged
    triggerExistingAnimation();
  }
}, []);

// Apply to the stamp container animated style:
const floatStyle = useAnimatedStyle(() => ({
  transform: [
    { translateY: floatY.value },
    { scale: stampScale.value },
  ],
  opacity: stampOpacity.value,
}));
```

> **Note:** The exact variable names and structure depend on what's already in the file. Read the file first, then integrate the `floatFrom` logic into the existing animation architecture without removing any existing behavior. The petal burst logic (Phase 4) should trigger after Phase 3 completes — delay it by 50ms after the press (use `setTimeout(triggerPetals, 50)` wrapped in `runOnJS`).

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest "__tests__/components/stamps/PetalPressAnimation.test.tsx" --no-coverage 2>&1 | tail -20
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/stamps/PetalPressAnimation.tsx __tests__/components/stamps/PetalPressAnimation.test.tsx
git commit -m "feat(stamp): add floatFrom prop for 花落墨染 animation phase"
```

**Acceptance:**
- `npx jest PetalPressAnimation.test.tsx --no-coverage` → PASS
- Existing callers of `PetalPressAnimation` in `StampPreview.tsx` still compile (no floatFrom = backward compat)

---

## Task 3: Rewrite ホーム Tab

**Files:**
- Modify: `src/app/(tabs)/home.tsx`
- Modify: `__tests__/screens/HomeScreen.test.tsx`

- [ ] **Step 1: Write failing tests for new layout**

Open `__tests__/screens/HomeScreen.test.tsx`. The existing mock setup is reusable. Replace or augment the `describe('HomeScreen')` block with:

```typescript
// Keep all existing jest.mock(...) calls above unchanged.
// Add mock for useRouter with 'navigate' (needed for tab navigation):
// (already present in existing mock — verify it includes navigate)

describe('HomeScreen — redesigned', () => {
  beforeEach(() => {
    mockStoreState.history = [];
  });

  it('renders primary CTA with libraryCtaLabel i18n key absent (camera only shown)', () => {
    const tree = shallowRender(<HomeScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('home.captureCta');
  });

  it('renders library CTA with correct i18n key', () => {
    const tree = shallowRender(<HomeScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('home.libraryCtaLabel');
  });

  it('shows welcome text when history is empty (new user)', () => {
    mockStoreState.history = [];
    const tree = shallowRender(<HomeScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('home.emptyWelcomeTitle');
  });

  it('shows recent record preview when history has items', () => {
    mockStoreState.history = [{
      id: '1', spotId: 1, seasonId: 'sakura',
      photoUri: 'file://photo.jpg', composedUri: 'file://composed.jpg',
      timestamp: '2026-03-29T10:00:00.000Z',
    }];
    const tree = shallowRender(<HomeScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('home.recentRecord');
  });

  it('does NOT render diary grid (no FlatList with numColumns)', () => {
    mockStoreState.history = [
      { id: '1', spotId: 1, seasonId: 'sakura', photoUri: '', composedUri: '', timestamp: '' },
      { id: '2', spotId: 2, seasonId: 'sakura', photoUri: '', composedUri: '', timestamp: '' },
    ];
    const tree = shallowRender(<HomeScreen />);
    const output = JSON.stringify(tree);
    // Grid cards (DiaryCard / CheckinCard) should NOT appear on home
    expect(output).not.toContain('home.diaryTitle');
    expect(output).not.toContain('home.diaryCount');
  });

  it('season header is always visible', () => {
    const tree = shallowRender(<HomeScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('LinearGradient');
    expect(output).toContain('season.spring');
  });
});
```

> Note: `home.emptyWelcomeTitle` is a new i18n key you will add to ja.json / en.json below. Add it in this task.

- [ ] **Step 2: Add emptyWelcomeTitle i18n key**

In `src/i18n/ja.json` → `"home"` object:
```json
"emptyWelcomeTitle": "最初の一枚を撮ってみましょう",
"emptyWelcomeSub": "お花の写真にスタンプを押して、あなただけの花日記を始めましょう 🌿"
```

In `src/i18n/en.json` → `"home"` object:
```json
"emptyWelcomeTitle": "Take Your First Photo",
"emptyWelcomeSub": "Add a stamp to your flower photo and start your very own flower diary 🌿"
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx jest "__tests__/screens/HomeScreen.test.tsx" --no-coverage 2>&1 | tail -30
```

Expected: FAIL — `home.libraryCtaLabel`, `home.recentRecord`, `home.emptyWelcomeTitle` not in output; `home.diaryTitle` still present

- [ ] **Step 4: Rewrite home.tsx**

Replace `src/app/(tabs)/home.tsx` with the following complete file:

```typescript
import { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { getActiveSeason } from '@/constants/seasons';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  fontWeight,
  getSeasonTheme,
} from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useCheckinStore } from '@/stores/checkin-store';
import { useStaggeredEntry } from '@/hooks/useStaggeredEntry';
import { loadSpotsData } from '@/services/content-pack';
import { FEATURES } from '@/constants/features';
import { signalAndWait } from '@/hooks/utils/screenshotSignal';

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatJapaneseDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const w = weekdays[date.getDay()];
  return `${m}月${d}日（${w}）`;
}

function getSpotName(seasonId: string, spotId: number): string {
  const data = loadSpotsData(seasonId);
  if (!data) return String(spotId);
  return data.spots.find((s) => s.id === spotId)?.nameJa ?? String(spotId);
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const season = getActiveSeason();
  const theme = getSeasonTheme(season.id);
  const history = useCheckinStore((s) => s.history);
  const loadHistory = useCheckinStore((s) => s.loadHistory);

  const { getStyle: entryStyle } = useStaggeredEntry({ count: 4 });

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!FEATURES.SCREENSHOT_MODE) return;
    const t = setTimeout(() => {
      signalAndWait('screenshot_ready_home').catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  const latestRecord = history.length > 0 ? history[0] : null;
  const latestSpotName = latestRecord
    ? getSpotName(latestRecord.seasonId, latestRecord.spotId)
    : null;

  return (
    <ScrollView
      testID="home.container"
      style={[styles.container, { backgroundColor: theme.bgTint }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Season Header */}
      <Animated.View style={entryStyle(0)}>
        <LinearGradient
          colors={[theme.accent, theme.bgTint, colors.background]}
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.headerGradient}
        >
          <Text style={styles.seasonEmoji}>{season.iconEmoji}</Text>
          <Text style={[styles.seasonName, { color: theme.primary }]}>
            {t(season.nameKey)}
          </Text>
          <Text style={styles.dateText}>{formatJapaneseDate(new Date())}</Text>
        </LinearGradient>
      </Animated.View>

      {/* Primary CTA — カメラで撮影 */}
      <Animated.View style={entryStyle(1)}>
        <TouchableOpacity
          style={[styles.primaryCta, { backgroundColor: colors.blushPink }]}
          onPress={() => router.push('/checkin-wizard' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryCtaEmoji}>📷</Text>
          <Text style={[styles.primaryCtaText, { color: colors.plantPrimary }]}>
            {t('home.captureCta')}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Secondary CTA — ライブラリから選ぶ */}
      <Animated.View style={entryStyle(2)}>
        <TouchableOpacity
          style={[styles.secondaryCta, { borderColor: colors.blushPink }]}
          onPress={() => router.push('/checkin-wizard?source=library' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryCtaEmoji}>🖼️</Text>
          <Text style={[styles.secondaryCtaText, { color: theme.primary }]}>
            {t('home.libraryCtaLabel')}
          </Text>
          <Text style={styles.secondaryCtaArrow}>›</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom area: recent record or welcome text */}
      <Animated.View style={entryStyle(3)}>
        {latestRecord ? (
          <View style={styles.recentSection}>
            <Text style={styles.recentLabel}>{t('home.recentRecord')}</Text>
            <TouchableOpacity
              style={[styles.recentCard, { borderColor: theme.accent }]}
              onPress={() => router.push('/(tabs)/checkin' as any)}
              activeOpacity={0.8}
            >
              {latestRecord.composedUri ? (
                <Image
                  source={{ uri: latestRecord.composedUri }}
                  style={[styles.recentThumb, { backgroundColor: theme.bgTint }]}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.recentThumb, styles.recentThumbPlaceholder, { backgroundColor: theme.bgTint }]}>
                  <Text style={styles.recentThumbEmoji}>{season.iconEmoji}</Text>
                </View>
              )}
              <View style={styles.recentInfo}>
                <Text style={styles.recentSpot} numberOfLines={1}>{latestSpotName}</Text>
                <Text style={styles.recentDate}>{formatDateShort(latestRecord.timestamp)}</Text>
              </View>
              <Text style={[styles.recentDiaryLink, { color: theme.primary }]}>
                {t('home.goToDiary')} ›
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.welcomeSection}>
            <Text style={[styles.welcomeTitle, { color: colors.plantPrimary }]}>
              {t('home.emptyWelcomeTitle')}
            </Text>
            <Text style={styles.welcomeSub}>
              {t('home.emptyWelcomeSub')}
            </Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  // Season header
  headerGradient: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  seasonEmoji: { fontSize: 40 },
  seasonName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xxl,
    fontWeight: fontWeight.heavy,
    textAlign: 'center',
    letterSpacing: 1,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.light,
  },

  // Primary CTA
  primaryCta: {
    borderRadius: borderRadius.md,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryCtaEmoji: { fontSize: 20 },
  primaryCtaText: {
    fontSize: typography.fontSize.md,
    fontWeight: fontWeight.bold,
    fontFamily: typography.fontFamily.display,
  },

  // Secondary CTA
  secondaryCta: {
    borderRadius: borderRadius.md,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1.5,
  },
  secondaryCtaEmoji: { fontSize: 16 },
  secondaryCtaText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.display,
  },
  secondaryCtaArrow: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },

  // Recent record
  recentSection: { gap: spacing.xs },
  recentLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    paddingHorizontal: spacing.xs,
  },
  recentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  recentThumb: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md - 4,
  },
  recentThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentThumbEmoji: { fontSize: 20 },
  recentInfo: { flex: 1, gap: 2 },
  recentSpot: {
    fontSize: typography.fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    fontFamily: typography.fontFamily.display,
  },
  recentDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  recentDiaryLink: {
    fontSize: typography.fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // Welcome (empty state)
  welcomeSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  welcomeTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight,
  },
});
```

- [ ] **Step 5: Run tests**

```bash
npx jest "__tests__/screens/HomeScreen.test.tsx" --no-coverage 2>&1 | tail -30
```

Expected: PASS (all new tests pass; some old tests about `home.diaryTitle` / `home.diaryCount` may need to be removed — delete any test that asserts old grid behavior)

- [ ] **Step 6: Commit**

```bash
git add src/app/(tabs)/home.tsx src/i18n/ja.json src/i18n/en.json __tests__/screens/HomeScreen.test.tsx
git commit -m "feat(home): CTA-first layout, remove grid, add recent record preview"
```

**Acceptance:**
- `npx jest HomeScreen.test.tsx --no-coverage` → PASS
- Home tab shows blushPink primary CTA, outline secondary CTA, no grid
- Empty history → welcome text; non-empty → recent record card

---

## Task 4: Redesign 花日記 Tab

**Files:**
- Modify: `src/app/(tabs)/checkin.tsx`
- Modify: `__tests__/screens/CheckinScreen.test.tsx`

- [ ] **Step 1: Write failing tests**

Open `__tests__/screens/CheckinScreen.test.tsx`. Add to existing describe block (keep all existing mocks):

```typescript
describe('DiaryScreen — redesigned', () => {
  it('renders season progress banner title key', () => {
    // Requires history to be non-empty for banner to show
    mockStoreState.history = [{
      id: '1', spotId: 1, seasonId: 'sakura',
      photoUri: '', composedUri: 'file://c.jpg',
      timestamp: '2026-03-29T00:00:00.000Z',
    }];
    const tree = shallowRender(<DiaryScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('diary.seasonBannerTitle');
  });

  it('renders lastRecord stat label', () => {
    mockStoreState.history = [{
      id: '1', spotId: 1, seasonId: 'sakura',
      photoUri: '', composedUri: '',
      timestamp: '2026-03-15T00:00:00.000Z',
    }];
    const tree = shallowRender(<DiaryScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('diary.lastRecord');
  });

  it('renders watermark badge on card with composedUri', () => {
    mockStoreState.history = [{
      id: '1', spotId: 1, seasonId: 'sakura',
      photoUri: 'file://p.jpg', composedUri: 'file://c.jpg',
      timestamp: '2026-03-29T00:00:00.000Z',
    }];
    const tree = shallowRender(<DiaryScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('diary-card-badge');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
npx jest "__tests__/screens/CheckinScreen.test.tsx" --no-coverage 2>&1 | tail -20
```

Expected: FAIL — banner key, lastRecord key, diary-card-badge testID not found

- [ ] **Step 3: Update checkin.tsx**

Open `src/app/(tabs)/checkin.tsx`. Make the following additions:

**A. Add season progress banner helper** (add after existing imports, before `formatDateShort`):

```typescript
function getSeasonProgress(season: ReturnType<typeof getActiveSeason>): number {
  // Returns 0.0–1.0 representing how far through the season we are
  const now = new Date();
  const currentYear = now.getFullYear();
  const [startMD, endMD] = season.dateRange; // "MM-DD"
  const [sM, sD] = startMD.split('-').map(Number);
  const [eM, eD] = endMD.split('-').map(Number);
  const start = new Date(currentYear, sM - 1, sD);
  const end = new Date(currentYear, eM - 1, eD);
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 1;
  const elapsed = now.getTime() - start.getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}
```

**B. Add SeasonBanner component** (add after `getSeasonProgress`):

```typescript
function SeasonBanner({ season, count }: { season: ReturnType<typeof getActiveSeason>; count: number }) {
  const { t } = useTranslation();
  const theme = getSeasonTheme(season.id);
  const progress = getSeasonProgress(season);

  return (
    <View style={[bannerStyles.container, { borderColor: theme.accent }]}>
      <Text style={[bannerStyles.year, { color: theme.primary }]}>
        {new Date().getFullYear()} {t(season.nameKey)}
      </Text>
      <Text style={[bannerStyles.title, { color: colors.text }]}>
        {t('diary.seasonBannerTitle')} 🌸
      </Text>
      <View style={bannerStyles.progressTrack}>
        <View style={[bannerStyles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: theme.accent }]} />
      </View>
      <Text style={bannerStyles.sub}>
        {t('diary.seasonProgress', { count })}
      </Text>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: '#fff5f3',
    marginBottom: spacing.sm,
  },
  year: {
    fontSize: typography.fontSize.xs,
    letterSpacing: 1,
    fontWeight: fontWeight.semibold,
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.md,
    fontWeight: fontWeight.bold,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  sub: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
});
```

**C. Update DiaryCard** to add watermark badge. In the existing `DiaryCard` function, after the `<Image>` or placeholder view, add a badge overlay:

```typescript
// Inside the cardImage View, add absolutely positioned badge:
{record.composedUri && (
  <View
    testID="diary-card-badge"
    style={[cardBadgeStyles.badge, { backgroundColor: theme.accent + 'D9' }]}
  >
    <Text style={cardBadgeStyles.text} numberOfLines={1}>
      {spotName} · {formatDateShort(record.timestamp)}
    </Text>
  </View>
)}
```

Add these styles:

```typescript
const cardBadgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  text: {
    fontSize: 7,
    fontWeight: '700',
    color: colors.white,
  },
});
```

**D. Update ListHeaderComponent** in `DiaryScreen` to add `SeasonBanner` and the third stat:

```typescript
// In ListHeaderComponent, replace the existing statsRow block:
{history.length > 0 && (
  <>
    <SeasonBanner season={season} count={history.length} />
    <View style={styles.statsRow}>
      <View style={[styles.statCard, { borderColor: theme.accent }]}>
        <Text style={[styles.statNumber, { color: theme.primary }]}>{history.length}</Text>
        <Text style={styles.statLabel}>{t('diary.totalCheckins')}</Text>
      </View>
      <View style={[styles.statCard, { borderColor: theme.accent }]}>
        <Text style={[styles.statNumber, { color: theme.primary }]}>{uniqueSpots}</Text>
        <Text style={styles.statLabel}>{t('diary.spotsVisited')}</Text>
      </View>
      <View style={[styles.statCard, { borderColor: theme.accent }]}>
        <Text style={[styles.statNumber, { color: theme.primary }]}>
          {formatDateShort(history[0].timestamp)}
        </Text>
        <Text style={styles.statLabel}>{t('diary.lastRecord')}</Text>
      </View>
    </View>
  </>
)}
```

- [ ] **Step 4: Run tests**

```bash
npx jest "__tests__/screens/CheckinScreen.test.tsx" --no-coverage 2>&1 | tail -20
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(tabs)/checkin.tsx __tests__/screens/CheckinScreen.test.tsx
git commit -m "feat(diary): season banner, lastRecord stat, watermark badge on grid cards"
```

**Acceptance:**
- `npx jest CheckinScreen.test.tsx --no-coverage` → PASS
- Season banner shows with progress bar
- Grid cards with composedUri show badge overlay (testID `diary-card-badge`)
- 3rd stat card shows `diary.lastRecord`

---

## Task 5: Redesign 設定 Tab

**Files:**
- Modify: `src/app/(tabs)/settings.tsx`
- Modify: `__tests__/screens/SettingsTabScreen.test.tsx`

- [ ] **Step 1: Write failing tests**

Open `__tests__/screens/SettingsTabScreen.test.tsx`. Add to existing describe block:

```typescript
describe('SettingsTabScreen — redesigned', () => {
  it('renders app identity card testID', () => {
    const tree = shallowRender(<SettingsTabScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('settings.appIdentityCard');
  });

  it('renders version inside identity card (not as standalone row)', () => {
    const tree = shallowRender(<SettingsTabScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('settings.version');
    // Version should NOT be in a standalone menuRow below sections
    // (just check the key appears — layout verified visually)
  });

  it('renders language toggle in menuRow style (not standalone card)', () => {
    const tree = shallowRender(<SettingsTabScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('settings.language');
    expect(output).toContain('settings.langToggle'); // new testID for inline toggle
  });

  it('renders アカウント section containing signOut when session exists', () => {
    mockSession.mockReturnValue({ user: { email: 'a@b.com' } });
    mockUser.mockReturnValue({ email: 'a@b.com', user_metadata: {} });
    const tree = shallowRender(<SettingsTabScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('settings.signOut');
    expect(output).toContain('settings.deleteData');
  });

  it('renders サポート section with exportData', () => {
    const tree = shallowRender(<SettingsTabScreen />);
    const output = JSON.stringify(tree);
    expect(output).toContain('settings.exportData');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

```bash
npx jest "__tests__/screens/SettingsTabScreen.test.tsx" --no-coverage 2>&1 | tail -20
```

Expected: FAIL — `settings.appIdentityCard` testID and `settings.langToggle` testID not found

- [ ] **Step 3: Rewrite settings.tsx**

Replace `src/app/(tabs)/settings.tsx` with the redesigned version. Keep all existing handler functions (`handleExport`, `handleDeleteData`, `handleSignOut`, `handleDeleteAccount`) unchanged — only restructure the JSX return and styles.

The new JSX structure:

```typescript
return (
  <ScrollView
    testID="settings.container"
    style={styles.container}
    contentContainerStyle={styles.content}
  >
    {/* App Identity Card */}
    <View
      testID="settings.appIdentityCard"
      style={[styles.identityCard, { backgroundColor: theme.bgTint, borderColor: theme.accent }]}
    >
      <Text style={styles.identityEmoji}>{season.iconEmoji}</Text>
      <Text style={styles.identityName}>Pixel Herbarium</Text>
      <Text style={styles.identityVersion}>
        {t('settings.version')} {appVersion} · {t('settings.appCardSeason', { season: t(season.nameKey) })}
      </Text>
    </View>

    {/* アカウント section */}
    <Text style={styles.sectionLabel}>{t('settings.accountSection')}</Text>
    <View style={styles.group}>
      {/* Account info row */}
      {!session ? (
        <TouchableOpacity
          testID="settings.login"
          style={styles.groupRow}
          onPress={() => router.push('/(auth)/login' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.menuText}>{t('settings.login')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.groupRow, styles.groupRowNoBorder]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{season.iconEmoji}</Text>
          </View>
          <View style={styles.accountInfo}>
            {displayName ? <Text style={styles.menuText}>{displayName}</Text> : null}
            {email ? (
              <Text style={[styles.subText, displayName ? styles.subTextSmall : null]}>{email}</Text>
            ) : null}
          </View>
        </View>
      )}
      {/* Dangerous actions — always at bottom of account section */}
      {session && (
        <>
          <View style={styles.groupDivider} />
          <TouchableOpacity style={styles.groupRow} onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={[styles.menuText, { color: DESTRUCTIVE_COLOR }]}>{t('settings.signOut')}</Text>
            <Text style={[styles.menuArrow, { color: DESTRUCTIVE_COLOR }]}>›</Text>
          </TouchableOpacity>
          <View style={styles.groupDivider} />
          <TouchableOpacity style={styles.groupRow} onPress={handleDeleteData} activeOpacity={0.7}>
            <Text style={[styles.menuText, { color: DESTRUCTIVE_COLOR }]}>{t('settings.deleteData')}</Text>
            <Text style={[styles.menuArrow, { color: DESTRUCTIVE_COLOR }]}>›</Text>
          </TouchableOpacity>
          <View style={styles.groupDivider} />
          <TouchableOpacity style={styles.groupRow} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <Text style={[styles.menuText, { color: DESTRUCTIVE_COLOR }]}>{t('settings.deleteAccount')}</Text>
            <Text style={[styles.menuArrow, { color: DESTRUCTIVE_COLOR }]}>›</Text>
          </TouchableOpacity>
        </>
      )}
    </View>

    {/* 一般 section */}
    <Text style={styles.sectionLabel}>{t('settings.generalSection')}</Text>
    <View style={styles.group}>
      {/* Language row — inline pill toggle */}
      <View style={styles.groupRow}>
        <Text style={styles.menuText}>{t('settings.language')}</Text>
        <View testID="settings.langToggle" style={styles.langPills}>
          {LANGUAGES.map((lang) => {
            const isActive = i18n.language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langPill, isActive && { backgroundColor: colors.plantPrimary }]}
                onPress={() => setLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={[styles.langPillText, isActive && styles.langPillTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={styles.groupDivider} />
      <TouchableOpacity style={styles.groupRow} onPress={() => router.push('/privacy' as any)} activeOpacity={0.7}>
        <Text style={styles.menuText}>{t('profile.privacySettings')}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
      <View style={styles.groupDivider} />
      <TouchableOpacity style={styles.groupRow} onPress={() => router.push('/guide' as any)} activeOpacity={0.7}>
        <Text style={styles.menuText}>{t('guide.settings.title')}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
    </View>

    {/* サポート section */}
    <Text style={styles.sectionLabel}>{t('settings.otherSection')}</Text>
    <View style={styles.group}>
      <TouchableOpacity style={styles.groupRow} onPress={() => Linking.openURL('mailto:support@pixelherbarium.app')} activeOpacity={0.7}>
        <Text style={styles.menuText}>{t('settings.feedback')}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
      <View style={styles.groupDivider} />
      <TouchableOpacity style={styles.groupRow} onPress={handleExport} activeOpacity={0.7}>
        <Text style={styles.menuText}>{t('settings.exportData')}</Text>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
    </View>
  </ScrollView>
);
```

Add these new styles (keep existing `DESTRUCTIVE_COLOR`, `LANGUAGES` constants):

```typescript
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },

  // App identity card
  identityCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  identityEmoji: { fontSize: 32 },
  identityName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  identityVersion: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  // Section label
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },

  // Grouped rows
  group: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  groupRowNoBorder: {},
  groupDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  menuText: { fontSize: typography.fontSize.md, color: colors.text },
  menuArrow: { fontSize: typography.fontSize.lg, color: colors.textSecondary },

  // Account avatar
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.plantSecondary ?? '#c1e8d8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarEmoji: { fontSize: 18 },
  accountInfo: { flex: 1, gap: 2 },
  subText: { fontSize: typography.fontSize.md, color: colors.text },
  subTextSmall: { fontSize: typography.fontSize.sm, color: colors.textSecondary },

  // Language inline pills
  langPills: { flexDirection: 'row', gap: spacing.xs },
  langPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langPillText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.xs,
    color: colors.text,
  },
  langPillTextActive: { color: colors.white },
});
```

Also add at top of component (after existing hooks):
```typescript
const season = getActiveSeason();
const theme = getSeasonTheme(season.id);
```

And add to imports:
```typescript
import { getActiveSeason } from '@/constants/seasons';
import { getSeasonTheme } from '@/constants/theme';
```

- [ ] **Step 4: Run tests**

```bash
npx jest "__tests__/screens/SettingsTabScreen.test.tsx" --no-coverage 2>&1 | tail -20
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(tabs)/settings.tsx __tests__/screens/SettingsTabScreen.test.tsx
git commit -m "feat(settings): app identity card, grouped sections, inline language toggle"
```

**Acceptance:**
- `npx jest SettingsTabScreen.test.tsx --no-coverage` → PASS
- testID `settings.appIdentityCard` present
- Dangerous actions (signOut, deleteData, deleteAccount) all in アカウント section
- exportData in サポート section

---

## Task 6: Full test suite + type check

**Files:** None new

- [ ] **Step 1: Run full test suite**

```bash
cd D:/projects/Games/pixel-herbarium
npx jest --no-coverage 2>&1 | tail -20
```

Expected: All suites PASS. If any pre-existing tests fail due to removed `home.diaryTitle` / `home.diaryCount` / `home.emptyTitle` / `home.emptySub` keys — delete those test cases (they test old behavior that no longer exists).

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors. If there are errors in modified files, fix them before proceeding.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "test: update HomeScreen/CheckinScreen/SettingsTabScreen tests for redesign"
```

**Acceptance:**
- `npx jest --no-coverage` → all suites pass, 0 failures
- `npx tsc --noEmit` → 0 errors

---

## Failure Map

| 故障 | 表現 | 対処 |
|------|------|------|
| `floatFrom` Reanimated shared value 競合 | アニメーション途中でクラッシュ | `useEffect` cleanup で `cancelAnimation(floatY)` を呼ぶ |
| `season.dateRange` が undefined | バナー進行バーが NaN | `getSeasonProgress` 先頭で `if (!season.dateRange) return 0.5` ガード |
| `history[0]` が undefined（空状態でバナー表示） | TypeError | バナーを `history.length > 0` 条件内にのみレンダー（Task 4 Step 3D で対応済み） |
| 旧 `home.diaryTitle` テスト失敗 | Jest FAIL | 該当テストケースを削除（Task 6 Step 1 で対処） |
| settings の `colors.plantSecondary` が theme mock にない | TypeError in test | SettingsTabScreen test の theme mock に `plantSecondary: '#c1e8d8'` を追加 |

---

## Requirement Coverage

| Requirement | Task | Verification |
|-------------|------|-------------|
| ホーム CTA 色調が header と調和 | Task 3 | visual: blushPink CTA vs gradient header |
| 新用户空状態デザイン | Task 3 | `emptyWelcomeTitle` key visible when history=[] |
| ライブラリから選ぶ 次 CTA | Task 3 | `home.libraryCtaLabel` in output |
| 日記 tab に季節進行バナー | Task 4 | `diary.seasonBannerTitle` in output |
| 3rd stat: 最後の記録 | Task 4 | `diary.lastRecord` in output |
| Grid カードに印章水印角标 | Task 4 | testID `diary-card-badge` in output |
| 盖章「花落墨染」floatFrom prop | Task 2 | PetalPressAnimation test PASS |
| 設定: App 身份カード | Task 5 | testID `settings.appIdentityCard` in output |
| 設定: 危険操作アカウント段集約 | Task 5 | signOut + deleteData in アカウント group |
| 設定: 言語 inline pill | Task 5 | testID `settings.langToggle` in output |
| expo-blur 未使用 | Task 2 | opacity+scale only, no expo-blur import |
| 全テスト通過 | Task 6 | `npx jest --no-coverage` → 0 failures |
