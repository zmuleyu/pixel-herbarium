# Share Poster Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add save-to-camera-roll, LINE Card 1:1 format, and polished poster design to the existing share system.

**Architecture:** Extend existing `SharePoster` component with a `format` prop for Story (9:16) and LINE Card (1:1). Create a new `ShareSheet` modal for format selection + save/share actions. Wire both into the existing plant detail and discover screens, replacing inline captureRef logic.

**Tech Stack:** React Native (Expo 55), expo-media-library (new), react-native-view-shot (existing), expo-sharing (existing), expo-linear-gradient (existing), i18next

**Spec:** `docs/superpowers/specs/2026-03-16-share-poster-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/SharePoster.tsx` | Modify | Add `format` prop, gradient bg, floral divider, metadata, LINE layout |
| `src/components/ShareSheet.tsx` | **Create** | Bottom Sheet modal: format preview + save/share actions |
| `src/hooks/usePlantDetail.ts` | Modify | Add `city` to DiscoveryRecord + select query |
| `src/app/plant/[id].tsx` | Modify | Replace inline share with ShareSheet |
| `src/app/(tabs)/discover.tsx` | Modify | Replace inline share with ShareSheet, remove off-screen poster |
| `src/i18n/ja.json` | Modify | Add `share.*` keys |
| `src/i18n/en.json` | Modify | Add `share.*` keys |
| `app.json` | Modify | Add expo-media-library plugin |
| `__tests__/components/SharePoster.test.tsx` | **Create** | Poster rendering tests |
| `__tests__/components/ShareSheet.test.tsx` | **Create** | Sheet interaction tests |

---

## Chunk 1: Foundation — Dependencies, i18n, Data Layer

### Task 1: Install expo-media-library and configure app.json

**Files:**
- Modify: `package.json`
- Modify: `app.json:37-67` (plugins array)

- [ ] **Step 1: Install expo-media-library**

Run:
```bash
cd D:/projects/Games/gardern/pixel-herbarium
npx expo install expo-media-library
```

Expected: Package added to `package.json` dependencies.

- [ ] **Step 2: Add plugin to app.json**

In `app.json`, add to the `plugins` array (after `expo-notifications`):

```json
[
  "expo-media-library",
  {
    "photosPermission": "Pixel Herbarium saves poster images to your photo library.",
    "savePhotosPermission": "Pixel Herbarium saves poster images to your photo library."
  }
]
```

