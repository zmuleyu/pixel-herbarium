# Brand Visual System Design — 花図鉑

> **Status**: Draft
> **Date**: 2026-03-21
> **Scope**: Layer 1-2 — App Icon + Splash + Brand Colors + Tab Bar Icons
> **Target Version**: v1.2+
> **OTA Impact**: Mixed (icon/splash = native build; colors/tab icons = OTA safe)

---

## 1. Problem Statement

The app currently uses **Expo default placeholder assets**:
- App Icon: Blue "A" logo (Expo default)
- Splash Screen: Concentric circles grid pattern (Expo default)
- Tab Bar: Generic Ionicons (home/camera/settings)
- No brand accent color for CTAs and brand elements

These placeholders undermine the app's professional presence on the App Store and fail to communicate the product's identity as a **Japanese seasonal flower journal**.

## 2. Design Direction

### 2.1 App Icon — Elegant Herbarium Journal

**Concept**: An open field journal/herbarium notebook with a botanical-style sakura blossom on the left page, field note lines on the right, and subtle pixel-art leaf accents.

**Visual Elements**:
| Element | Description | Color |
|---------|-------------|-------|
| Background | Cream gradient | `#f8f6f3` → `#ede9e3` |
| Journal cover | Rounded rectangle, white pages | `#ffffff` → `#faf8f5`, stroke `#e8e6e1` |
| Spine | Vertical dividing line | `#e8e6e1` |
| Sakura (left page) | 5-petal botanical style, inner gradient | `#f5d5d0` outer, `#e8a5b0` inner (40% opacity) |
| Stamen center | Double circle | `#d4a645` outer, `#f5e6a3` inner |
| Field note lines (right page) | 4 horizontal lines, varying width | `#e8e6e1` (45% opacity) |
| Pixel leaf accent (right page) | 3-pixel cluster | `#c1e8d8` + `#9fb69f` (50% opacity) |
| Floating petals | 2 ellipses outside book | `#f5d5d0` (25-35% opacity) |
| Brand text | 「花図鉑」serif font | `#D4537E` |

**Size-Adaptive Strategy**:
| Size | Rendering |
|------|-----------|
| ≥ 60pt (App Store) | Full: journal + flower + field notes + text + floating petals |
| 40pt (Spotlight) | Journal + flower + field notes, no text |
| 29pt (Settings) | Journal silhouette + simplified flower, no text |
| 16pt (Favicon) | Flower silhouette on white rounded square only |

### 2.2 Splash Screen

**Layout**:
- Background: `#f5f4f1` (matches existing `app.json`)
- Center: App Icon artwork (without iOS corner radius clipping)
- Below icon: 「花図鉑」in Georgia/Hiragino Mincho serif, `#D4537E`
- Sub-text: `PIXEL HERBARIUM` in monospace, `#aaaaaa`
- Format: PNG 1284×2778 (iPhone 15 Pro Max safe area)
- `resizeMode`: `contain` (keep current config)

### 2.3 Brand Color System — Dual Layer

**Existing UI Layer** (no changes):
| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#f5f4f1` | App background |
| `sakura.primary` | `#e8a5b0` | Tab bar active, season UI, cards |
| `blushPink` | `#f5d5d0` | Flower accents, backgrounds |
| `plantPrimary` | `#9fb69f` | Botanical elements |
| All seasonal colors | (unchanged) | Season-specific theming |

**New Brand Layer** (additions to `theme.ts`):
```typescript
export const brand = {
  accent: '#D4537E',  // CTA buttons, icon text, watermark borders
  dark: '#A05070',    // Pressed states, secondary brand text
} as const;
```

**Usage Rules**:
- `brand.accent` → App Icon text, CTA buttons, watermark border color (v2), brand badges
- `brand.dark` → Pressed/hover states of brand elements
- NOT for: tab bar active color (stays `season.primary`), card backgrounds, body text

### 2.4 Tab Bar Icons — Custom SVG

