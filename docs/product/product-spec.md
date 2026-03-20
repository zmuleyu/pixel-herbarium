# Pixel Herbarium Product Spec

> **Version:** 1.0
> **Date:** 2026-03-15
> **Status:** Core loop finalized, MVP scope defined
> **Source:** 14 research documents + brainstorming analysis

---

## 1. Product Vision

### 1.1 Positioning

Pixel Herbarium is a plant discovery and collection app for the Japanese market. Users photograph real flowers, receive AI-generated pixel art versions, learn flower language (hanakotoba), and build a personal digital herbarium.

**Target audience:** Urban women aged 20-35 in Japan, primarily Tokyo/Osaka/Kyoto.

**Core differentiators (no competitor combines all four):**
- AI plant identification + pixel art generation
- Hanakotoba (花言葉) content depth
- Gamified collection with rarity tiers
- Branded social sharing (LINE bouquet gifting + Instagram posters)

### 1.2 Design Principle

> **Initial phase: emphasize "Collection" + "Social", minimize complexity, lower audience barriers.**

Advanced rules (AI confidence tiers, location-type matching for ★★★) are deferred to later versions. MVP must guarantee a smooth main path: **Photograph → Pixelate → Collect → Share**.

### 1.3 Visual Identity

Adult Kawaii style — retains the warmth of "cute" while removing childishness. Validated by Japanese design research as the mainstream preference for 20-35 year old women (not niche).

Color system (aligned with `src/constants/theme.ts`):

| Role | Color | Hex |
|------|-------|-----|
| Background | Cream white | `#f5f4f1` |
| Primary | Sage green | `#9fb69f` |
| Secondary | Mint green | `#c1e8d8` |
| Accent (flowers) | Blush pink | `#f5d5d0` |
| Accent (map) | Sky blue | `#d4e4f7` |
| Text | Near-black | `#3a3a3a` |

---

## 2. Core Loop — Collection Mechanism

### 2.1 Behavior Chain

```
Step 0: Trigger — User sees a flower in real life
    ↓
Step 1: Camera + AI Identification
    ↓
Step 2: Pixel Art Generation (PH unique — no competitor has this)
    ↓
Step 3: Hanakotoba Reveal — emotional anchoring
    ↓
Step 4: Herbarium Entry — from "archive" to "achievement"
    ↓
Step 5: Gap Discovery — drives next exploration
    ↓
    └──→ Back to Step 0
```

### 2.2 Step-by-Step Psychology

| Step | Motivation Source | Drop-off Risk | Recovery Design |
|------|-----------------|---------------|-----------------|
| 0 → 1 | Curiosity ("what is this?") | User sees flower but doesn't open app | Seasonal push notifications + GPS proximity alerts |
| 1 → 2 | Anticipation | AI fails or too slow | Community help request (FLOWERY validated this) |
| 2 → 3 | Delight + ownership ("my photo became pixel art") | Pixel art quality disappoints | **Highest product risk** — no market precedent for pixel plant art |
| 3 → 4 | Emotional satisfaction + social currency | Flower language too shallow | Multi-dimensional content: JP hanakotoba + Western meaning + color meaning |
| 4 → 5 | Completion compulsion | Collection feels like just filing | Unlock animation + progress bar + rarity reveal |
| 5 → 0 | FOMO + exploration drive | No idea where to find missing plants | Poetic location hints in herbarium ("雨上がりの公園で…") |

### 2.3 Identification Result Page — Information Hierarchy