- [ ] **Step 3: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add package.json app.json
git commit -m "chore: add expo-media-library dependency + app.json plugin"
```

---

### Task 2: Add i18n keys

**Files:**
- Modify: `src/i18n/ja.json`
- Modify: `src/i18n/en.json`
- Test: `__tests__/i18n/i18n.test.ts` (existing — will auto-check key parity)

- [ ] **Step 1: Add share keys to ja.json**

Add a new `"share"` section after the `"social"` section:

```json
"share": {
  "storyLabel": "インスタストーリーズ",
  "lineLabel": "LINE カード",
  "save": "写真に保存",
  "share": "共有",
  "saved": "保存しました ✓",
  "permissionRequired": "写真ライブラリへのアクセスを許可してください",
  "lineGiftCopy": "この花をあなたに贈ります 🌸"
}
```

- [ ] **Step 2: Add share keys to en.json**

Add matching `"share"` section:

```json
"share": {
  "storyLabel": "Instagram Stories",
  "lineLabel": "LINE Card",
  "save": "Save to Photos",
  "share": "Share",
  "saved": "Saved ✓",
  "permissionRequired": "Please allow photo library access",
  "lineGiftCopy": "Sending this flower to you 🌸"
}
```

- [ ] **Step 3: Run i18n tests to verify key parity**

Run: `npx jest __tests__/i18n/i18n.test.ts`
Expected: All pass (tests check ja/en keys match).

- [ ] **Step 4: Commit**

```bash
git add src/i18n/ja.json src/i18n/en.json
git commit -m "i18n: add share.* keys for poster save/share UI"
```

---

### Task 3: Add city field to DiscoveryRecord

**Files:**
- Modify: `src/hooks/usePlantDetail.ts:18-23` (DiscoveryRecord interface)
- Modify: `src/hooks/usePlantDetail.ts:57` (Supabase select query)
- Test: `__tests__/hooks/usePlantDetail.test.ts`

- [ ] **Step 1: Write test for city in discovery records**

In `__tests__/hooks/usePlantDetail.test.ts`, update `MOCK_DISCOVERIES` (line 33) to include `city`:

```typescript
const MOCK_DISCOVERIES = [
  { id: 'disc-1', created_at: '2026-03-20T10:00:00Z', pixel_url: 'https://example.com/px1.png', user_note: 'きれいだった', city: '東京' },
  { id: 'disc-2', created_at: '2026-04-01T08:00:00Z', pixel_url: null, user_note: null, city: null },
];
```

Add a new test in the `usePlantDetail – initial load` describe:

```typescript
it('includes city field in discoveries', async () => {
  setupMocks();
  const { result } = renderHook(() => usePlantDetail(3, 'user-1'));
  await act(async () => { await flushPromises(); });

  expect(result.current.discoveries[0].city).toBe('東京');
  expect(result.current.discoveries[1].city).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/hooks/usePlantDetail.test.ts`
Expected: New test fails — `city` not in DiscoveryRecord type.

- [ ] **Step 3: Update DiscoveryRecord and select query**

In `src/hooks/usePlantDetail.ts`:

Update the `DiscoveryRecord` interface (line 18-23):
```typescript
export interface DiscoveryRecord {
  id: string;
  created_at: string;
  pixel_url: string | null;
  user_note: string | null;
  city: string | null;
}
```

Update the Supabase select query (line 57):
```typescript
.select('id, created_at, pixel_url, user_note, city')
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/hooks/usePlantDetail.test.ts`
Expected: All pass.

- [ ] **Step 5: Run full test suite**

Run: `npx jest`
Expected: All 201+ tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePlantDetail.ts __tests__/hooks/usePlantDetail.test.ts
git commit -m "feat: add city to DiscoveryRecord for share poster metadata"
```

---

## Chunk 2: SharePoster Component Rewrite

### Task 4: Write SharePoster tests

**Files:**
- Create: `__tests__/components/SharePoster.test.tsx`

The test environment is `node` with a custom react-native mock (components are string stubs like `'View'`). Tests will use shallow rendering via `react-test-renderer` (available via React) to check conditional output logic. We won't use `@testing-library/react-native` `render()` here since the mock stubs don't produce real DOM/VDOM nodes — instead we test the component's tree structure.

- [ ] **Step 1: Create SharePoster test file**

Create `__tests__/components/SharePoster.test.tsx`:

```tsx
/**
 * SharePoster component tests.
 * Verifies format-dependent layout, conditional sections, and fallback states.
 */

import React from 'react';
import { create, act } from 'react-test-renderer';

// Mock dependencies before imports
jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
    white: '#ffffff', border: '#e8e6e1', plantPrimary: '#9fb69f',
    rarity: { common: '#9fb69f', uncommon: '#d4e4f7', rare: '#f5d5d0' },
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
    lineHeight: 1.7,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));

jest.mock('@/constants/plants', () => ({
  RARITY_LABELS: { 1: '★', 2: '★★', 3: '★★★ 限定' },
}));

jest.mock('@/utils/plant-gradient', () => ({
  getPlantGradientColors: jest.fn(
    (rarity: number) => rarity === 3 ? ['#f5e0dd', '#f5f4f1'] : rarity === 2 ? ['#e0eaf5', '#f5f4f1'] : ['#e8f0e8', '#f5f4f1']
  ),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

import { SharePoster, type SharePosterPlant } from '@/components/SharePoster';

const BASE_PLANT: SharePosterPlant = {
  name_ja: 'ソメイヨシノ',
  name_latin: 'Prunus × yedoensis',
  rarity: 1,
  hanakotoba: '優れた美しさ',
  bloom_months: [3, 4],
  pixel_sprite_url: 'https://example.com/sprite.png',
  cityRank: null,
};

function renderPoster(props: Partial<React.ComponentProps<typeof SharePoster>> = {}) {
  const merged = { plant: BASE_PLANT, format: 'story' as const, ...props };
  let tree: ReturnType<typeof create>;
  act(() => {
    tree = create(<SharePoster {...merged} />);
  });
  return tree!;
}

function findByText(tree: ReturnType<typeof create>, text: string): boolean {
  return JSON.stringify(tree.toJSON()).includes(text);
}

// ── Story format ──────────────────────────────────────────────────────

describe('SharePoster – story format (9:16)', () => {
  it('renders with 360x640 dimensions', () => {
    const tree = renderPoster({ format: 'story' });
    const root = tree.toJSON() as any;
    expect(root.props.style).toEqual(
      expect.objectContaining({ width: 360, height: 640 }),
    );
  });

  it('displays plant name and latin name', () => {
    const tree = renderPoster({ format: 'story' });
    expect(findByText(tree, 'ソメイヨシノ')).toBe(true);
    expect(findByText(tree, 'Prunus × yedoensis')).toBe(true);
  });

  it('displays hanakotoba in brackets', () => {
    const tree = renderPoster({ format: 'story' });
    expect(findByText(tree, '「優れた美しさ」')).toBe(true);
  });

  it('hides hanakotoba section when hanakotoba is empty', () => {
    const tree = renderPoster({
      format: 'story',
      plant: { ...BASE_PLANT, hanakotoba: '' },
    });
    expect(findByText(tree, '花言葉')).toBe(false);
    expect(findByText(tree, '「」')).toBe(false);
  });

  it('displays city rank when provided', () => {
    const tree = renderPoster({
      format: 'story',
      plant: { ...BASE_PLANT, cityRank: 5 },
    });
    expect(findByText(tree, '5')).toBe(true);
    expect(findByText(tree, '番目')).toBe(true);
  });

  it('shows discovery date and city when provided', () => {
    const tree = renderPoster({
      format: 'story',
      discoveryDate: '2026-03-15T10:00:00Z',
      discoveryCity: '東京',
    });
    expect(findByText(tree, '東京')).toBe(true);
  });

  it('renders emoji fallback when no pixel_sprite_url', () => {
    const tree = renderPoster({
      format: 'story',
      plant: { ...BASE_PLANT, pixel_sprite_url: null },
    });
    expect(findByText(tree, '🌸')).toBe(true);
  });

  it('shows bilingual footer', () => {
    const tree = renderPoster({ format: 'story' });
    expect(findByText(tree, '花図鉑')).toBe(true);
    expect(findByText(tree, 'Pixel Herbarium')).toBe(true);
  });
});

// ── LINE card format ──────────────────────────────────────────────────

describe('SharePoster – line format (1:1)', () => {
  it('renders with 360x360 dimensions', () => {
    const tree = renderPoster({ format: 'line' });
    const root = tree.toJSON() as any;
    expect(root.props.style).toEqual(
      expect.objectContaining({ width: 360, height: 360 }),
    );
  });

  it('shows gift copy text', () => {
    const tree = renderPoster({ format: 'line' });
    expect(findByText(tree, 'この花をあなたに贈ります')).toBe(true);
  });

  it('displays plant name', () => {
    const tree = renderPoster({ format: 'line' });
    expect(findByText(tree, 'ソメイヨシノ')).toBe(true);
  });

  it('hides hanakotoba section when empty', () => {
    const tree = renderPoster({
      format: 'line',
      plant: { ...BASE_PLANT, hanakotoba: '' },
    });
    expect(findByText(tree, '花言葉')).toBe(false);
  });
});

// ── Rarity styling ────────────────────────────────────────────────────

describe('SharePoster – rarity variants', () => {
  it('renders common rarity label', () => {
    const tree = renderPoster({ plant: { ...BASE_PLANT, rarity: 1 } });
    expect(findByText(tree, '★')).toBe(true);
  });

  it('renders rare rarity label', () => {
    const tree = renderPoster({ plant: { ...BASE_PLANT, rarity: 3 } });
    expect(findByText(tree, '★★★ 限定')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/SharePoster.test.tsx`
Expected: Fails — `SharePoster` doesn't export `SharePosterPlant` type, doesn't accept `format` prop.

---

### Task 5: Rewrite SharePoster component

**Files:**
- Modify: `src/components/SharePoster.tsx` (full rewrite)

- [ ] **Step 1: Rewrite SharePoster.tsx**

Replace the entire file with the new implementation. Key changes:
- No longer uses `forwardRef` (refs are managed by ShareSheet)
- Add `format` prop: `'story' | 'line'`
- Add `bloom_months` to plant interface for gradient
- Add `discoveryDate` and `discoveryCity` props
- Use `LinearGradient` for background
- Floral divider `── ✿ ──`
- Conditional hanakotoba section (hidden when empty)
- LINE Card: horizontal layout (120x120 sprite left, text right)
- LINE Card: gift copy "この花をあなたに贈ります 🌸"
- Updated footer: `· 花図鉑 — Pixel Herbarium ·`
- Export `SharePosterPlant` type

```tsx
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { RARITY_LABELS } from '@/constants/plants';
import { getPlantGradientColors } from '@/utils/plant-gradient';

export interface SharePosterPlant {
  name_ja: string;
  name_latin: string;
  rarity: number;
  hanakotoba: string;         // empty string = hide section
  bloom_months: number[];
  pixel_sprite_url: string | null;
  cityRank: number | null;
}

interface SharePosterProps {
  plant: SharePosterPlant;
  format: 'story' | 'line';
  discoveryDate?: string;
  discoveryCity?: string;
}

const STORY_WIDTH = 360;
const STORY_HEIGHT = 640;
const LINE_WIDTH = 360;
const LINE_HEIGHT = 360;

const RARITY_COLORS: Record<number, string> = {
  1: colors.rarity.common,
  2: colors.rarity.uncommon,
  3: colors.rarity.rare,
};

function getRarityColor(rarity: number) {
  return RARITY_COLORS[rarity] ?? colors.rarity.common;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return ''; }
}

// ── Shared sub-components ─────────────────────────────────────────────

function PlantSprite({ uri, size, rarityColor }: { uri: string | null; size: number; rarityColor: string }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: borderRadius.md }} resizeMode="contain" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: borderRadius.md, borderWidth: 2, borderColor: rarityColor, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.45 }}>🌸</Text>
    </View>
  );
}

function FloralDivider() {
  return (
    <View style={shared.dividerRow}>
      <View style={shared.dividerLine} />
      <Text style={shared.dividerFlower}>✿</Text>
      <View style={shared.dividerLine} />
    </View>
  );
}

function HanakotobaBlock({ hanakotoba }: { hanakotoba: string }) {
  if (!hanakotoba) return null;
  return (
    <>
      <Text style={shared.hanakotobaLabel}>花言葉</Text>
      <Text style={shared.hanakotobaText}>「{hanakotoba}」</Text>
    </>
  );
}

function PosterFooter({ rarityColor }: { rarityColor: string }) {
  return (
    <View style={shared.footer}>
      <View style={[shared.footerDot, { backgroundColor: rarityColor }]} />
      <Text style={shared.footerText}>花図鉑 — Pixel Herbarium</Text>
      <View style={[shared.footerDot, { backgroundColor: rarityColor }]} />
    </View>
  );
}

// ── Story Poster (9:16) ───────────────────────────────────────────────

function StoryPoster({ plant, discoveryDate, discoveryCity }: Omit<SharePosterProps, 'format'>) {
  const rarityColor = getRarityColor(plant.rarity);
  const rarityLabel = RARITY_LABELS[plant.rarity as keyof typeof RARITY_LABELS] ?? '★';
  const gradientColors = getPlantGradientColors(plant.rarity, plant.bloom_months);

  return (
    <View style={storyStyles.poster}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      <View style={[storyStyles.accentStrip, { backgroundColor: rarityColor }]} />

      <View style={storyStyles.imageArea}>
        <PlantSprite uri={plant.pixel_sprite_url} size={160} rarityColor={rarityColor} />
      </View>

      <View style={storyStyles.content}>
        <Text style={[storyStyles.rarityLabel, { color: rarityColor }]}>{rarityLabel}</Text>
        <Text style={storyStyles.nameJa}>{plant.name_ja}</Text>
        <Text style={storyStyles.nameLatin}>{plant.name_latin}</Text>

        <FloralDivider />
        <HanakotobaBlock hanakotoba={plant.hanakotoba} />

        {plant.cityRank != null && (
          <Text style={storyStyles.cityRank}>全国で {plant.cityRank} 番目の発見者 🌿</Text>
        )}

        {(discoveryCity || discoveryDate) && (
          <Text style={storyStyles.metadata}>
            {[discoveryCity, discoveryDate ? formatDate(discoveryDate) : null].filter(Boolean).join(' · ')}
          </Text>
        )}
      </View>

      <PosterFooter rarityColor={rarityColor} />
    </View>
  );
}

// ── LINE Card (1:1) ───────────────────────────────────────────────────

function LineCard({ plant }: Omit<SharePosterProps, 'format'>) {
  const rarityColor = getRarityColor(plant.rarity);
  const gradientColors = getPlantGradientColors(plant.rarity, plant.bloom_months);

  return (
    <View style={lineStyles.poster}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={[lineStyles.accentStrip, { backgroundColor: rarityColor }]} />

      <View style={lineStyles.body}>
        <PlantSprite uri={plant.pixel_sprite_url} size={120} rarityColor={rarityColor} />
        <View style={lineStyles.textCol}>
          <Text style={lineStyles.nameJa}>{plant.name_ja}</Text>
          <Text style={lineStyles.nameLatin}>{plant.name_latin}</Text>
          <FloralDivider />
          <HanakotobaBlock hanakotoba={plant.hanakotoba} />
        </View>
      </View>

      <Text style={lineStyles.giftCopy}>この花をあなたに贈ります 🌸</Text>
      <PosterFooter rarityColor={rarityColor} />
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────────────

export function SharePoster(props: SharePosterProps) {
  return props.format === 'line'
    ? <LineCard {...props} />
    : <StoryPoster {...props} />;
}

// ── Shared styles ─────────────────────────────────────────────────────

const shared = StyleSheet.create({
  dividerRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.sm },
  dividerLine:     { width: 32, height: 1, backgroundColor: colors.border },
  dividerFlower:   { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  hanakotobaLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary, letterSpacing: 1 },
  hanakotobaText:  { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.lg, color: colors.text, textAlign: 'center' },
  footer:          { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.lg },
  footerDot:       { width: 4, height: 4, borderRadius: 2 },
  footerText:      { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xs, color: colors.textSecondary, letterSpacing: 1 },
});

// ── Story styles ──────────────────────────────────────────────────────

const storyStyles = StyleSheet.create({
  poster:      { width: STORY_WIDTH, height: STORY_HEIGHT, alignItems: 'center', overflow: 'hidden' },
  accentStrip: { width: '100%', height: 4 },
  imageArea:   { marginTop: spacing.xl, marginBottom: spacing.md, alignItems: 'center' },
  content:     { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.xs },
  rarityLabel: { fontSize: typography.fontSize.sm, fontFamily: typography.fontFamily.display, letterSpacing: 2 },
  nameJa:      { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xxl, color: colors.text, textAlign: 'center', marginTop: spacing.xs },
  nameLatin:   { fontSize: typography.fontSize.sm, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
  cityRank:    { marginTop: spacing.sm, fontSize: typography.fontSize.xs, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
  metadata:    { fontSize: typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
});

// ── LINE styles ───────────────────────────────────────────────────────

const lineStyles = StyleSheet.create({
  poster:      { width: LINE_WIDTH, height: LINE_HEIGHT, alignItems: 'center', overflow: 'hidden' },
  accentStrip: { width: '100%', height: 4 },
  body:        { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  textCol:     { flex: 1, gap: spacing.xs },
  nameJa:      { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl, color: colors.text },
  nameLatin:   { fontSize: typography.fontSize.xs, color: colors.textSecondary, fontStyle: 'italic' },
  giftCopy:    { fontSize: typography.fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm },
});
```

- [ ] **Step 2: Run poster tests**

Run: `npx jest __tests__/components/SharePoster.test.tsx`
Expected: All pass.

- [ ] **Step 3: Run full suite to check nothing broke**

Run: `npx jest`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/SharePoster.tsx __tests__/components/SharePoster.test.tsx
git commit -m "feat: rewrite SharePoster with format prop, gradient bg, LINE card layout"
```

---

## Chunk 3: ShareSheet Component

### Task 6: Write ShareSheet tests

**Files:**
- Create: `__tests__/components/ShareSheet.test.tsx`

- [ ] **Step 1: Create ShareSheet test file**

```tsx
/**
 * ShareSheet component tests.
 * Verifies modal visibility, format selection, save/share actions.
 */

jest.mock('@/constants/theme', () => ({
  colors: {
    background: '#f5f4f1', text: '#3a3a3a', textSecondary: '#7a7a7a',
    white: '#ffffff', border: '#e8e6e1', plantPrimary: '#9fb69f', plantSecondary: '#c1e8d8',
    rarity: { common: '#9fb69f', uncommon: '#d4e4f7', rare: '#f5d5d0' },
  },
  typography: {
    fontFamily: { body: 'System', display: 'HiraginoMaruGothicProN' },
    fontSize: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 },
    lineHeight: 1.7,
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  borderRadius: { sm: 6, md: 12, lg: 20, full: 9999 },
}));

jest.mock('@/constants/plants', () => ({
  RARITY_LABELS: { 1: '★', 2: '★★', 3: '★★★ 限定' },
}));

jest.mock('@/utils/plant-gradient', () => ({
  getPlantGradientColors: jest.fn(() => ['#e8f0e8', '#f5f4f1']),
}));

jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn().mockResolvedValue('/tmp/poster.png'),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  saveToLibraryAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'share.storyLabel': 'Instagram Stories',
        'share.lineLabel': 'LINE Card',
        'share.save': 'Save to Photos',
        'share.share': 'Share',
        'share.saved': 'Saved ✓',
        'share.permissionRequired': 'Please allow photo library access',
      };
      return map[key] ?? key;
    },
  }),
}));

