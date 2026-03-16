# Share Poster — Design Spec

**Date:** 2026-03-16
**Scope:** Save-to-camera-roll + poster design polish + LINE Card 1:1 format
**MVP constraint:** Generate image → save to Photos. No social platform SDK integration.

---

## 1. Problem

The existing SharePoster component (360x640, 9:16) provides basic sharing via the native share sheet, but:

- No "save to camera roll" option (users must go through the share sheet to save)
- Only one format (9:16 Story); LINE Card (1:1) is missing per product spec
- Poster design is flat (no gradient, no discovery metadata, weak branding)
- No format selection UI; the share action fires immediately

## 2. Solution Overview

Extend `SharePoster` with a `format` prop (`'story' | 'line'`), polish the visual design, and introduce a `ShareSheet` bottom-sheet modal that lets users preview both formats, then save or share.

### File changes

| File | Action | Purpose |
|------|--------|---------|
| `src/components/SharePoster.tsx` | Modify | Add format prop, LINE 1:1 layout, gradient bg, design polish |
| `src/components/ShareSheet.tsx` | **New** | Bottom Sheet modal (preview + save/share) |
| `src/app/plant/[id].tsx` | Modify | Share button opens ShareSheet; remove inline captureRef logic |
| `src/app/(tabs)/discover.tsx` | Modify | Same; clean up old off-screen poster rendering |
| `src/i18n/ja.json` | Modify | Add `share.*` keys |
| `src/i18n/en.json` | Modify | Add `share.*` keys |
| `package.json` | Modify | Add `expo-media-library` |

### New dependency

- `expo-media-library` — save images to device photo library (requires runtime permission)

No other new dependencies. `react-native-view-shot` and `expo-sharing` are already installed.

---

## 3. SharePoster Component

### Props

```typescript
interface SharePosterPlant {
  name_ja: string;
  name_latin: string;
  rarity: number;
  hanakotoba: string;
  pixel_sprite_url: string | null;
  cityRank: number | null;
}

interface SharePosterProps {
  plant: SharePosterPlant;
  format: 'story' | 'line';
  discoveryDate?: string;   // ISO date string
  discoveryCity?: string;   // Reverse-geocoded city name
}
```

### 9:16 Story Poster (360x640)

Improvements over current design:

- **Gradient background** via `getPlantGradientColors()` (rarity-mapped) instead of flat cream
- **Floral divider** (`── ✿ ──`) replacing plain line — reinforces botanical theme
- **Discovery metadata** (city + date) below hanakotoba — adds personal context
- **Improved footer**: `· 花図鉑 — Pixel Herbarium ·` with rarity-colored dots

Layout (top to bottom):
1. Rarity accent strip (4px, full-width)
2. Pixel art sprite (160x160, centered, on gradient background)
3. Rarity label (★/★★/★★★)
4. Plant name (name_ja, xxl, display font)
5. Latin name (name_latin, sm, italic)
6. Floral divider (── ✿ ──)
7. "花言葉" label + hanakotoba in 「brackets」
8. City rank (optional): "全国で N 番目の発見者 🌿"
9. City + date: "東京 · 2026年3月15日"
10. Footer: `· 花図鉑 — Pixel Herbarium ·`

### 1:1 LINE Card (360x360)

New format optimized for LINE/chat sharing:

- **Horizontal layout**: image left, text right (compact for square)
- **Smaller sprite**: 120x120
- **Gift copy**: "この花をあなたに贈ります 🌸" (from product spec)
- **Same gradient background and footer**

Layout:
1. Rarity accent strip (4px, full-width)
2. Horizontal row:
   - Left: pixel art sprite (120x120)
   - Right: name_ja, name_latin, floral divider, "花言葉", hanakotoba
3. Gift copy: "この花をあなたに贈ります 🌸"
4. Footer: `· 花図鉑 — Pixel Herbarium ·`

### Rendering

Both formats render off-screen (`position: absolute, left: -9999`) inside the ShareSheet modal. Each has its own ref for `captureRef()`.

---

## 4. ShareSheet Component

### Props

```typescript
interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  plant: SharePosterPlant;
  discoveryDate?: string;
  discoveryCity?: string;
}
```

### Implementation

Built with React Native `Modal` (transparent) + `Animated.Value` for slide-in from bottom. No third-party bottom sheet library.

### Layout

