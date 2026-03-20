# Stamp Customization Panel (Phase B1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible "✎ カスタマイズ" panel to StampPreview that lets users override stamp line color, apply an effect, add caption text, and toggle decorative SVG overlays — with AsyncStorage persistence.

**Architecture:** A new `CustomizationPanel` accordion renders between sliders and the save button. `StampRenderer` gains a wrapper `<View>` that carries effect shadows and renders `StampDecoration` as an absolute sibling. Color overrides are resolved in `StampRenderer` before passing down to individual stamp components. The 4 user preferences persist via `AsyncStorage` by extending the existing single `useEffect` in `StampPreview`.

**Tech Stack:** React Native, react-native-svg (already installed), @react-native-async-storage/async-storage (already installed), ts-jest (test runner), existing `shallowRender` pattern.

---

## Prerequisite check

Before starting: confirm Phase A (stamp style library) is merged to `master`. Run `npx jest --no-coverage` — all suites must pass before any changes.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/hanami.ts` | Modify | Add `CustomOptions` interface, `DEFAULT_CUSTOM_OPTIONS`, `hanakotoba?` to `FlowerSpot` |
| `src/constants/theme.ts` | Modify | Add `STAMP_COLOR_PALETTE` export |
| `src/components/stamps/StampDecoration.tsx` | **Create** | SVG petal/branch/star overlays positioned as absolute sibling |
| `src/components/stamps/CustomizationPanel.tsx` | **Create** | Collapsible 4-row UI panel |
| `src/components/stamps/StampRenderer.tsx` | Modify | Wrapper View + effect styles + forward customOptions + render StampDecoration |
| `src/components/stamps/ClassicStamp.tsx` | Modify | Add `customText?` prop |
| `src/components/stamps/ReliefStamp.tsx` | Modify | Add `customText?` prop |
| `src/components/stamps/PostcardStamp.tsx` | Modify | Add `customText?` prop |
| `src/components/stamps/MedallionStamp.tsx` | Modify | Add `customText?` prop |
| `src/components/stamps/WindowStamp.tsx` | Modify | Add `customText?` prop |
| `src/components/stamps/MinimalStamp.tsx` | Modify | Add `customText?` prop |
| `src/components/stamps/StampOverlay.tsx` | Modify | Forward `customOptions?` to StampRenderer |
| `src/components/stamps/StampPreview.tsx` | Modify | Add state + extend useEffect + render CustomizationPanel |
| `src/i18n/ja.json` | Modify | Add `customize.*` keys |
| `src/i18n/en.json` | Modify | Add `customize.*` keys |
| `__tests__/components/stamps/StampDecoration.test.tsx` | **Create** | Unit tests |
| `__tests__/components/stamps/CustomizationPanel.test.tsx` | **Create** | Unit tests |
| `__tests__/components/stamps/StampRendererCustom.test.tsx` | **Create** | Unit tests for new StampRenderer behavior |

---

## Task 1: Types & Constants

**Files:**
- Modify: `src/types/hanami.ts`
- Modify: `src/constants/theme.ts`
- Test: `__tests__/constants/stamp-color-palette.test.ts`

### Background
`FlowerSpot` currently has no `hanakotoba` field. `CustomOptions` and its default need to be added to `hanami.ts` (not a separate file — matches the existing pattern where all hanami types are co-located). `STAMP_COLOR_PALETTE` goes in `theme.ts` alongside other stamp constants.

### Steps

- [ ] **Step 1.1: Add `hanakotoba?` to `FlowerSpot` and export `CustomOptions`**

  In `src/types/hanami.ts`, add to `FlowerSpot` interface (after `landmark?` on line 29):
  ```typescript
  hanakotoba?: string; // flower meaning in Japanese, ≤30 chars
  ```

  After the `SpotsData` interface, append:
  ```typescript
  export interface CustomOptions {
    customColor?: string;           // undefined = season theme color
    effectType: 'none' | 'shadow' | 'glow';
    textMode: 'none' | 'hanakotoba' | 'custom';
    customTextValue: string;        // ≤12 chars, used when textMode='custom'
    decorationKey: 'none' | 'petals' | 'branch' | 'stars';
  }

  export const DEFAULT_CUSTOM_OPTIONS: CustomOptions = {
    customColor: undefined,
    effectType: 'none',
    textMode: 'none',
    customTextValue: '',
    decorationKey: 'none',
  };
  ```

- [ ] **Step 1.2: Add `STAMP_COLOR_PALETTE` to `theme.ts`**

  In `src/constants/theme.ts`, append after the `stamp` const (after line 123):
  ```typescript
  /** 8-color palette for stamp line color customization. Index 0 matches sakura themeColor. */
  export const STAMP_COLOR_PALETTE = [
    '#e8a5b0', // 桜色 (season default for sakura)
    '#7B9FCC', // 空色
    '#d4a645', // 山吹色
    '#b07090', // 藤色
    '#6b8f5e', // 萌葱色
    '#8899aa', // 青鼠色
    '#c8a060', // 砂色
    '#aaaaaa', // 薄墨色
  ] as const;
  ```

- [ ] **Step 1.3: Write a compile-time test**

  Create `__tests__/constants/stamp-color-palette.test.ts`:
  ```typescript
  import { STAMP_COLOR_PALETTE } from '@/constants/theme';
  import { DEFAULT_CUSTOM_OPTIONS } from '@/types/hanami';
  import type { CustomOptions } from '@/types/hanami';

  describe('STAMP_COLOR_PALETTE', () => {
    it('has 8 colors', () => {
      expect(STAMP_COLOR_PALETTE).toHaveLength(8);
    });

    it('first color is sakura pink', () => {
      expect(STAMP_COLOR_PALETTE[0]).toBe('#e8a5b0');
    });
  });

  describe('DEFAULT_CUSTOM_OPTIONS', () => {
    it('has effectType none', () => {
      expect(DEFAULT_CUSTOM_OPTIONS.effectType).toBe('none');
    });

    it('has textMode none', () => {
      expect(DEFAULT_CUSTOM_OPTIONS.textMode).toBe('none');
    });

    it('has decorationKey none', () => {
      expect(DEFAULT_CUSTOM_OPTIONS.decorationKey).toBe('none');
    });

    it('has undefined customColor', () => {
      expect(DEFAULT_CUSTOM_OPTIONS.customColor).toBeUndefined();
    });

    it('satisfies CustomOptions type', () => {
      const _: CustomOptions = DEFAULT_CUSTOM_OPTIONS;
      expect(_).toBeDefined();
    });
  });
  ```

- [ ] **Step 1.4: Run test**

  ```
  npx jest --testPathPattern="__tests__/constants/stamp-color-palette" --no-coverage
  ```
  Expected: PASS (5 tests)

- [ ] **Step 1.5: Commit**

  ```bash
  git add src/types/hanami.ts src/constants/theme.ts __tests__/constants/stamp-color-palette.test.ts
  git commit -m "feat(types): add CustomOptions, DEFAULT_CUSTOM_OPTIONS, hanakotoba field, STAMP_COLOR_PALETTE"
  ```

---

## Task 2: StampDecoration Component

**Files:**
- Create: `src/components/stamps/StampDecoration.tsx`
- Test: `__tests__/components/stamps/StampDecoration.test.tsx`

### Background
This component renders absolute-positioned SVG decorations (petals, branch, stars) on top of a stamp. It lives in `StampRenderer`'s wrapper View as a sibling to the stamp — not inside any stamp component — because 4 of the 6 stamp components have `overflow: 'hidden'` which would clip corner elements.

`react-native-svg` is already installed (used by `ReliefStamp` and `MedallionStamp`). Size constants per `styleId` are needed because each stamp has different fixed dimensions.

### Steps

- [ ] **Step 2.1: Write failing tests**

  Create `__tests__/components/stamps/StampDecoration.test.tsx`:
  ```typescript
  /**
   * StampDecoration tests.
   * Verifies SVG elements render for each decorationKey.
   */

  jest.mock('react-native-svg', () => {
    const React = jest.requireActual('react');
    const mock = (name: string) => (props: any) =>
      React.createElement(name, props);
    return {
      __esModule: true,
      default: mock('Svg'),
      Svg: mock('Svg'),
      Ellipse: mock('Ellipse'),
      Path: mock('Path'),
      Circle: mock('Circle'),
    };
  });

  import React from 'react';
  import { StampDecoration } from '@/components/stamps/StampDecoration';

  function shallowRender(element: any, depth = 12): any {
    if (element == null || typeof element !== 'object') return element;
    if (Array.isArray(element)) return element.map((e) => shallowRender(e, depth));
    if (!element.type) return element;
    if (typeof element.type === 'function' && depth > 0) {
      try {
        return shallowRender(element.type({ ...element.props }), depth - 1);
      } catch { return null; }
    }
    const children = element.props?.children;
    return {
      type: typeof element.type === 'string' ? element.type : (element.type?.name ?? 'Unknown'),
      props: { ...element.props, children: undefined },
      children: children != null ? shallowRender(children, depth) : undefined,
    };
  }

  describe('StampDecoration', () => {
    const baseProps = { color: '#e8a5b0', styleId: 'classic' as const };

    it('renders an Svg element for petals', () => {
      const tree = shallowRender(
        React.createElement(StampDecoration, { ...baseProps, decorationKey: 'petals' })
      );
      const json = JSON.stringify(tree);
      expect(json).toContain('Ellipse');
    });

    it('renders an Svg element for branch', () => {
      const tree = shallowRender(
        React.createElement(StampDecoration, { ...baseProps, decorationKey: 'branch' })
      );
      const json = JSON.stringify(tree);
      expect(json).toContain('Path');
    });

    it('renders an Svg element for stars', () => {
      const tree = shallowRender(
        React.createElement(StampDecoration, { ...baseProps, decorationKey: 'stars' })
      );
      const json = JSON.stringify(tree);
      expect(json).toContain('Svg');
    });

    it('uses the provided color for fill', () => {
      const tree = shallowRender(
        React.createElement(StampDecoration, { ...baseProps, decorationKey: 'petals' })
      );
      const json = JSON.stringify(tree);
      expect(json).toContain('#e8a5b0');
    });

    it('renders for medallion styleId', () => {
      const tree = shallowRender(
        React.createElement(StampDecoration, { ...baseProps, styleId: 'medallion', decorationKey: 'stars' })
      );
      expect(tree).not.toBeNull();
    });
  });
  ```

- [ ] **Step 2.2: Run test to confirm it fails**

  ```
  npx jest --testPathPattern="StampDecoration" --no-coverage
  ```
  Expected: FAIL — "Cannot find module '@/components/stamps/StampDecoration'"

- [ ] **Step 2.3: Implement `StampDecoration.tsx`**

  Create `src/components/stamps/StampDecoration.tsx`:
  ```typescript
  import React from 'react';
  import { View, StyleSheet } from 'react-native';
  import Svg, { Ellipse, Path, Circle } from 'react-native-svg';
  import type { StampStyleId } from '@/types/hanami';

  interface StampDecorationProps {
    decorationKey: 'petals' | 'branch' | 'stars'; // 'none' filtered out before render
    color: string;
    styleId: StampStyleId;
  }

  /** Stamp dimensions used for SVG sizing. Fallback to classic if unknown. */
  const STAMP_SIZES: Record<StampStyleId, { w: number; h: number }> = {
    classic:   { w: 130, h: 96 },
    relief:    { w: 120, h: 90 },
    postcard:  { w: 120, h: 130 },
    medallion: { w: 72,  h: 72 },
    window:    { w: 116, h: 130 },
    minimal:   { w: 100, h: 40 }, // petals not meaningful; renders simple row
  };

  function PetalsDecoration({ w, h, color }: { w: number; h: number; color: string }) {
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
        {/* top-left corner petals */}
        <Ellipse cx={8} cy={8} rx={5} ry={3} fill={color} opacity={0.35} rotation={-30} originX={8} originY={8} />
        <Ellipse cx={14} cy={5} rx={4} ry={2.5} fill={color} opacity={0.30} rotation={15} originX={14} originY={5} />
        {/* bottom-right corner petals */}
        <Ellipse cx={w - 8} cy={h - 8} rx={5} ry={3} fill={color} opacity={0.35} rotation={150} originX={w - 8} originY={h - 8} />
        <Ellipse cx={w - 14} cy={h - 5} rx={4} ry={2.5} fill={color} opacity={0.30} rotation={-165} originX={w - 14} originY={h - 5} />
        {/* top-right accent */}
        <Ellipse cx={w - 7} cy={9} rx={3.5} ry={2} fill={color} opacity={0.25} rotation={60} originX={w - 7} originY={9} />
      </Svg>
    );
  }

  function BranchDecoration({ w, h, color }: { w: number; h: number; color: string }) {
    const mid = w / 2;
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
        {/* thin arc along top edge */}
        <Path
          d={`M ${mid - 22} 6 Q ${mid} 2 ${mid + 22} 6`}
          stroke={color}
          strokeWidth={1}
          fill="none"
          opacity={0.45}
        />
        {/* small flower circles */}
        <Circle cx={mid - 20} cy={6} r={2.5} fill={color} opacity={0.35} />
        <Circle cx={mid} cy={3} r={2} fill={color} opacity={0.30} />
        <Circle cx={mid + 20} cy={6} r={2.5} fill={color} opacity={0.35} />
      </Svg>
    );
  }

  function StarsDecoration({ w, h, color }: { w: number; h: number; color: string }) {
    const star = (cx: number, cy: number, r: number) => (
      <Path
        d={`M ${cx} ${cy - r} L ${cx + r * 0.35} ${cy - r * 0.35} L ${cx + r} ${cy} L ${cx + r * 0.35} ${cy + r * 0.35} L ${cx} ${cy + r} L ${cx - r * 0.35} ${cy + r * 0.35} L ${cx - r} ${cy} L ${cx - r * 0.35} ${cy - r * 0.35} Z`}
        fill={color}
        opacity={0.30}
        key={`${cx}-${cy}`}
      />
    );
    return (
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
        {star(6, 6, 4)}
        {star(w - 6, 6, 4)}
        {star(6, h - 6, 4)}
        {star(w - 6, h - 6, 4)}
      </Svg>
    );
  }

  export function StampDecoration({ decorationKey, color, styleId }: StampDecorationProps) {
    const { w, h } = STAMP_SIZES[styleId] ?? STAMP_SIZES.classic;

    switch (decorationKey) {
      case 'petals':
        return <PetalsDecoration w={w} h={h} color={color} />;
      case 'branch':
        return <BranchDecoration w={w} h={h} color={color} />;
      case 'stars':
        return <StarsDecoration w={w} h={h} color={color} />;
    }
  }
  ```

- [ ] **Step 2.4: Run test to confirm it passes**

  ```
  npx jest --testPathPattern="StampDecoration" --no-coverage
  ```
  Expected: PASS (5 tests)

- [ ] **Step 2.5: Commit**

  ```bash
  git add src/components/stamps/StampDecoration.tsx __tests__/components/stamps/StampDecoration.test.tsx
  git commit -m "feat(stamps): add StampDecoration SVG overlay component"
  ```

---

## Task 3: Update StampRenderer

**Files:**
- Modify: `src/components/stamps/StampRenderer.tsx`
- Test: `__tests__/components/stamps/StampRendererCustom.test.tsx`

### Background
`StampRenderer` currently returns each stamp directly from a switch. We need to:
1. Accept new `customOptions?: CustomOptions` prop
2. Resolve `resolvedColor = customOptions?.customColor ?? themeColor` (or `accentColor` for minimal) — pass to existing `themeColor`/`accentColor` prop
3. Derive `customText` from `textMode` + `spot.hanakotoba` + `customTextValue`
4. Compute effect shadow style from `effectType`
5. Wrap all switch cases into a single wrapper `<View style={[{ position: 'relative' }, effectStyle]}>` with `StampDecoration` as sibling

The existing test file `__tests__/components/stamps/StampRenderer.test.tsx` must still pass. We add a new test file for the custom behavior.

### Steps

- [ ] **Step 3.1: Write failing test**

  Create `__tests__/components/stamps/StampRendererCustom.test.tsx`:
  ```typescript
  /**
   * StampRenderer — customOptions behavior tests.
   * Verifies wrapper View, resolvedColor, customText derivation, effect styles, and decoration rendering.
   */

  jest.mock('@/utils/stamp-colors', () => ({
    getStampColors: jest.fn(() => ({ brandDeep: '#c45070', brandMid: '#d46080' })),
  }));

  jest.mock('@/constants/stamp-styles', () => ({
    STAMP_STYLE_MIGRATION: { pixel: 'classic', seal: 'medallion' },
    DEFAULT_STAMP_STYLE_ID: 'classic',
  }));

  jest.mock('@/constants/prefecture-en', () => ({
    PREFECTURE_EN: { 26: 'KYOTO' },
  }));

  jest.mock('react-native-svg', () => {
    const React = jest.requireActual('react');
    const mock = (name: string) => (props: any) => React.createElement(name, props);
    return {
      __esModule: true, default: mock('Svg'), Svg: mock('Svg'),
      Path: mock('Path'), Circle: mock('Circle'), Ellipse: mock('Ellipse'),
    };
  });

  import React from 'react';
  import { StampRenderer } from '@/components/stamps/StampRenderer';
  import { DEFAULT_CUSTOM_OPTIONS } from '@/types/hanami';
  import type { CustomOptions } from '@/types/hanami';

  function shallowRender(element: any, depth = 12): any {
    if (element == null || typeof element !== 'object') return element;
    if (Array.isArray(element)) return element.map((e) => shallowRender(e, depth));
    if (!element.type) return element;
    if (typeof element.type === 'function' && depth > 0) {
      try { return shallowRender(element.type({ ...element.props }), depth - 1); }
      catch { return null; }
    }
    const children = element.props?.children;
    return {
      type: typeof element.type === 'string' ? element.type : (element.type?.name ?? 'Unknown'),
      props: { ...element.props, children: undefined },
      children: children != null ? shallowRender(children, depth) : undefined,
    };
  }

  const mockSeason = {
    id: 'sakura', themeColor: '#e8a5b0', accentColor: '#f5d5d0',
    nameKey: 'season.sakura.name', iconEmoji: '🌸',
    dateRange: ['03-15', '04-20'] as [string, string], spotsDataKey: 'sakura',
  };

  const mockSpot = {
    id: 1, regionId: 'jp', seasonId: 'sakura', nameJa: '哲学の道', nameEn: "Philosopher's Path",
    prefecture: '京都府', prefectureCode: 26, city: 'Kyoto', category: 'river' as const,
    bloomTypical: { earlyStart: '03-25', peakStart: '04-01', peakEnd: '04-07', lateEnd: '04-15' },
    latitude: 35.027, longitude: 135.794, tags: [],
    hanakotoba: '清らかな心',
  };

  const defaultProps = {
    styleId: 'classic' as const,
    spot: mockSpot,
    date: new Date('2026-03-28'),
    season: mockSeason,
  };

  describe('StampRenderer – customOptions', () => {
    it('renders wrapper View with position relative style by default', () => {
      const tree = shallowRender(React.createElement(StampRenderer, defaultProps));
      const json = JSON.stringify(tree);
      // Wrapper View should carry position:relative
      expect(json).toContain('"position":"relative"');
    });

    it('applies shadow style when effectType=shadow', () => {
      const opts: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, effectType: 'shadow' };
      const tree = shallowRender(
        React.createElement(StampRenderer, { ...defaultProps, customOptions: opts })
      );
      const json = JSON.stringify(tree);
      expect(json).toContain('"shadowOpacity":0.13');
      expect(json).toContain('"elevation":3');
    });

    it('applies glow style when effectType=glow', () => {
      const opts: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, effectType: 'glow' };
      const tree = shallowRender(
        React.createElement(StampRenderer, { ...defaultProps, customOptions: opts })
      );
      const json = JSON.stringify(tree);
      expect(json).toContain('"shadowOpacity":0.4');
      expect(json).toContain('"elevation":6');
    });

    it('passes custom color to ClassicStamp when customColor is set', () => {
      const opts: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, customColor: '#7B9FCC' };
      const tree = shallowRender(
        React.createElement(StampRenderer, { ...defaultProps, customOptions: opts })
      );
      const json = JSON.stringify(tree);
      expect(json).toContain('#7B9FCC');
    });

    it('falls back to season themeColor when customColor is undefined', () => {
      const tree = shallowRender(React.createElement(StampRenderer, defaultProps));
      const json = JSON.stringify(tree);
      expect(json).toContain('#e8a5b0');
    });

    it('renders StampDecoration when decorationKey is petals', () => {
      const opts: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, decorationKey: 'petals' };
      const tree = shallowRender(
        React.createElement(StampRenderer, { ...defaultProps, customOptions: opts })
      );
      const json = JSON.stringify(tree);
      expect(json).toContain('Ellipse');
    });

    it('does not render StampDecoration when decorationKey is none', () => {
      const tree = shallowRender(React.createElement(StampRenderer, defaultProps));
      const json = JSON.stringify(tree);
      expect(json).not.toContain('Ellipse');
    });

    it('passes hanakotoba as customText when textMode=hanakotoba', () => {
      const opts: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, textMode: 'hanakotoba' };
      const tree = shallowRender(
        React.createElement(StampRenderer, { ...defaultProps, customOptions: opts })
      );
      const json = JSON.stringify(tree);
      expect(json).toContain('清らかな心');
    });

    it('passes customTextValue as customText when textMode=custom', () => {
      const opts: CustomOptions = { ...DEFAULT_CUSTOM_OPTIONS, textMode: 'custom', customTextValue: '春の記憶' };
      const tree = shallowRender(
        React.createElement(StampRenderer, { ...defaultProps, customOptions: opts })
      );
      const json = JSON.stringify(tree);
      expect(json).toContain('春の記憶');
    });
  });
  ```

- [ ] **Step 3.2: Run test to confirm it fails**

  ```
  npx jest --testPathPattern="StampRendererCustom" --no-coverage
  ```
  Expected: FAIL — wrapper/customOptions not implemented yet

- [ ] **Step 3.3: Implement updated `StampRenderer.tsx`**

  Replace `src/components/stamps/StampRenderer.tsx` with:
  ```typescript
  import React from 'react';
  import { View } from 'react-native';
  import type { ViewStyle } from 'react-native';
  import type { FlowerSpot, StampStyleId, CustomOptions } from '@/types/hanami';
  import type { SeasonConfig } from '@/constants/seasons';
  import { PREFECTURE_EN } from '@/constants/prefecture-en';
  import { STAMP_STYLE_MIGRATION, DEFAULT_STAMP_STYLE_ID } from '@/constants/stamp-styles';
  import { ClassicStamp } from './ClassicStamp';
  import { ReliefStamp } from './ReliefStamp';
  import { PostcardStamp } from './PostcardStamp';
  import { MedallionStamp } from './MedallionStamp';
  import { WindowStamp } from './WindowStamp';
  import { MinimalStamp } from './MinimalStamp';
  import { StampDecoration } from './StampDecoration';

  interface StampRendererProps {
    /** Accepts new StampStyleId values as well as legacy 'pixel'/'seal' for backward compat */
    styleId: StampStyleId | string;
    spot: FlowerSpot;
    date: Date;
    season: SeasonConfig;
    customOptions?: CustomOptions;
  }

  const SEASON_LABELS: Record<string, string> = {
    sakura: '春', ajisai: '夏', himawari: '夏', momiji: '秋', tsubaki: '冬',
  };

  function getEffectStyle(effectType: CustomOptions['effectType'], resolvedColor: string): ViewStyle {
    if (effectType === 'shadow') {
      return {
        shadowColor: '#000000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.13,
        shadowRadius: 4,
        elevation: 3,
      };
    }
    if (effectType === 'glow') {
      return {
        shadowColor: resolvedColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.40,
        shadowRadius: 8,
        elevation: 6,
      };
    }
    return {};
  }

  export function StampRenderer({ styleId, spot, date, season, customOptions }: StampRendererProps) {
    // Migrate legacy style IDs (pixel → classic, seal → medallion)
    const resolvedId: StampStyleId = (
      STAMP_STYLE_MIGRATION[styleId] ?? styleId ?? DEFAULT_STAMP_STYLE_ID
    ) as StampStyleId;

    const cityEn =
      PREFECTURE_EN[spot.prefectureCode] ??
      spot.nameEn.split(' ').pop()?.toUpperCase() ??
      '';
    const year = date.getFullYear();
    const seasonLabel = `${year}${SEASON_LABELS[season.id] ?? ''}`;

    // Resolved color: customColor overrides season color
    const resolvedColor =
      resolvedId === 'minimal'
        ? (customOptions?.customColor ?? season.accentColor)
        : (customOptions?.customColor ?? season.themeColor);

    // Derive customText from textMode
    const textMode = customOptions?.textMode ?? 'none';
    const customText: string | undefined =
      textMode === 'hanakotoba' ? (spot.hanakotoba?.slice(0, 12) ?? undefined)
      : textMode === 'custom' ? (customOptions?.customTextValue || undefined)
      : undefined;

    const effectStyle = getEffectStyle(customOptions?.effectType ?? 'none', resolvedColor);
    const decorationKey = customOptions?.decorationKey ?? 'none';

    let stampElement: React.ReactElement;
    switch (resolvedId) {
      case 'classic':
        stampElement = (
          <ClassicStamp
            spotName={spot.nameJa}
            cityEn={cityEn}
            date={date}
            themeColor={resolvedColor}
            landmark={spot.landmark}
            customText={customText}
          />
        );
        break;
      case 'relief':
        stampElement = (
          <ReliefStamp
            spotName={spot.nameJa}
            seasonLabel={seasonLabel}
            themeColor={resolvedColor}
            landmark={spot.landmark}
            customText={customText}
          />
        );
        break;
      case 'postcard':
        stampElement = (
          <PostcardStamp
            spotName={spot.nameJa}
            seasonLabel={seasonLabel}
            themeColor={resolvedColor}
            landmark={spot.landmark}
            customText={customText}
          />
        );
        break;
      case 'medallion':
        stampElement = (
          <MedallionStamp
            spotName={spot.nameJa}
            seasonLabel={seasonLabel}
            themeColor={resolvedColor}
            landmark={spot.landmark}
            customText={customText}
          />
        );
        break;
      case 'window':
        stampElement = (
          <WindowStamp
            spotName={spot.nameJa}
            seasonLabel={seasonLabel}
            themeColor={resolvedColor}
            landmark={spot.landmark}
            customText={customText}
          />
        );
        break;
      case 'minimal':
        stampElement = (
          <MinimalStamp
            spotName={spot.nameJa}
            cityEn={cityEn}
            date={date}
            accentColor={resolvedColor}
            customText={customText}
          />
        );
        break;
      default:
        stampElement = (
          <ClassicStamp
            spotName={spot.nameJa}
            cityEn={cityEn}
            date={date}
            themeColor={resolvedColor}
            landmark={spot.landmark}
            customText={customText}
          />
        );
    }

    return (
      <View style={[{ position: 'relative' }, effectStyle]}>
        {stampElement}
        {decorationKey !== 'none' && (
          <StampDecoration
            decorationKey={decorationKey}
            color={resolvedColor}
            styleId={resolvedId}
          />
        )}
      </View>
    );
  }
  ```

- [ ] **Step 3.4: Run both StampRenderer tests**

  ```
  npx jest --testPathPattern="StampRenderer" --no-coverage
  ```
  Expected: PASS (existing tests + 9 new tests)

- [ ] **Step 3.5: Commit**

  ```bash
  git add src/components/stamps/StampRenderer.tsx __tests__/components/stamps/StampRendererCustom.test.tsx
  git commit -m "feat(stamps): StampRenderer wrapper + customOptions forwarding + effect styles + StampDecoration"
  ```

---

## Task 4: Add `customText` to Individual Stamp Components

**Files:**
- Modify: `src/components/stamps/ClassicStamp.tsx`
- Modify: `src/components/stamps/ReliefStamp.tsx`
- Modify: `src/components/stamps/PostcardStamp.tsx`
- Modify: `src/components/stamps/MedallionStamp.tsx`
- Modify: `src/components/stamps/WindowStamp.tsx`
- Modify: `src/components/stamps/MinimalStamp.tsx`

### Background
Each stamp receives `customText?: string` and renders it as a small muted subtitle below existing content. The color and effect are already handled by `StampRenderer`; the stamp components themselves only need to render the text string.

`MinimalStamp` has a horizontal `flexDirection: 'row'` layout. Add `customText` inside `textGroup` below `meta`.

All 6 components follow the same pattern. No new test files needed — test coverage comes from the `StampRendererCustom` tests that verify `customText` content appears in the render tree.

### Steps

- [ ] **Step 4.1: Update `ClassicStamp.tsx`**

  Add `customText?: string` to `ClassicStampProps` interface. After the `meta` Text element, add:
  ```tsx
  {customText ? (
    <Text style={[styles.customText, { color: brandMid }]}>{customText}</Text>
  ) : null}
  ```
  Add to `StyleSheet.create`:
  ```typescript
  customText: {
    fontSize: 9,
    marginTop: 2,
    letterSpacing: 0.3,
    fontStyle: 'italic',
  },
  ```

- [ ] **Step 4.2: Update `ReliefStamp.tsx`**

  Add `customText?: string` to `ReliefStampProps`. Inside `textLayer` View, after the `seasonLabel` Text:
  ```tsx
  {customText ? (
    <Text style={[styles.customText, { color: brandMid }]}>{customText}</Text>
  ) : null}
  ```
  Add style:
  ```typescript
  customText: { fontSize: 9, marginTop: 2, letterSpacing: 0.3, fontStyle: 'italic' },
  ```

- [ ] **Step 4.3: Update `PostcardStamp.tsx`**

  Same pattern as Relief. Read the file first to find the text area, then add after the last existing text element in the text section. Add style with `fontSize: 9`.

- [ ] **Step 4.4: Update `MedallionStamp.tsx`**

  Same pattern. Read the file to find the bottom text area inside the circle. Add after the last text element. Style with `fontSize: 8` (circle is smaller at 72px diameter).

- [ ] **Step 4.5: Update `WindowStamp.tsx`**

  Same pattern. Read the file to find the text area, add after the last text element. Style with `fontSize: 9`.

- [ ] **Step 4.6: Update `MinimalStamp.tsx`**

  Add `customText?: string` to `MinimalStampProps`. Inside `textGroup`, after `meta` Text:
  ```tsx
  {customText ? (
    <Text style={styles.customText}>{customText}</Text>
  ) : null}
  ```
  Add style:
  ```typescript
  customText: {
    fontSize: 8, marginTop: 1,
    color: 'rgba(255,255,255,0.72)',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontStyle: 'italic',
  },
  ```

- [ ] **Step 4.7: Run all StampRenderer tests**

  ```
  npx jest --testPathPattern="StampRenderer" --no-coverage
  ```
  Expected: PASS — the customText tests in StampRendererCustom verify the text propagates through

- [ ] **Step 4.8: Commit**

  ```bash
  git add src/components/stamps/ClassicStamp.tsx src/components/stamps/ReliefStamp.tsx \
    src/components/stamps/PostcardStamp.tsx src/components/stamps/MedallionStamp.tsx \
    src/components/stamps/WindowStamp.tsx src/components/stamps/MinimalStamp.tsx
  git commit -m "feat(stamps): add customText prop to all 6 stamp components"
  ```

---

## Task 5: StampOverlay Forwarding + i18n Keys

**Files:**
- Modify: `src/components/stamps/StampOverlay.tsx`
- Modify: `src/i18n/ja.json`
- Modify: `src/i18n/en.json`

### Background
`StampOverlay` sits between `StampPreview` and `StampRenderer`. It needs to accept `customOptions?` and pass it to `StampRenderer`. This is a minimal prop-forwarding change.

i18n keys are added here (before `CustomizationPanel` which needs them) to keep them in a clean commit.

### Steps

- [ ] **Step 5.1: Update `StampOverlay.tsx`**

  Add `customOptions?: CustomOptions` to the import:
  ```typescript
  import type { StampStyleId, StampPosition, FlowerSpot, CustomOptions } from '@/types/hanami';
  ```

  Add to `StampOverlayProps` interface (after `userScale?`):
  ```typescript
  customOptions?: CustomOptions;
  ```

  Update destructuring in the function signature to include `customOptions`.

  Update the `stampElement` const (currently line 60):
  ```tsx
  const stampElement = (
    <StampRenderer styleId={style} spot={spot} date={date} season={season} customOptions={customOptions} />
  );
  ```

- [ ] **Step 5.2: Add i18n keys to `ja.json`**

  Open `src/i18n/ja.json`. Find the root object and add a `"customize"` key:
  ```json
  "customize": {
    "title": "カスタマイズ",
    "lineColor": "線の色",
    "seasonDefault": "季節色",
    "effect": "効果",
    "effectNone": "なし",
    "effectShadow": "淡い影",
    "effectGlow": "柔光",
    "addText": "添え文字",
    "textNone": "なし",
    "textHanakotoba": "花言葉",
    "textCustom": "自由入力",
    "textPlaceholder": "12文字以内",
    "decoration": "装飾",
    "decorNone": "なし",
    "decorPetals": "花びら",
    "decorBranch": "枝",
    "decorStars": "星"
  }
  ```

- [ ] **Step 5.3: Add i18n keys to `en.json`**

  Open `src/i18n/en.json`. Add:
  ```json
  "customize": {
    "title": "Customize",
    "lineColor": "Line Color",
    "seasonDefault": "Season",
    "effect": "Effect",
    "effectNone": "None",
    "effectShadow": "Soft Shadow",
    "effectGlow": "Glow",
    "addText": "Caption",
    "textNone": "None",
    "textHanakotoba": "Flower Meaning",
    "textCustom": "Custom",
    "textPlaceholder": "Up to 12 chars",
    "decoration": "Decoration",
    "decorNone": "None",
    "decorPetals": "Petals",
    "decorBranch": "Branch",
    "decorStars": "Stars"
  }
  ```

- [ ] **Step 5.4: Run i18n tests**

  ```
  npx jest --testPathPattern="__tests__/i18n" --no-coverage
  ```
  Expected: PASS (existing i18n key-parity tests should pass with new keys present in both files)

- [ ] **Step 5.5: Commit**

  ```bash
  git add src/components/stamps/StampOverlay.tsx src/i18n/ja.json src/i18n/en.json
  git commit -m "feat(stamps): forward customOptions through StampOverlay; add customize i18n keys"
  ```

---

## Task 6: CustomizationPanel Component

**Files:**
- Create: `src/components/stamps/CustomizationPanel.tsx`
- Test: `__tests__/components/stamps/CustomizationPanel.test.tsx`

### Background
`CustomizationPanel` is a stateful collapsible accordion. It manages its own open/close state internally (so no new hooks are added to `StampPreview`).

**Color row**: 8 circles from `STAMP_COLOR_PALETTE`. The circle at index 0 (matching the season color) shows a "季" label when `customColor` is `undefined` (season default). A selected non-undefined color shows a 2px ring matching `theme.primary`.

**Chips**: Each option group (effect/text/decoration) uses horizontal chip pills. Selected chip has filled background.

**TextInput**: Appears only when `textMode='custom'`. `maxLength={12}`.

Test strategy: mock `react` hooks to control open/closed state in tests. Verify collapsed renders title, expanded renders row labels.

### Steps

- [ ] **Step 6.1: Write failing tests**

  Create `__tests__/components/stamps/CustomizationPanel.test.tsx`:
  ```typescript
  /**
   * CustomizationPanel tests.
   * Collapsed: shows title. Expanded: shows all 4 row labels.
   */

  // Control useState to test both collapsed and expanded states
  let mockIsOpen = false;
  jest.mock('react', () => {
    const actual = jest.requireActual('react');
    const mock = Object.assign({}, actual, {
      useState: (init: any) => {
        // First useState call in CustomizationPanel is for isOpen
        if (typeof init === 'boolean') return [mockIsOpen, jest.fn()];
        return [typeof init === 'function' ? init() : init, jest.fn()];
      },
      useRef: (init: any) => ({ current: init !== undefined ? init : null }),
      useEffect: () => {},
      useCallback: (fn: any) => fn,
      useMemo: (factory: () => any) => factory(),
    });
    mock.default = mock;
    mock.__esModule = true;
    return mock;
  });

  jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
  }));

  jest.mock('@/constants/theme', () => ({
    colors: { text: '#3a3a3a', textSecondary: '#7a7a7a', white: '#ffffff', border: '#e8e6e1' },
    spacing: { xs: 4, sm: 8, md: 16 },
    borderRadius: { sm: 6 },
    STAMP_COLOR_PALETTE: ['#e8a5b0', '#7B9FCC', '#d4a645', '#b07090', '#6b8f5e', '#8899aa', '#c8a060', '#aaaaaa'],
    SEASON_THEMES: {
      sakura: { primary: '#e8a5b0', accent: '#f5d5d0', bgTint: '#FFF5F3' },
    },
  }));

  import React from 'react';
  import { CustomizationPanel } from '@/components/stamps/CustomizationPanel';
  import { DEFAULT_CUSTOM_OPTIONS } from '@/types/hanami';

  function shallowRender(element: any, depth = 12): any {
    if (element == null || typeof element !== 'object') return element;
    if (Array.isArray(element)) return element.map((e) => shallowRender(e, depth));
    if (!element.type) return element;
    if (typeof element.type === 'function' && depth > 0) {
      try { return shallowRender(element.type({ ...element.props }), depth - 1); }
      catch { return null; }
    }
    const children = element.props?.children;
    return {
      type: typeof element.type === 'string' ? element.type : (element.type?.name ?? 'Unknown'),
      props: { ...element.props, children: undefined },
      children: children != null ? shallowRender(children, depth) : undefined,
    };
  }

  const panelProps = {
    options: DEFAULT_CUSTOM_OPTIONS,
    onChange: jest.fn(),
    seasonColor: '#e8a5b0',
  };

  describe('CustomizationPanel – collapsed', () => {
    beforeEach(() => { mockIsOpen = false; });

    it('renders customize title key', () => {
      const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
      expect(JSON.stringify(tree)).toContain('customize.title');
    });

    it('does not render line color label when collapsed', () => {
      const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
      expect(JSON.stringify(tree)).not.toContain('customize.lineColor');
    });
  });

  describe('CustomizationPanel – expanded', () => {
    beforeEach(() => { mockIsOpen = true; });

    it('renders all 4 section labels', () => {
      const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
      const json = JSON.stringify(tree);
      expect(json).toContain('customize.lineColor');
      expect(json).toContain('customize.effect');
      expect(json).toContain('customize.addText');
      expect(json).toContain('customize.decoration');
    });

    it('renders 8 color swatches', () => {
      const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
      const json = JSON.stringify(tree);
      // Each palette color appears as backgroundColor
      expect(json).toContain('#7B9FCC');
      expect(json).toContain('#d4a645');
    });

    it('renders effectNone chip', () => {
      const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
      expect(JSON.stringify(tree)).toContain('customize.effectNone');
    });

    it('renders decorPetals chip', () => {
      const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
      expect(JSON.stringify(tree)).toContain('customize.decorPetals');
    });

    it('does not render TextInput when textMode is none', () => {
      const tree = shallowRender(React.createElement(CustomizationPanel, panelProps));
      const json = JSON.stringify(tree);
      expect(json).not.toContain('TextInput');
    });

    it('renders TextInput when textMode is custom', () => {
      const opts = { ...DEFAULT_CUSTOM_OPTIONS, textMode: 'custom' as const };
      const tree = shallowRender(
        React.createElement(CustomizationPanel, { ...panelProps, options: opts })
      );
      expect(JSON.stringify(tree)).toContain('TextInput');
    });
  });
  ```

- [ ] **Step 6.2: Run test to confirm it fails**

  ```
  npx jest --testPathPattern="CustomizationPanel" --no-coverage
  ```
  Expected: FAIL — module not found

- [ ] **Step 6.3: Implement `CustomizationPanel.tsx`**

  Create `src/components/stamps/CustomizationPanel.tsx`:
  ```typescript
  import { useState } from 'react';
  import {
    View, Text, TouchableOpacity, TextInput, StyleSheet,
  } from 'react-native';
  import { useTranslation } from 'react-i18next';
  import { colors, spacing, borderRadius, STAMP_COLOR_PALETTE, SEASON_THEMES } from '@/constants/theme';
  import type { CustomOptions } from '@/types/hanami';

  interface CustomizationPanelProps {
    options: CustomOptions;
    onChange: (patch: Partial<CustomOptions>) => void;
    /** Always season.themeColor — used to identify the season-default swatch */
    seasonColor: string;
  }

  // ── Chip component ───────────────────────────────────────────────────────────

  function Chip({
    label, selected, onPress, themeColor,
  }: { label: string; selected: boolean; onPress: () => void; themeColor: string }) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.chip, selected && { backgroundColor: themeColor + '22', borderColor: themeColor, borderWidth: 1.5 }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, selected && { color: themeColor }]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  // ── Main component ───────────────────────────────────────────────────────────

  export function CustomizationPanel({ options, onChange, seasonColor }: CustomizationPanelProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    // Use sakura primary as fallback theme color for chip highlight
    const themeColor = seasonColor || SEASON_THEMES.sakura.primary;

    return (
      <View>
        {/* Toggle row */}
        <TouchableOpacity
          style={[styles.toggleRow, { borderColor: themeColor }]}
          onPress={() => setIsOpen(v => !v)}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[styles.toggleLabel, { color: themeColor }]}>
            ✎ {t('customize.title')}
          </Text>
          <Text style={[styles.chevron, { color: themeColor }]}>{isOpen ? '▴' : '▾'}</Text>
        </TouchableOpacity>

        {/* Expanded content */}
        {isOpen && (
          <View style={styles.panel}>

            {/* ── Row 1: Line color ── */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('customize.lineColor')}</Text>
              <View style={styles.colorRow}>
                {STAMP_COLOR_PALETTE.map((hex, i) => {
                  const isSelected = options.customColor === hex;
                  const isSeasonDefault = i === 0 && options.customColor === undefined;
                  return (
                    <TouchableOpacity
                      key={hex}
                      onPress={() => onChange({ customColor: i === 0 && isSeasonDefault ? undefined : hex })}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: hex },
                        (isSelected || isSeasonDefault) && { borderWidth: 2, borderColor: '#333' },
                      ]}
                      activeOpacity={0.7}
                    >
                      {isSeasonDefault && (
                        <Text style={styles.seasonBadge}>季</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  onPress={() => onChange({ customColor: undefined })}
                  style={styles.resetColor}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.resetText, { color: themeColor }]}>
                    {t('customize.seasonDefault')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Row 2: Effect ── */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('customize.effect')}</Text>
              <View style={styles.chipRow}>
                {([ 'none', 'shadow', 'glow' ] as const).map(v => (
                  <Chip
                    key={v}
                    label={t(`customize.effect${v.charAt(0).toUpperCase() + v.slice(1)}` as any)}
                    selected={options.effectType === v}
                    onPress={() => onChange({ effectType: v })}
                    themeColor={themeColor}
                  />
                ))}
              </View>
            </View>

            {/* ── Row 3: Caption text ── */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('customize.addText')}</Text>
              <View style={styles.chipRow}>
                {([ 'none', 'hanakotoba', 'custom' ] as const).map(v => (
                  <Chip
                    key={v}
                    label={t(`customize.text${v === 'none' ? 'None' : v === 'hanakotoba' ? 'Hanakotoba' : 'Custom'}` as any)}
                    selected={options.textMode === v}
                    onPress={() => onChange({ textMode: v })}
                    themeColor={themeColor}
                  />
                ))}
              </View>
              {options.textMode === 'custom' && (
                <TextInput
                  style={[styles.textInput, { borderColor: themeColor }]}
                  value={options.customTextValue}
                  onChangeText={text => onChange({ customTextValue: text.slice(0, 12) })}
                  placeholder={t('customize.textPlaceholder')}
                  maxLength={12}
                  returnKeyType="done"
                  placeholderTextColor={colors.textSecondary}
                />
              )}
            </View>

            {/* ── Row 4: Decoration ── */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('customize.decoration')}</Text>
              <View style={styles.chipRow}>
                {([ 'none', 'petals', 'branch', 'stars' ] as const).map(v => (
                  <Chip
                    key={v}
                    label={t(`customize.decor${v === 'none' ? 'None' : v.charAt(0).toUpperCase() + v.slice(1)}` as any)}
                    selected={options.decorationKey === v}
                    onPress={() => onChange({ decorationKey: v })}
                    themeColor={themeColor}
                  />
                ))}
              </View>
            </View>

          </View>
        )}
      </View>
    );
  }

  // ── Styles ───────────────────────────────────────────────────────────────────

  const styles = StyleSheet.create({
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      minHeight: 36,
    },
    toggleLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
    chevron: {
      fontSize: 12,
    },
    panel: {
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: colors.border,
      borderBottomLeftRadius: borderRadius.sm,
      borderBottomRightRadius: borderRadius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.white,
      gap: spacing.sm,
    },
    row: {
      gap: spacing.xs,
    },
    rowLabel: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    colorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    colorSwatch: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    seasonBadge: {
      fontSize: 7,
      color: '#fff',
      fontWeight: 'bold',
    },
    resetColor: {
      marginLeft: spacing.xs,
    },
    resetText: {
      fontSize: 9,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.white,
    },
    chipText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    textInput: {
      marginTop: spacing.xs,
      borderWidth: 1,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      fontSize: 12,
      color: colors.text,
      height: 34,
    },
  });
  ```

- [ ] **Step 6.4: Run CustomizationPanel tests**

  ```
  npx jest --testPathPattern="CustomizationPanel" --no-coverage
  ```
  Expected: PASS (8 tests)

- [ ] **Step 6.5: Commit**

  ```bash
  git add src/components/stamps/CustomizationPanel.tsx __tests__/components/stamps/CustomizationPanel.test.tsx
  git commit -m "feat(stamps): add CustomizationPanel collapsible accordion component"
  ```

---

## Task 7: StampPreview Integration

**Files:**
- Modify: `src/components/stamps/StampPreview.tsx`
- Test: update `__tests__/components/stamps/StampPreview.test.tsx`

### Background
`StampPreview` owns the `customOptions` state and persistence. Key OTA constraint: **extend the existing `useEffect` at line 62** — do NOT add a second `useEffect`. The existing `Promise.all` on lines 64–69 loads 4 values; we extend it to load 8 (4 existing + 4 custom option keys).

`customTextValue` is held in component state but NOT persisted to AsyncStorage (transient per session).

`CustomizationPanel` renders between the size slider and the save button.

AsyncStorage keys:
- `stamp_custom_color_preference` — stores hex string or `'undefined'`
- `stamp_effect_type_preference` — `'none' | 'shadow' | 'glow'`
- `stamp_text_mode_preference` — `'none' | 'hanakotoba' | 'custom'`
- `stamp_decoration_key_preference` — `'none' | 'petals' | 'branch' | 'stars'`

### Steps

- [ ] **Step 7.1: Add new constants to `StampPreview.tsx`**

  After the existing `OPACITY_KEY` and `SIZE_KEY` constants (around line 30), add:
  ```typescript
  const CUSTOM_COLOR_KEY    = 'stamp_custom_color_preference';
  const EFFECT_TYPE_KEY     = 'stamp_effect_type_preference';
  const TEXT_MODE_KEY       = 'stamp_text_mode_preference';
  const DECORATION_KEY      = 'stamp_decoration_key_preference';
  ```

- [ ] **Step 7.2: Add imports**

  Add to the import from `@/types/hanami`:
  ```typescript
  import type { FlowerSpot, StampStyleId, StampPosition, CustomOptions } from '@/types/hanami';
  import { DEFAULT_CUSTOM_OPTIONS } from '@/types/hanami';
  ```

  Add import for `CustomizationPanel`:
  ```typescript
  import { CustomizationPanel } from './CustomizationPanel';
  ```

- [ ] **Step 7.3: Add `customOptions` state**

  After the existing `useState` declarations (after line 55 `const [busy, ...]`), add:
  ```typescript
  const [customOptions, setCustomOptions] = useState<CustomOptions>(DEFAULT_CUSTOM_OPTIONS);
  ```

- [ ] **Step 7.4: Extend the existing `useEffect` `Promise.all`**

  The current `Promise.all` (lines 64–69) loads 4 items. Extend it to load 8:
  ```typescript
  useEffect(() => {
    (async () => {
      const [
        savedStyle, savedPos, savedOpacity, savedSize,
        savedColor, savedEffect, savedTextMode, savedDecoration,
      ] = await Promise.all([
        AsyncStorage.getItem(stampConst.storageKey),
        AsyncStorage.getItem(stampConst.positionStorageKey),
        AsyncStorage.getItem(OPACITY_KEY),
        AsyncStorage.getItem(SIZE_KEY),
        AsyncStorage.getItem(CUSTOM_COLOR_KEY),
        AsyncStorage.getItem(EFFECT_TYPE_KEY),
        AsyncStorage.getItem(TEXT_MODE_KEY),
        AsyncStorage.getItem(DECORATION_KEY),
      ]);
      if (savedStyle) {
        const migrated = STAMP_STYLE_MIGRATION[savedStyle] ?? savedStyle;
        if (VALID_STYLE_IDS.includes(migrated)) setStampStyle(migrated as StampStyleId);
      }
      if (savedPos && VALID_POSITIONS.includes(savedPos as StampPosition)) {
        setStampPosition(savedPos as StampPosition);
      }
      if (savedOpacity) setOpacity(parseFloat(savedOpacity));
      if (savedSize) setScale(parseFloat(savedSize));

      // Restore custom options
      const restoredColor =
        savedColor === null || savedColor === 'undefined' ? undefined : savedColor;
      const restoredEffect: CustomOptions['effectType'] =
        (savedEffect === 'shadow' || savedEffect === 'glow') ? savedEffect : 'none';
      const restoredTextMode: CustomOptions['textMode'] =
        (savedTextMode === 'hanakotoba' || savedTextMode === 'custom') ? savedTextMode : 'none';
      const restoredDecoration: CustomOptions['decorationKey'] =
        (savedDecoration === 'petals' || savedDecoration === 'branch' || savedDecoration === 'stars')
          ? savedDecoration : 'none';
      setCustomOptions({
        customColor: restoredColor,
        effectType: restoredEffect,
        textMode: restoredTextMode,
        customTextValue: '',      // not persisted, always starts empty
        decorationKey: restoredDecoration,
      });
    })();
  }, []);
  ```

- [ ] **Step 7.5: Add `handleCustomChange` callback**

  After `handleScaleComplete` (around line 125), add:
  ```typescript
  const handleCustomChange = useCallback((patch: Partial<CustomOptions>) => {
    setCustomOptions(prev => {
      const next = { ...prev, ...patch };
      // Persist relevant keys (not customTextValue)
      if ('customColor' in patch) {
        AsyncStorage.setItem(CUSTOM_COLOR_KEY, next.customColor ?? 'undefined');
      }
      if ('effectType' in patch) {
        AsyncStorage.setItem(EFFECT_TYPE_KEY, next.effectType);
      }
      if ('textMode' in patch) {
        AsyncStorage.setItem(TEXT_MODE_KEY, next.textMode);
      }
      if ('decorationKey' in patch) {
        AsyncStorage.setItem(DECORATION_KEY, next.decorationKey);
      }
      return next;
    });
  }, []);
  ```

- [ ] **Step 7.6: Pass `customOptions` to `StampOverlay`**

  In the JSX (around line 155–163), update the `StampOverlay` element:
  ```tsx
  <StampOverlay
    style={stampStyle}
    position={stampPosition}
    spot={spot}
    date={date}
    season={season}
    userOpacity={opacity}
    userScale={scale}
    customOptions={customOptions}
  />
  ```

- [ ] **Step 7.7: Render `CustomizationPanel` between size slider and CTA button**

  In the `controls` View (around line 200–231), add `CustomizationPanel` between the size slider block and the `MeasuredView` wrapping the CTA button:
  ```tsx
  <CustomizationPanel
    options={customOptions}
    onChange={handleCustomChange}
    seasonColor={season.themeColor}
  />
  ```

- [ ] **Step 7.8: Update `StampPreview.test.tsx` mock for CustomizationPanel**

  Open `__tests__/components/stamps/StampPreview.test.tsx`. Add this mock **after** the existing `jest.mock('@/components/stamps/StampOverlay', ...)` block (around line 82):
  ```typescript
  jest.mock('@/components/stamps/CustomizationPanel', () => ({
    CustomizationPanel: () => null,
  }));
  ```

  > **Note on theme mock**: Because `CustomizationPanel` is fully mocked to `null`, it never accesses `STAMP_COLOR_PALETTE` or `SEASON_THEMES` during `StampPreview` tests. Do NOT modify the existing `@/constants/theme` mock — it is correct as-is.

  > **Note on types**: `DEFAULT_CUSTOM_OPTIONS` is a plain object constant from `@/types/hanami` (no native deps). The test already uses the real `@/types/hanami` module (no mock for it), so it resolves correctly without any changes.

  > **Spec deviation note**: The spec says `customText` derivation happens in `StampPreview`. This plan computes it inside `StampRenderer` (which has `spot` + `customOptions` in scope). This is functionally equivalent — `StampPreview` passes `customOptions` as an opaque object and `StampRenderer` derives the final string internally.

  Add this test at the end of the existing `describe('StampPreview', ...)` block:
  ```typescript
  it('still renders CTA button after CustomizationPanel integration', () => {
    // CustomizationPanel is mocked to null; verifies StampPreview renders without error
    const tree = shallowRender(React.createElement(StampPreview, defaultProps));
    const json = JSON.stringify(tree);
    expect(json).toContain('stamp.share');
  });
  ```

- [ ] **Step 7.9: Run all stamp tests**

  ```
  npx jest --testPathPattern="__tests__/components/stamps" --no-coverage
  ```
  Expected: PASS (all existing + new tests)

- [ ] **Step 7.10: Run full test suite**

  ```
  npx jest --no-coverage
  ```
  Expected: all suites pass, no regressions

- [ ] **Step 7.11: Commit**

  ```bash
  git add src/components/stamps/StampPreview.tsx __tests__/components/stamps/StampPreview.test.tsx
  git commit -m "feat(stamps): integrate CustomizationPanel into StampPreview with AsyncStorage persistence"
  ```

---

## Final Verification

- [ ] **Run full suite**

  ```
  npx jest --no-coverage
  ```
  Expected: all suites pass

- [ ] **Check hook count in StampPreview**

  Grep to confirm only one `useEffect` exists:
  ```bash
  grep -c "useEffect" src/components/stamps/StampPreview.tsx
  ```
  Expected: `1` (OTA safety requirement — hook count must not change)

- [ ] **TypeScript compile check**

  ```
  npx tsc --noEmit
  ```
  Expected: no errors

- [ ] **Final commit**

  ```bash
  git commit --allow-empty -m "chore: Phase B1 stamp customization panel complete — npx jest all pass"
  ```

---

## Key Constraints Summary

| Constraint | Rule |
|------------|------|
| OTA safety | Only 1 `useEffect` in `StampPreview`. Extend existing `Promise.all`, never add a second `useEffect`. |
| overflow: hidden | `StampDecoration` renders inside `StampRenderer`'s wrapper `View`, NOT inside individual stamp components. |
| Effect placement | Shadow/glow styles on `StampRenderer`'s wrapper `View`, NOT inside `Animated.View` in `StampOverlay`. |
| MinimalStamp color | Uses `accentColor` prop (not `themeColor`). StampRenderer passes `resolvedColor` as `accentColor`. |
| Color default | `customColor = undefined` → season color. AsyncStorage stores literal string `'undefined'` to distinguish from null (never set). |
| customTextValue | NOT persisted. Transient state in `StampPreview`. Survives panel collapse/expand within the session. |
| Branch dev | All work on `dev` branch. Confirm with `git branch` before committing. |
