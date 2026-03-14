# Design System

> Visual design reference for Pixel Herbarium.
> All values aligned with `src/constants/theme.ts`.

---

## 1. Visual Identity — Adult Kawaii

### Definition

Adult Kawaii retains the emotional warmth of "cute" (温かさ、治癒、軽さ) while removing childishness and adding restrained sophistication.

**NOT:** candy pink, rounded blob characters, high-saturation rainbow palettes.
**YES:** cream tones, sage green, watercolor textures, thin-line illustrations, generous whitespace.

### Why This Works for PH's Audience

Research validation (from `adult-kawaii-japan-app-analysis.md`):
- Japanese women aged 20-35 prefer "ナチュラル系" (natural-style) color palettes: green × cream
- Sage green + cream is the dominant color combination in Japanese lifestyle brands targeting this demographic (Niko and..., NATURAL KITCHEN)
- Aligns with global 2025-2026 "soft naturalism" mobile design trend (Envato, UXPin)
- Pixel art nostalgia (FC/SFC era) has established resonance in this age group (Shibuya Pixel Art 2024)

---

## 2. Color System

### Primary Palette

Mapped directly to `src/constants/theme.ts`:

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Background | Cream white | `#f5f4f1` | All screen backgrounds (NOT pure white) |
| Primary | Sage green | `#9fb69f` | Navigation active state, primary buttons, plant theme |
| Secondary | Mint green | `#c1e8d8` | Secondary buttons, card backgrounds, success states |
| Accent | Blush pink | `#f5d5d0` | Flower elements, ★★★ rarity, cherry blossom seasonal |
| Map accent | Sky blue | `#d4e4f7` | Map UI, ★★ rarity, hydrangea seasonal |
| Highlight | Cream yellow | `#fff8dc` | Notifications, new discovery badges |
| Text | Near-black | `#3a3a3a` | Body text (NOT pure black — maintains warmth) |
| Text secondary | Medium gray | `#7a7a7a` | Captions, metadata |
| Border | Light gray | `#e8e6e1` | Dividers, card borders |

### Rarity Colors

```typescript
rarity: {
  common:   '#9fb69f',  // ★    Sage green (blends with UI)
  uncommon: '#d4e4f7',  // ★★   Sky blue (gently distinct)
  rare:     '#f5d5d0',  // ★★★  Blush pink (emotionally warm, special)
}
```

### Seasonal Colors

```typescript
seasonal: {
  sakura:  '#f5d5d0',  // Spring — cherry blossom pink
  ajisai:  '#d4e4f7',  // Rainy season — hydrangea blue
  momiji:  '#e8a87c',  // Autumn — maple warm orange
}
```

**Summer and Winter** seasonal colors are not yet defined in code. Suggested additions:
- Summer (ひまわり): `#f5e6a3` — sunflower warm yellow
- Winter (椿): `#c9a0a0` — camellia muted rose

---

## 3. Typography

From `src/constants/theme.ts`:

| Usage | Font Family | Rationale |
|-------|------------|-----------|
| Body text | System (San Francisco on iOS) | Maximum readability |
| Labels, buttons, display | `HiraginoMaruGothicProN` (丸ゴシック) | Japanese aesthetic — rounded sans-serif conveys Adult Kawaii warmth without childishness |

### Font Size Scale

```
xs: 11  — Metadata, timestamps
sm: 13  — Captions, secondary info
md: 15  — Body text
lg: 18  — Section headers
xl: 22  — Page titles
xxl: 28 — Hero display (plant names on result page)
```

### Line Height

`1.7` — intentionally spacious. Japanese typographic convention for comfortable reading, especially for mixed kanji/hiragana text.

---

## 4. Spacing & Radius

### Spacing Scale

```
xs:  4px  — Tight element groups
sm:  8px  — Between related elements
md: 16px  — Standard padding
lg: 24px  — Section separation
xl: 32px  — Major section breaks
```

### Border Radius

```
sm:   6px  — Small buttons, tags
md:  12px  — Cards, input fields
lg:  20px  — Large cards, modals
full: 9999px — Circular elements (avatars, FAB)
```

---

## 5. Illustration Style

### Pixel Art Constraints

| Property | Value | Rationale |
|----------|-------|-----------|
| Canvas size | 256×256 px (stored sprite) | Matches `pixel_sprite_url` in DB schema |
| Palette saturation | Low-to-medium | Must harmonize with Adult Kawaii cream/sage palette, NOT retro-game high-saturation |
| Outline style | 1px dark outline + anti-alias edge softening | "Cute but refined" — not hard pixel edges |
| Background | Transparent (composed on cream bg at render) | Allows flexible card/poster composition |

### Pixel Art Tone

- **DO:** Gentle, botanical illustration quality rendered in pixel form. Think "digital pressed flower."
- **DON'T:** Game-sprite style, chibi characters, flashy effects.
- Collected ★★★ rare plants may have subtle gold particle accents — but never overwhelming.

### Icon Style

Current: Ionicons system icons (`src/app/(tabs)/_layout.tsx`). Functional but generic.

Future consideration: Custom pixel-art-style tab icons to reinforce brand identity (post-MVP).

### Animation Tone

| Property | Value | Rationale |
|----------|-------|-----------|
| Easing | `ease-in-out` | Smooth, not bouncy |
| Duration | 0.3–0.5s | Perceptible but not slow |
| Character | Light elastic | Gentle, not cartoon-bouncy |

**Specific animations:**
- Pixel art generation: particles coalesce into plant form (1–1.5s)
- Herbarium unlock: gray silhouette → color fade-in + subtle shimmer
- ★★★ discovery: gold particles + gentle screen pulse (no shake)
- Card flip: hanakotoba reveal with 180° Y-axis rotation

---

## 6. Tone of Voice

### Core Principle

Warm, poetic, never anxious. The app speaks like a gentle botanist companion, not a gamification engine.

### Language Examples

| Context | ✅ Do | ❌ Don't |
|---------|-------|---------|
| New discovery | "新しい発見！" (New discovery!) | "GET!" / "UNLOCKED!" |
| Season opens | "春の花たちが目覚めました" (Spring flowers have awakened) | "New season starts NOW!" |
| Season closes | "来年また咲きます" (They'll bloom again next year) | "You missed 3 flowers!" |
| Missing plant hint | "雨上がりの公園で、紫陽花があなたを待っています" (After the rain, hydrangeas await you in the park) | "Go to a park to find hydrangeas" |
| Rarity discovery | "珍しい出会いですね" (What a rare encounter) | "RARE PULL!!!" |

### Push Notification Rules

- Maximum 3 per season (open / mid / close)
- Always in gentle Japanese, never urgent
- No emoji in push text (clean, not playful)
- Example: "梅雨の季節、紫陽花が街を彩り始めました" (Rainy season — hydrangeas begin to color the city)