**First screen (visible without scrolling):**
- Pixel art hero image (generated from user's specific photo, not stock)
- Plant name (Japanese + Latin)
- Hanakotoba one-liner
- Rarity badge (★/★★/★★★)
- "New Discovery" marker (first-time collection)

**Second screen (card flip animation):**
- Detailed hanakotoba (JP flower language + Western meaning + color meaning)
- Bloom season window
- Herbarium position number (e.g., #23/60)

**Fixed bottom action bar:**
- [Add to Herbarium] [Share Poster] [View on Map]

### 2.4 Herbarium Entry Rules

| Scenario | System Behavior |
|----------|----------------|
| First discovery of species | Unlock animation (gray silhouette → full-color pixel art) + progress update "X/60種" + ★★★ triggers gold particle effect |
| Repeat discovery of same species | Does NOT re-count toward progress. Records new location + timestamp → updates personal discovery map |
| AI identification fails | Guide user to post to community for help → community confirmation allows retroactive entry |
| Low AI confidence (multiple candidates) | Show Top 3 candidates + user manual confirmation → confirmed result enters herbarium |

### 2.5 Herbarium Display Rules

| Species Status | Visual Treatment |
|---------------|-----------------|
| Collected | Full-color pixel art + hanakotoba + discovery record |
| Not found (currently in season) | Budding/half-bloom silhouette + poetic location hint |
| Not found (out of season) | Pale gray silhouette + bloom season label |
| Season expired, not collected | Falling-petal silhouette + "来年また咲きます" + next appearance date |
| ★★★ rare, collected | Gold border + special card face |

### 2.6 Data Permanence

- Collection records are **permanent** — never lost due to subscription lapse
- When subscription expires: herbarium remains browsable, new identifications limited to 5/month
- Device migration: iCloud backup sync

---

## 3. Seasonal System — FOMO Engineering

### 3.1 Rarity Distribution

Aligned with code (`src/constants/plants.ts` + `supabase/seed/plants_jp_spring.sql`):

| Rarity | Count | Percentage | Appearance Rule | Design Intent |
|--------|-------|------------|----------------|---------------|
| ★ Common | 30 | 50% | Year-round or multi-season | New users always have something to collect |
| ★★ Uncommon | 20 | 33% | Current season window only | Seasonal revisit motivation |
| ★★★ Limited | 10 | 17% | Season + narrow date range (`available_window` in DB) | Deep exploration + sharing material + conversion driver |

**Code reference:** `available_window DATERANGE` column in `supabase/migrations/002_create_plants.sql` — `NULL` = always available; set value = seasonal-limited.

### 3.2 Season Transition — Three-Phase UX

**花開き (Season Opens):**
- New seasonal plants appear as budding silhouettes in herbarium
- Single push notification: "春の花たちが目覚めました"

**見頃 (Mid-Season):**
- Budding → half-bloom silhouettes + location-type poetic hints
- Petal-shape progress indicator implies time flowing (NOT countdown timer)

**花散り (Season Closes):**
- Uncollected ★★ → falling-petal silhouette + "来年また咲きます"
- Uncollected ★★★ → semi-transparent + lock icon + "次の出会い: 2027年3月下旬ごろ"
- Collected plants → permanently retained, unaffected

### 3.3 Tone Constraints

- Maximum 3 push notifications per season (open / mid / close)
- **Forbidden:** red color, numerical countdowns, "you missed it" phrasing
- **Required:** natural metaphors (bud → bloom → fall) instead of numerical pressure
- Season end = silence. Do not create urgency outside bloom seasons.

### 3.4 Year-Round Rhythm

Every month has at least 1 ★★ plant entering its discovery window. No dead months.

Peak traffic: March-April (cherry blossom season) — MVP launch targets this window.

### 3.5 MVP Simplification

- Implement ★ and ★★ only. ★★★ location-type matching deferred until user base is sufficient.
- Season transitions use static state changes; animation polish comes later.
- ★★ limited by time window only (no location-type requirement in MVP).

---

## 4. Viral Sharing System

### 4.1 Share Trigger Points

| Trigger | Motivation | Priority |
|---------|-----------|----------|
| First collection of new species | Surprise + aesthetic display | MVP |
| Collecting ★★ or above | Rarity bragging | MVP |
| Flower language with social meaning | Gifting ("this flower's meaning is for you") | MVP |
| Herbarium milestone (10/30/60) | Achievement display | Post-MVP |

### 4.2 Two Share Formats

**Instagram Stories (9:16):**
- Pixel art hero image centered
- Plant name + hanakotoba one-liner + location + date
- Bottom brand signature: "Pixel Herbarium — あなただけの花図鑑"
- No QR code (breaks aesthetic). Rely on sharer adding Link Sticker.

**LINE Card (1:1):**
- Pixel art + plant name + hanakotoba
- Bouquet gifting copy: "この花をあなたに贈ります"
- Tappable link (LINE URL Scheme)

### 4.3 Viewer → Download Conversion Path

```
Layer 1 (Visual):  Pixel art style stands out in photo-heavy feeds → "What's this?"
Layer 2 (Info):    Hanakotoba sparks curiosity → "Does the flower near me have a meaning too?"
Layer 3 (Social):  Location resonance → "I go there too!"
Layer 4 (Action):  Search App Store / tap LINE link / ask the sharer
```

### 4.4 Channel Priority

**LINE bouquet gifting > Instagram Stories poster > X (Twitter) hashtag**

Rationale: LINE has highest conversion rate (strong social ties + emotional gifting motive) and bouquet gifting is PH's unique zero-competitor feature. Instagram has broader reach but longer conversion funnel.

### 4.5 MVP Simplification

- Single poster template (no style variants)
- Bouquet gifting advanced rules (e.g., 7-day expiry) deferred
- V1: Save image to camera roll → user shares manually. System Share Sheet integration is Step 2.

---

## 5. System Interactions

```
Collection ─── Entry triggers rarity reveal ──→ FOMO system provides rarity rules
Collection ─── Gap page shows season hints ──→ FOMO system provides season windows
Collection ─── Pixel art + hanakotoba ──→ Sharing system provides share content

FOMO system ─── Season-open push ──→ Drives user back to collection loop
Sharing system ─── New user downloads via poster ──→ Enters collection loop
```

The three systems form a closed loop:
1. Collection mechanism generates shareable content (pixel art + hanakotoba)
2. FOMO system drives revisits and creates urgency to share before season ends
3. Sharing brings new users who enter the collection loop

---

## 6. MVP Scope

### Included in MVP

| Feature | Status in Codebase |
|---------|-------------------|
| Camera → AI identification | Edge function exists (`supabase/functions/identify/`) |
| Photo → pixel art generation | Edge function exists (`supabase/functions/pixelate/`) |
| Hanakotoba display on result page | DB column exists (`plants.hanakotoba`) |
| Herbarium grid (60 slots) | Tab exists (`src/app/(tabs)/herbarium.tsx`) |
| Discovery map (basic) | Tab exists (`src/app/(tabs)/map.tsx`) |
| 5 free identifications/month | Quota system exists (`supabase/migrations/007_create_user_quotas.sql`) |
| Share poster (save to camera roll) | `react-native-view-shot` in dependencies |
| 60 plant seed data (spring) | Seed exists (`supabase/seed/plants_jp_spring.sql`) |

### Deferred to Post-MVP

| Feature | Reason |
|---------|--------|
| ★★★ location-type matching | Needs user base for location data density |
| City heat map with discovery density | Needs accumulated user discovery data |
| Subscription paywall + Apple IAP | Core loop must be validated first |
| GPS proximity notifications | Requires background location permission (high friction) |
| Season transition animations | Polish phase |
| Bouquet gifting 7-day expiry | Social feature refinement |
| Herbarium milestone achievements | Gamification layer 2 |

---

## 7. Future Modules (Not Yet Designed)

| Module | Description | Dependency |
|--------|------------|------------|
| City Discovery Map | Heat map, exploration radius, GPS notification rules | Core loop validation + user data accumulation |
| Subscription Conversion | Paywall trigger timing, pricing, trial period | Core loop retention data |
| Onboarding Flow | First-time guidance, permission request timing | Final UI design |
| Hanakotoba Database | 60 species × multi-dimensional content asset schema | Content creation pipeline |
| Pixel Art Generation Pipeline | AI identification → pixel conversion technical spec | ML model selection |
| Data Flywheel Cold Start | Seed user strategy, minimum viable heat map | Launch timing decision |

---

## Appendix: Research Material Index

All research documents are in `docs/research/`:

| Document | Content |
|----------|---------|
| `research/market/adult-kawaii-japan-app-analysis.md` | Adult Kawaii visual style validation |
| `research/competitor/flowery-app-deep-analysis.md` | FLOWERY competitor deep dive |
| `research/competitor/cross-competitor-ui-analysis.md` | Cross-competitor UI/UX analysis |
| `research/competitor/market-validation-deep-dive.md` | Market validation + GPS mechanism + data flywheel |
| `research/market/japan-audience-analysis.md` | Japan market TAM/SAM/SOM |
| `research/competitor/sakura-navi-gps-stamp-deep-dive.md` | GPS stamp card mechanism |
| `research/competitor/sakura-navi-myspot-calendar-deep-dive.md` | MY SPOT + calendar features |
| `research/competitor/weathernews-sakura-crowdsourcing-deep-dive.md` | Crowdsourcing data flywheel (HBS case) |
| `research/platform/line-analysis-layer1~3.md` | LINE platform signal extraction pipeline |