```
┌─────────────────────────────────────┐
│          ──────  (drag handle)      │
│                                     │
│   ┌─────────┐     ┌─────────┐      │
│   │  9:16   │     │  1:1    │      │   Thumbnail previews
│   │  Story  │     │  LINE   │      │   Selected: sage green border
│   │         │     │  Card   │      │   Unselected: light gray border
│   └─────────┘     └─────────┘      │
│   Instagram Stories    LINE Card    │   Format labels
│                                     │
│  ┌───────────────┐ ┌─────────────┐ │
│  │  Save to      │ │  Share      │ │   Action buttons
│  │  Photos       │ │             │ │
│  └───────────────┘ └─────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Interaction flow

1. User taps share button → `visible = true`, modal slides in
2. Default selection: Story (9:16)
3. Tap thumbnail to switch format
4. **Save**: `captureRef()` → `MediaLibrary.requestPermissionsAsync()` → `MediaLibrary.saveToLibraryAsync()` → inline feedback "保存しました ✓" (2s, then revert)
5. **Share**: `captureRef()` → `Sharing.shareAsync()` → native share sheet
6. Tap backdrop or drag down → `onClose()`

### Permission handling

- First save triggers `MediaLibrary.requestPermissionsAsync()`
- Granted → save and show success
- Denied → show "相册へのアクセスを許可してください" in place of success message
- No repeated permission prompts (iOS only allows one)

### Save feedback

Inline text replacing the save button label for 2 seconds: "保存しました ✓". No external Toast library. Matches Adult Kawaii quiet aesthetic.

---

## 5. Integration Points

### plant/[id].tsx

```diff
- const posterRef = useRef<View>(null);
- const [sharing, setSharing] = useState(false);
- async function handleShare() { ... captureRef ... Sharing.shareAsync ... }
+ const [shareSheetVisible, setShareSheetVisible] = useState(false);

  // Share button onPress:
- onPress={handleShare}
+ onPress={() => setShareSheetVisible(true)}

  // Add at end of component:
+ <ShareSheet
+   visible={shareSheetVisible}
+   onClose={() => setShareSheetVisible(false)}
+   plant={{
+     name_ja: plant.name_ja,
+     name_latin: plant.name_latin,
+     rarity: plant.rarity,
+     hanakotoba: plant.hanakotoba ?? '',
+     pixel_sprite_url: heroImageUri,
+     cityRank: null,
+   }}
+   discoveryDate={discoveries[0]?.created_at}
+   discoveryCity={discoveries[0]?.city}
+ />
```

The inline posterRef / captureRef / Sharing logic is removed; ShareSheet manages its own refs and capture.

### discover.tsx

```diff
- const posterRef = useRef<View>(null);
- async function handleShare() { ... captureRef ... Sharing.shareAsync ... }
- <View style={styles.posterOffscreen}><SharePoster ref={posterRef} ... /></View>
+ const [shareSheetVisible, setShareSheetVisible] = useState(false);

  // Share button in success modal:
- onPress={handleShare}
+ onPress={() => setShareSheetVisible(true)}

+ <ShareSheet
+   visible={shareSheetVisible}
+   onClose={() => setShareSheetVisible(false)}
+   plant={{
+     name_ja: result.plant.name_ja,
+     name_latin: result.plant.name_latin,
+     rarity: result.plant.rarity,
+     hanakotoba: result.plant.hanakotoba ?? '',
+     pixel_sprite_url: result.plant.pixel_sprite_url,
+     cityRank: result.cityRank,
+   }}
+   discoveryDate={new Date().toISOString()}
+   discoveryCity={capture.city}
+ />
```

Old off-screen poster rendering (`posterOffscreen` style + `SharePoster ref`) is removed entirely.

---

## 6. Internationalization

### New keys

```json
{
  "share": {
    "storyLabel": "Instagram Stories / Instagram Stories",
    "lineLabel": "LINE Card / LINE Card",
    "save": "保存到相册 / Save to Photos",
    "share": "分享 / Share",
    "saved": "保存しました ✓ / Saved ✓",
    "permissionRequired": "相册へのアクセスを許可してください / Please allow photo library access",
    "lineGiftCopy": "この花をあなたに贈ります 🌸 / Sending this flower to you 🌸"
  }
}
```

All poster body text (花言葉, plant names, footer) uses existing constants/data — no new i18n keys needed for poster content itself.

---

## 7. Testing Strategy

### SharePoster (unit)
- Renders story format with correct dimensions (360x640)
- Renders line format with correct dimensions (360x360)
- Displays plant name, hanakotoba, rarity label
- Shows discovery date and city when provided
- LINE format shows gift copy text
- Fallback emoji when no pixel_sprite_url

### ShareSheet (unit)
- Opens when visible=true, closed when false
- Default selection is story format
- Tapping LINE thumbnail switches selection
- Save button calls MediaLibrary.saveToLibraryAsync with captured URI
- Share button calls Sharing.shareAsync with captured URI
- Shows permission message when MediaLibrary permission denied
- Shows "saved" feedback after successful save
- Calls onClose when backdrop pressed

### Integration
- plant/[id].tsx share button opens ShareSheet (not direct share)
- discover.tsx share button opens ShareSheet
- No leftover off-screen poster rendering in discover.tsx

---

## 8. Design Constraints

- **Adult Kawaii tone**: warm, poetic, no urgency. "保存しました ✓" not "SAVED!"
- **Rarity gradient**: reuse `getPlantGradientColors()` for poster backgrounds
- **Floral divider**: `── ✿ ──` not plain line — botanical theme consistency
- **LINE gift copy**: "この花をあなたに贈ります 🌸" (exact wording from product spec)
- **No QR code** on posters (spec: "breaks aesthetic")
- **Footer branding**: `· 花図鉑 — Pixel Herbarium ·` — bilingual, subtle