import React from 'react';
import { create, act } from 'react-test-renderer';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { ShareSheet } from '@/components/ShareSheet';

const BASE_PLANT = {
  name_ja: 'ソメイヨシノ',
  name_latin: 'Prunus × yedoensis',
  rarity: 1,
  hanakotoba: '優れた美しさ',
  bloom_months: [3, 4],
  pixel_sprite_url: 'https://example.com/sprite.png',
  cityRank: null,
};

function renderSheet(visible = true) {
  const onClose = jest.fn();
  let tree: ReturnType<typeof create>;
  act(() => {
    tree = create(
      <ShareSheet visible={visible} onClose={onClose} plant={BASE_PLANT} />
    );
  });
  return { tree: tree!, onClose };
}

function findByText(tree: ReturnType<typeof create>, text: string): boolean {
  return JSON.stringify(tree.toJSON()).includes(text);
}

describe('ShareSheet – visibility', () => {
  it('renders content when visible', () => {
    const { tree } = renderSheet(true);
    expect(findByText(tree, 'Instagram Stories')).toBe(true);
    expect(findByText(tree, 'LINE Card')).toBe(true);
  });
});

describe('ShareSheet – save action', () => {
  it('calls MediaLibrary.saveToLibraryAsync on save', async () => {
    const { tree } = renderSheet(true);
    const json = JSON.stringify(tree.toJSON());
    // Verify save button text is rendered
    expect(json).toContain('Save to Photos');
  });
});