Replace Ionicons with custom SVG icons that echo the App Icon's visual language.

**3 Visible Tabs**:

| Tab | Current (Ionicons) | New (Custom SVG) | Rationale |
|-----|-------------------|-------------------|-----------|
| ホーム | `home-outline` / `home` | Open journal book (echoes App Icon) | Reinforces "field journal" brand identity |
| 打卡 | `camera-outline` / `camera` | Dashed circle (seal/stamp) + sakura center | Evokes "stamping a record", matches v2 seal watermark style |
| 設定 | `settings-outline` / `settings` | Gear with subtle leaf accent | Maintains universal recognition + botanical touch |

**Icon Specification**:
- viewBox: `0 0 24 24`
- Stroke width: 1.5px (outline state), filled for active state
- Stroke cap/join: round
- Color: `currentColor` for structural elements; inline `#f5d5d0` / `#9fb69f` for decorative fills
- Focused state: fill structural shapes with `color` prop (season primary)

**Implementation**:
- Create `src/components/TabBarIcon.tsx` — SVG component accepting `{ name, focused, color, size }` props
- Uses `react-native-svg` (already a dependency via Expo)
- Replace `<Ionicons>` in `_layout.tsx` with `<TabBarIcon>`

## 3. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `assets/icon.png` | Replace | New 1024×1024 App Icon PNG |
| `assets/icon.svg` | Create | Source SVG for App Icon |
| `assets/favicon.png` | Replace | 16px simplified version |
| `assets/splash-icon.png` | Replace | Branded splash screen artwork |
| `assets/android-icon-foreground.png` | Replace | Android adaptive icon foreground |
| `assets/android-icon-background.png` | Replace | Android adaptive icon background |
| `src/constants/theme.ts` | Modify | Add `brand` object |
| `src/components/TabBarIcon.tsx` | Create | Custom SVG tab bar icon component |
| `src/app/(tabs)/_layout.tsx` | Modify | Replace Ionicons with TabBarIcon |
| `docs/ICON_STYLE.md` | Create | Icon design specification for consistency |

## 4. Technical Approach

### 4.1 SVG Icon Creation
- **Route**: SVG native (zero external API dependency)
- **Process**: Generate SVG code → HTML preview page (light/dark bg toggle) → iterate 5-20 rounds → SVGO optimize → Sharp batch export
- **Tools**: Node.js `sharp` for SVG→PNG conversion at all required sizes

### 4.2 Export Sizes
```
iOS:   20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024
Android: 48, 72, 96, 144, 192, 512 (foreground + background separate)
Web:   16, 32, 48 (favicon)
```

### 4.3 Deployment Strategy
- **OTA-safe changes** (brand colors + tab bar icons): can ship immediately via OTA
- **Native changes** (icon/splash PNGs): bundle with next EAS Build
- **Recommendation**: Complete all design work first → ship OTA parts → accumulate icon/splash for v1.2 EAS Build

## 5. Constraints

- **Expo OTA**: Changing `assets/icon.png` and `assets/splash-icon.png` requires EAS Build, NOT OTA
- **`app.json` ios/android segments**: NOT modified (no bundleIdentifier, permissions, or config changes)
- **Tab bar order**: Fixed array in `ALL_TABS` — only replace icon rendering, never reorder
- **`react-native-svg`**: Already available through Expo, no new native dependency

## 6. Verification

- [ ] App Icon SVG renders correctly in HTML preview (light + dark backgrounds)
- [ ] App Icon PNG readable at all export sizes (especially 16px, 29px)
- [ ] Splash screen matches `app.json` backgroundColor `#f5f4f1`
- [ ] `brand.accent` integrates without affecting existing theme consumers
- [ ] Tab bar icons render with correct focused/unfocused states
- [ ] Tab bar season color theming still works (active color changes by season)
- [ ] `pnpm test` passes (theme test suite + component tests)
- [ ] EAS Build succeeds with new icon assets
- [ ] Android adaptive icon renders correctly with foreground/background split
