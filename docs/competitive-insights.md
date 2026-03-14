# Competitive Insights

> Quick-reference document for design decisions informed by competitor analysis.
> Full research: `../补充材料/`

---

## 1. Market Validation — Why This Product

### Signal A: Unmet Collection Need (PlantSnap)

PlantSnap has 50M+ users globally. A real user voluntarily posted:

> **"An idea to make it more interactive is to have & earn badges that you can collect when you find and snap different species and maybe even colors. Kind of like a Pokédex style."**
> — PlantSnap App Store review

PlantSnap's own marketing teases this: *"See how many you can collect!"* — but the product has zero collection mechanics. No plant identification app has implemented gamified collection as of March 2026.

### Signal B: GPS Unlock Drives Real-World Action (Sakura Navi)

Sakura Navi (JMC) — a paid seasonal app ($4.99/year) — reached **#1 in App Store Travel (Paid) across 20 regions** in 2026. Its core mechanic:

> *"Visited Stamp is available only when you are actually near the location."*

Users must physically visit cherry blossom spots to unlock stamps. Stamps persist across seasons. This validates that GPS-gated collection drives real-world exploration behavior strong enough to sustain annual repurchases.

### Signal C: Participation = Enjoyment (Weathernews)

Weathernews' Sakura Project — recorded as Harvard Business School Case 617-053 — built a data flywheel from 11,200 volunteer cherry blossom reporters. HBS concluded:

> *"It changed the face of weather forecasting in Japan."*

Key insight from Weathernews spokesperson:

> *"Every participant is enjoying watching the sakura every day and sharing the information with others."*

Contributors are not "working for free" — they're doing what they already enjoy. PH's loop mirrors this: users photograph flowers they already want to photograph; the app adds pixel art + collection on top.

---

## 2. Competitor Matrix

| Feature | GreenSnap | PictureThis | FLOWERY | 花しらべ | PlantSnap | **Pixel Herbarium** |
|---------|:---------:|:-----------:|:-------:|:-------:|:---------:|:-------------------:|
| AI plant identification | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pixel art generation | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ Unique** |
| Hanakotoba depth | ❌ | ❌ | ⚠️ Basic | ⚠️ Partial | ❌ | **✅ Deep** |
| Collection/rarity system | ❌ | ⚠️ Weak | ❌ | ❌ | ❌ | **✅** |
| City discovery map | ❌ | ❌ | ❌ | ❌ | ⚠️ SnapMap | **✅** |
| Branded share posters | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Bouquet/gift social | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ Unique** |
| Seasonal limited content | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Adult Kawaii design | ❌ | ❌ | ⚠️ Close | ❌ | ❌ | **✅** |
| Ad-free experience | ❌ | ❌ Aggressive | ❌ Has ads | ❌ Has ads | ❌ Has ads | **✅** |

**PH has 4 features no competitor offers:** pixel art, bouquet gifting, seasonal limited collection, branded share posters.

---

## 3. Key Mechanisms to Learn From

### 3.1 Sakura Navi — GPS Unlock + Persistence

**Rules to adopt:**
- Must be physically near to unlock (GPS verification)
- Stamps persist across seasons — never reset
- "Can stamp later even when away" — if you visited, you can retroactively stamp (handles network issues)
- Location permission required — stamp feature disabled without it

**Rules to upgrade:**
- Sakura Navi is location-only (where did I go?). PH adds species dimension (what did I find?) → two-dimensional collection matrix.
- Sakura Navi uses pre-set ~1,000 spots. PH uses user-generated discovery points → no cold-start POI database needed.

### 3.2 Sakura Navi — MY SPOT + Calendar

**Key design: "Minimum input, maximum output."**
- User does ONE action: tap "Add to MY SPOT"
- System automatically: marks bloom dates on calendar, sends proximity alerts, tracks visit history

**For PH:** User does ONE action: take a photo. System automatically: identifies plant, generates pixel art, records to herbarium, marks on map, updates seasonal calendar.

### 3.3 Weathernews — Data Flywheel

**Flywheel structure:**
```
Users report local bloom status
  → Algorithm combines 11,200 reports into precise local forecasts
    → More precise forecasts attract more users
      → More users = more reports = even more precise
```

**For PH:**
```
Users photograph and identify plants (with GPS)
  → Discovery data populates city heat map
    → Richer map attracts new users ("others found XX species here!")
      → More users = denser map = stronger FOMO → more discoveries
```

**Critical lesson:** Weathernews started with 11,200 core contributors, not 13M downloads. PH needs 100-200 Tokyo seed users to generate a viable heat map, not mass adoption.

### 3.4 FLOWERY — Flower Language Display

**Validated design:** Showing hanakotoba alongside identification results — users confirmed this as FLOWERY's core differentiator.

**FLOWERY's limitations (PH's opportunity):**
- Flower language content is shallow (single line)
- No pixel art, no collection system, no rarity
- Product is in maintenance mode (developer Lisfee spread across multiple apps)
- Share format is plain screenshots — zero viral design

### 3.5 PictureThis — Paywall Trigger Timing

**Well-designed conversion funnel:**
1. After 3rd identification: soft prompt (dismissible card)
2. When accessing "advanced features" (pest diagnosis): medium gate
3. After hitting free daily limit (~3/day): hard gate (main conversion point)

**For PH:** Adapt the 3-step escalation but with PH's unique hooks:
1. After 3rd identification: show "Premium members see all 60 species' hanakotoba in detail"
2. When trying to share ★★ poster: unlock full poster template library
3. After 5th identification/month: hard gate

---

## 4. Design Anti-Patterns — Competitors' Mistakes

### ❌ Ad Interference

PictureThis and PlantSnap's most frequent negative reviews:

> *"The constant interference with subscription ads is irritating."* — PictureThis user
> *"don't waste your time"* — PlantSnap user (Google Play 3.6 rating)

**PH rule:** Zero ads. Revenue from subscriptions only. The emotional experience must never be interrupted.

### ❌ Collection = Filing Cabinet

Every competitor treats "collection" as photo archiving:
- GreenSnap → My Album (photo folder)
- PictureThis → My Garden (list view)
- PlantSnap → Library (file archive)

None have unlock animations, progress bars, rarity reveals, or completion tracking.

**PH rule:** Collection is an achievement experience, not file management. Every new entry triggers celebration. Empty slots create desire.

### ❌ Share = Screenshot

No competitor designs sharing content. Users who share take plain screenshots — no branding, no conversion path, no viral coefficient.

**PH rule:** Every share is a designed poster with visual distinctiveness (pixel art stands out in photo feeds), emotional hook (hanakotoba), geographic context, and subtle app branding.

### ❌ Single-Season Product

Sakura Navi proves seasonal apps can succeed, but also shows the limitation: users disappear after cherry blossom season ends.

**PH rule:** 60 species across all seasons. No month without at least one ★★ discovery window. Cherry blossom season is the launch window, not the entire product lifecycle.