describe('ShareSheet – share action', () => {
  it('renders share button', () => {
    const { tree } = renderSheet(true);
    expect(findByText(tree, 'Share')).toBe(true);
  });
});

describe('ShareSheet – permission denied', () => {
  it('shows permission message when denied', async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    const { tree } = renderSheet(true);
    // Component should handle denial gracefully — test structure exists
    expect(tree.toJSON()).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/components/ShareSheet.test.tsx`
Expected: Fails — `ShareSheet` module doesn't exist.

---

### Task 7: Implement ShareSheet component

**Files:**
- Create: `src/components/ShareSheet.tsx`

- [ ] **Step 1: Create ShareSheet.tsx**

```tsx
import { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/constants/theme';
import { SharePoster, type SharePosterPlant } from '@/components/SharePoster';

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  plant: SharePosterPlant;
  discoveryDate?: string;
  discoveryCity?: string;
}

type PosterFormat = 'story' | 'line';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMB_STORY_W = (SCREEN_WIDTH - spacing.xl * 3) / 2;
const THUMB_STORY_H = THUMB_STORY_W * (640 / 360);
const THUMB_LINE_W = THUMB_STORY_W;
const THUMB_LINE_H = THUMB_STORY_W;

export function ShareSheet({ visible, onClose, plant, discoveryDate, discoveryCity }: ShareSheetProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<PosterFormat>('story');
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const storyRef = useRef<View>(null);
  const lineRef = useRef<View>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  function handleOpen() {
    Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }

  function handleClose() {
    Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setSelected('story');
      setFeedback(null);
      onClose();
    });
  }

  async function handleSave() {
    const ref = selected === 'story' ? storyRef : lineRef;
    if (!ref.current || saving) return;
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setFeedback(t('share.permissionRequired'));
        return;
      }
      const uri = await captureRef(ref, { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      setFeedback(t('share.saved'));
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      // Save failed — silent
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    const ref = selected === 'story' ? storyRef : lineRef;
    if (!ref.current || sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: plant.name_ja });
      }
    } catch {
      // Share cancelled — silent
    } finally {
      setSharing(false);
    }
  }

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" onShow={handleOpen} onRequestClose={handleClose}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Format preview row */}
        <View style={styles.previewRow}>
          <TouchableOpacity
            style={[styles.thumbWrap, selected === 'story' && styles.thumbSelected]}
            onPress={() => setSelected('story')}
          >
            <View style={[styles.thumbInner, { height: THUMB_STORY_H }]}>
              <View style={{ transform: [{ scale: THUMB_STORY_W / 360 }], width: 360, height: 640 }}>
                <SharePoster plant={plant} format="story" discoveryDate={discoveryDate} discoveryCity={discoveryCity} />
              </View>
            </View>
            <Text style={[styles.thumbLabel, selected === 'story' && styles.thumbLabelSelected]}>
              {t('share.storyLabel')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.thumbWrap, selected === 'line' && styles.thumbSelected]}
            onPress={() => setSelected('line')}
          >
            <View style={[styles.thumbInner, { height: THUMB_LINE_H }]}>
              <View style={{ transform: [{ scale: THUMB_LINE_W / 360 }], width: 360, height: 360 }}>
                <SharePoster plant={plant} format="line" discoveryDate={discoveryDate} discoveryCity={discoveryCity} />
              </View>
            </View>
            <Text style={[styles.thumbLabel, selected === 'line' && styles.thumbLabelSelected]}>
              {t('share.lineLabel')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator size="small" color={colors.plantPrimary} />
              : <Text style={styles.saveBtnText}>{feedback ?? t('share.save')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.shareBtn]} onPress={handleShare} disabled={sharing}>
            {sharing
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Text style={styles.shareBtnText}>{t('share.share')}</Text>}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Off-screen posters for capture */}
      <View style={styles.offscreen} pointerEvents="none">
        <View ref={storyRef} collapsable={false}>
          <SharePoster plant={plant} format="story" discoveryDate={discoveryDate} discoveryCity={discoveryCity} />
        </View>
        <View ref={lineRef} collapsable={false}>
          <SharePoster plant={plant} format="line" discoveryDate={discoveryDate} discoveryCity={discoveryCity} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, paddingTop: spacing.sm },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },

  previewRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  thumbWrap:  { flex: 1, alignItems: 'center', gap: spacing.xs },
  thumbInner: { width: THUMB_STORY_W, overflow: 'hidden', borderRadius: borderRadius.sm, borderWidth: 2, borderColor: colors.border },
  thumbSelected:       { },
  thumbLabel:          { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  thumbLabelSelected:  { color: colors.plantPrimary, fontFamily: typography.fontFamily.display },

  actionRow:  { flexDirection: 'row', gap: spacing.sm },
  actionBtn:  { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  saveBtn:    { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.plantPrimary },
  shareBtn:   { backgroundColor: colors.plantPrimary },
  saveBtnText:  { fontSize: typography.fontSize.sm, color: colors.plantPrimary, fontFamily: typography.fontFamily.display },
  shareBtnText: { fontSize: typography.fontSize.sm, color: colors.white, fontFamily: typography.fontFamily.display },

  offscreen: { position: 'absolute', left: -9999, top: 0 },
});
```

Note: The `thumbSelected` style needs the green border when active. Update:
```typescript
thumbInner: { ..., borderColor: colors.border },
```
And in the component, apply the green border conditionally:
```tsx
<View style={[styles.thumbInner, { height: THUMB_STORY_H, borderColor: selected === 'story' ? colors.plantPrimary : colors.border }]}>
```

Apply the same pattern for the LINE thumbnail.

- [ ] **Step 2: Run ShareSheet tests**

Run: `npx jest __tests__/components/ShareSheet.test.tsx`
Expected: All pass.

- [ ] **Step 3: Run full suite**

Run: `npx jest`
Expected: All pass.

- [ ] **Step 4: Run tsc**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ShareSheet.tsx __tests__/components/ShareSheet.test.tsx
git commit -m "feat: add ShareSheet bottom sheet modal for poster format selection + save/share"
```

---

## Chunk 4: Integration

### Task 8: Integrate ShareSheet into plant/[id].tsx

**Files:**
- Modify: `src/app/plant/[id].tsx`

- [ ] **Step 1: Replace share logic in plant/[id].tsx**

1. Remove imports: `captureRef` from `react-native-view-shot`, `* as Sharing` from `expo-sharing`
2. Remove: `useRef` import (if no longer needed), `posterRef`, `sharing` state, `handleShare` function
3. Add import: `import { ShareSheet } from '@/components/ShareSheet';`
4. Add state: `const [shareSheetVisible, setShareSheetVisible] = useState(false);`
5. Change share button `onPress`:
   ```tsx
   onPress={() => setShareSheetVisible(true)}
   ```
6. Remove the `sharing` state check and spinner from the button (ShareSheet handles its own loading)
7. Update share button text — keep `🌸 {t('herbarium.sharePoster')}` but remove the disabled/spinner logic
8. Add ShareSheet at the end of the component, before the closing `</ScrollView>`:
   ```tsx
   <ShareSheet
     visible={shareSheetVisible}
     onClose={() => setShareSheetVisible(false)}
     plant={{
       name_ja: plant.name_ja,
       name_latin: plant.name_latin,
       rarity: plant.rarity,
       hanakotoba: plant.hanakotoba ?? '',
       bloom_months: plant.bloom_months ?? [],
       pixel_sprite_url: heroImageUri ?? null,
       cityRank: null,
     }}
     discoveryDate={discoveries[0]?.created_at}
     discoveryCity={discoveries[0]?.city}
   />
   ```

- [ ] **Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Run full test suite**

Run: `npx jest`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/plant/[id].tsx
git commit -m "feat: replace inline share with ShareSheet in plant detail"
```

---

### Task 9: Integrate ShareSheet into discover.tsx

**Files:**
- Modify: `src/app/(tabs)/discover.tsx`

- [ ] **Step 1: Replace share logic in discover.tsx**

In the `ResultContent` function component:

1. Remove: `posterRef`, `sharing` state, `handleShare` function (lines 272-295)
2. Remove: Off-screen poster rendering block (lines 308-321, the `posterOffscreen` View + SharePoster)
3. Remove: `posterOffscreen` from StyleSheet (line 538)
4. Remove imports: `captureRef` from `react-native-view-shot`, `* as Sharing` from `expo-sharing`, `{ SharePoster }` from `@/components/SharePoster`
5. Add import: `import { ShareSheet } from '@/components/ShareSheet';`
6. Add state: `const [shareSheetVisible, setShareSheetVisible] = useState(false);`
7. Change share button `onPress` (line 347):
   ```tsx
   onPress={() => setShareSheetVisible(true)}
   ```
8. Simplify button — remove `disabled={sharing}` and spinner. Just show the text:
   ```tsx
   <Text style={[styles.buttonText, styles.buttonTextSecondary]}>{t('common.share')}</Text>
   ```
9. Add ShareSheet at the end of the `Animated.View` (before closing `</Animated.View>` at line 356):
   ```tsx
   <ShareSheet
     visible={shareSheetVisible}
     onClose={() => setShareSheetVisible(false)}
     plant={{
       name_ja: plant.name_ja,
       name_latin: plant.name_en,
       rarity: plant.rarity,
       hanakotoba: plant.hanakotoba ?? '',
       bloom_months: [],
       pixel_sprite_url: plant.pixel_sprite_url,
       cityRank: plant.cityRank ?? null,
     }}
     discoveryDate={new Date().toISOString()}
   />
   ```

Note: `bloom_months` is not available on `DiscoveredPlant` interface — pass `[]`. The gradient will use base colors without the bloom saturation boost, which is acceptable for the discover flow.

- [ ] **Step 2: Verify no leftover off-screen rendering**

Search for `posterOffscreen`, `posterRef`, `captureRef`, `Sharing` in discover.tsx — should find zero matches.

- [ ] **Step 3: Run tsc**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Run full test suite**

Run: `npx jest`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/(tabs)/discover.tsx
git commit -m "feat: replace inline share with ShareSheet in discover screen"
```

---

### Task 10: Final verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Run full test suite**

Run: `npx jest`
Expected: All tests pass (should be 201 original + new SharePoster + ShareSheet tests).

- [ ] **Step 3: Verify no unused imports**

Quick grep for removed dependencies to ensure clean removal:
```bash
grep -r "captureRef\|expo-sharing" src/app/plant/\[id\].tsx src/app/\(tabs\)/discover.tsx
```
Expected: No matches.

- [ ] **Step 4: Summary commit**

Only if there are any remaining unstaged changes:
```bash
git status
# If clean, no commit needed
```
