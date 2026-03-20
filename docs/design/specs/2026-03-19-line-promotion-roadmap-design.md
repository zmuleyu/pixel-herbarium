# LINE Platform Promotion Roadmap for Pixel Herbarium (花めぐり)

## Context

Pixel Herbarium (花めぐり) is a Japanese-market flower discovery and sakura check-in app approaching its first public release. LINE is the dominant messaging platform in Japan (81M+ MAU), making it the highest-leverage channel for user acquisition and retention. The app already has partial LINE support (SharePoster `format='line'` for 360x360 cards) but lacks LINE Login, Official Account integration, deep link handling, and a viral sharing loop.

This spec defines a 3-phase parallel-launch strategy: LINE Login + Official Account simultaneously (Phase 1), viral sharing loop (Phase 2), and data-driven growth with optional paid promotion (Phase 3).

**Goal**: Both user acquisition (LINE Login reduces friction, auto-friend OA) and retention (seasonal OA messaging, Flex Message engagement).
**Budget**: Start at zero cost, add investment based on measurable results.
**Brand constraint**: All LINE content must match PH's "温柔/诗意/不焦虑" tone. No countdown timers, no aggressive CTAs, no "今すぐダウンロード!".

---

## Phase 1: Foundation (Weeks 1-3)

### Track A: LINE Login Integration (Engineering)

**Principle**: Supabase has no built-in LINE auth provider. Unlike Apple Sign-In (which uses Supabase's built-in `signInWithIdToken({ provider: 'apple' })`), LINE requires a custom edge function that creates/signs-in users via Supabase Admin API and returns session tokens for the app to consume.

**LINE Developers Console Setup**:
1. Create **two separate channels** in LINE Developers Console:
   - **LINE Login Channel** — for OAuth authentication
   - **Messaging API Channel** — for OA messaging (linked to Official Account in Track B)
2. LINE Login Channel: set callback URL `pixelherbarium://auth/line/callback` + web fallback
3. Enable OpenID Connect, request scopes: `profile`, `openid`, `email`
4. Note Channel ID + Channel Secret
5. **Timeline**: LINE Login Channel review can take 1-2 weeks; submit early in Week 1

**New dependencies**:
- `expo-auth-session` — OAuth PKCE flow
- `expo-web-browser` — required by expo-auth-session
- Both require EAS native build (not OTA-deployable)

**app.json additions**:
- Add `expo-auth-session` and `expo-web-browser` to plugins
- Add `"line"` to `ios.infoPlist.LSApplicationQueriesSchemes` (required for iOS 15+ to detect LINE app)

**New Edge Function: `supabase/functions/auth-line/index.ts`**
- Accepts `{ id_token, nonce }` from app
- Verifies id_token against LINE's verification endpoint (`https://api.line.me/oauth2/v2.1/verify`)
- Extracts `sub` (line_uid), `name`, `picture`, `email`, `email_verified`
- Supabase Admin API: check if user exists with `user_metadata.line_uid = sub`
  - Yes → generate new session via `supabase.auth.admin.generateLink()` or create custom JWT
  - No → `supabase.auth.admin.createUser()` with `user_metadata.line_uid`, then generate session
- **Returns `{ access_token, refresh_token }` to the app** — this is the critical bridge between LINE auth and Supabase session
- Existing `handle_new_user()` trigger in `010_profiles.sql` auto-creates profile row
- Error responses with gentle Japanese messages (e.g., "接続できませんでした。もう一度お試しください")

**`src/services/auth.ts` — add `signInWithLine()`**
- Uses `expo-auth-session` with LINE endpoints:
  - Authorization: `https://access.line.me/oauth2/v2.1/authorize`
  - Token: `https://api.line.me/oauth2/v2.1/token`
- Scopes: `profile openid email`
- Add `bot_prompt=normal` to authorization URL — shows OA friend-add option during login without forcing it (matches PH's gentle tone; `aggressive` would auto-check the checkbox which contradicts "never anxious")
- Exchange auth code for id_token → send to `auth-line` edge function
- **App calls `supabase.auth.setSession({ access_token, refresh_token })` with the returned tokens**
- Handle errors: user denial, LINE API downtime, token verification failure — show gentle toast, never crash

**Login screen update: `src/app/(auth)/login.tsx`**
- Add LINE button: `#06C755` green, LINE icon, rounded corners
- Position: After Apple Sign-In (iOS) / First button (Android)

**New migration: `022_line_metadata.sql`**
- `ALTER TABLE profiles ADD COLUMN line_uid TEXT UNIQUE`
- Index on `line_uid`
- Update `handle_new_user()` to extract `line_uid` from `raw_user_meta_data`

**Account linking (security-first)**:
- If existing Apple/Email user later logs in with LINE and emails match:
  - **Only consider linking if LINE id_token contains `email_verified: true`** (unverified LINE emails could be spoofed)
  - Show explicit confirmation UI: "このメールアドレスのアカウントが見つかりました。統合しますか？"
  - User must tap "統合する" to merge — never auto-merge
  - If email not verified or user declines: create separate new account

### Track B: LINE Official Account (Operations, zero code)

**OA creation (20 min)**:
- Name: `花めぐり — Pixel Herbarium`
- Category: Lifestyle > Hobby
- Plan: Free (200 msgs/month + unlimited replies + Rich Menu)

**Rich Menu (3-zone layout)**:

| Zone | Label | Action |
|------|-------|--------|
| Left | 今日の桜 | URI → bloom status web page |
| Center | アプリを開く | URI → `pixelherbarium://` or App Store |
| Right | 花言葉辞典 | Text trigger → daily hanakotoba reply |

- Design: `#f5f4f1` background, `#3a3a3a` text, `#9fb69f` sage green accents
- NOT LINE green — maintain PH brand identity

**Welcome message (auto on friend add)**:
```
花めぐりへようこそ 🌸

季節の花を見つけて、
足跡を残す小さな旅。

桜の便りや花言葉を
時々お届けします。

📱 アプリはこちら →
[App Store link]
```

### Track C: Deep Link Infrastructure (Engineering, parallel with A)

**Current state**: `scheme: "pixelherbarium"` registered in `app.json` but zero handling code exists.

**Expo Router file-based routing** (preferred over manual `Linking.addEventListener`):
- Expo Router already handles deep links via file-based routing. Routes like `src/app/plant/[id].tsx` already exist.
- Additional routes needed:
  - `src/app/spot/[id].tsx` → spot detail (may already exist via tabs)
  - `src/app/invite/[code].tsx` → new: referral landing page + auto-add friend
- `pixelherbarium://auth/line/callback` is NOT a navigation route — it's handled by `expo-auth-session`'s `useAuthRequest` hook which intercepts the callback automatically

**`_layout.tsx` additions**:
- Add `expo-linking` `getInitialURL()` check on cold start for deferred routing
- Handle `pixelherbarium://spot/{id}` and `pixelherbarium://plant/{id}` by routing to the correct tab + screen

**Universal Links / App Links** (prerequisite for Phase 2 viral loop):
- **Domain registration required**: e.g., `pixelherbarium.app` — must be done in Week 1
- Configure `apple-app-site-association` (iOS) + `assetlinks.json` (Android)
- Enables `https://pixelherbarium.app/share/...` → app open

**Deferred deep links limitation**:
- Expo has no built-in deferred deep linking (user taps link → installs app → opens at target)
- **Phase 1 approach**: Encode referral code in App Store campaign link (`ct=` parameter); on first launch, check `expo-linking.getInitialURL()` for the URL that opened the app
- **Phase 2 evaluation**: If deferred deep links prove critical, evaluate Branch.io or a simple custom solution (store share context in Supabase keyed by a short code, check on first login)

---

## Phase 2: Viral Loop (Weeks 4-6)

### 2A: Enhanced Share Flow

**Current**: `ShareSheet.tsx` captures poster → shares image via `expo-sharing` → receiver sees image only, no link.

**Enhanced**:
1. "LINEに送る" dedicated button in ShareSheet
2. Generates deep link URL (web URL: `https://pixelherbarium.app/share/{id}`) + share record
3. Check `Linking.canOpenURL('line://')` first (requires `LSApplicationQueriesSchemes` config)
4. Opens LINE directly via `line://msg/text/...` URL scheme (bypasses OS share sheet)
5. Fallback: if LINE not installed, use generic `expo-sharing`

**Share text templates** (PH gentle tone, use web URLs not custom scheme for readability):

Plant discovery:
```
{plantName}を見つけました 🌸
花言葉は「{hanakotoba}」

あなたもこの花を探してみませんか？
→ https://pixelherbarium.app/plant/{id}
```

Spot check-in:
```
{spotName}で桜を記録しました 🌸
{prefecture} · {date}

→ https://pixelherbarium.app/spot/{id}
```

Web URLs are cleaner in chat and work for users who don't have the app installed (fallback to App Store via Universal Links).

**New migration: `023_share_records.sql`**
```sql
CREATE TABLE share_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  share_type  TEXT NOT NULL CHECK (share_type IN ('plant', 'spot', 'bouquet')),
  content_id  TEXT NOT NULL,
  channel     TEXT NOT NULL CHECK (channel IN ('line', 'instagram', 'twitter', 'other')),
  deep_link   TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE share_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own shares" ON share_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own shares" ON share_records FOR SELECT USING (auth.uid() = user_id);
```

### 2B: OA Flex Message Templates

**Flower Card** (for OA broadcast):
- Hero: pixel sprite on `#f5f4f1` cream background
- Body: flower name (ja/latin) + hanakotoba
- Button: "この花を探しに行く" in `#9fb69f` sage green → deep link
- All PH brand colors, not LINE defaults

**Bloom Status** (seasonal push):
- Carousel of 3-5 blooming spots
- Each: spot name + prefecture + bloom badge (つぼみ/満開/散り始め)
- Button: "打卡する" → app spot page

### 2C: Viral Loop + Referral

**Complete loop**:
```
User A shares card on LINE (with deep link)
  → User B taps link
  → App installed? → opens at target page → LINE Login prompt → auto-friend OA
  → Not installed? → App Store → install → first launch → deep link deferred → LINE Login → OA
```

**Referral reward (non-monetary, brand-aligned)**:
- User A gets notification: "あなたが贈った花が、新しい友達のもとに届きました 🌸"
- Cosmetic badge: 「花の使者」on profile
- No quota bonuses or premium features

---

## Phase 3: Data-Driven Growth (Weeks 7-12)

### 3A: Content Calendar

**Free tier budget**: 200 msgs/month (1 send to 1 user = 1 message). Upgrade trigger: **followers > 100** → evaluate Light Plan (5,000 yen/month). Math: 100 followers × 2 msgs/month = 200 = free tier limit.

**Annual plan (~14 msgs/user/year, max 2/month)**:

| Month | Content | Msgs | Example |
|-------|---------|------|---------|
| Mar | Sakura opens | 2 | "各地から桜の便りが届き始めました" |
| Apr | Sakura peak | 2 | "桜が満開を迎えました。足跡に残しませんか" |
| May | Transition | 1 | "次は紫陽花の季節" |
| Jun | Ajisai | 2 | "雨上がりの紫陽花が、あなたを待っています" |
| Jul-Aug | Summer | 2 | "夏の花が元気に咲いています" |
| Sep-Nov | Momiji | 3 | "色づく季節に、花図鑑を開いてみてください" |
| Dec-Feb | Winter | 2 | "寒い季節にも、静かに咲く花があります" |

**Timing**: Saturday 10:00 JST. Never Monday AM or Sunday PM.

### 3B: Growth Metrics

| Phase | Metric | Target |
|-------|--------|--------|
| 1 | LINE Login adoption | >30% new signups |
| 1 | OA followers | 100 in first month |
| 1 | Login→friend conversion | >80% |
| 2 | Share rate | >5% weekly active users |
| 2 | LINE share channel ratio | >60% |
| 2 | Share→install conversion | >3% |
| 2 | Viral coefficient K | >0.1 |
| 3 | OA message open rate | >60% |
| 3 | Message→app open rate | >15% |
| 3 | 7-day retention | >25% |

**New migration: `024_analytics_events.sql`**
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type, created_at);
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own events" ON analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can read all" ON analytics_events FOR SELECT USING (auth.role() = 'service_role');
```

### 3C: Paid Promotion Triggers

**Activate LINE Ads ONLY when ALL conditions met**:
1. Viral coefficient K > 0.1
2. 7-day retention > 20%
3. LINE Login adoption > 25%
4. Share→install conversion > 2%

**LINE Ads config**:
- Type: App Install campaign
- Start: 1,000 yen/day × 2 weeks
- Audience: Women 20-35, Tokyo/Osaka/Kyoto/Yokohama, interests: nature/flowers/photography
- Creative: Reuse SharePoster 360x360 flower cards (brand consistency)
- CTA: "花を探しに行く"
- Scale: CPI < 150 yen → 3000/day; CPI < 100 yen → 5000/day; CPI > 300 → pause
- Seasonal: 2x budget in sakura season (Mar-Apr), 0.5x in summer

---

## Technical Architecture

```
┌──────────── App (Expo) ────────────┐
│ auth.ts (+signInLine)              │
│ ShareSheet (+LINE直達 + deep link) │
│ _layout.tsx (+deep link handler)   │
└───────────┬────────────────────────┘
            │ id_token / share_record
            ▼
┌──────────── Supabase ──────────────┐
│ auth-line (Edge Function)          │
│ profiles (+line_uid)               │
│ share_records (new table)          │
│ analytics_events (new table)       │
│ line-oa-bridge (Edge Function)     │
│   └─ lookup line_uid → send Flex   │
└───────────┬────────────────────────┘
            │ Messaging API
            ▼
┌──────────── LINE Platform ─────────┐
│ Official Account (Rich Menu)       │
│ LINE Login Channel (OAuth 2.0)     │
│ Messaging API (Flex/Push/Reply)    │
└────────────────────────────────────┘
```

**LINE messaging is a separate pipeline from Expo Push**:
- The existing `notify` edge function is a simple broadcast-to-all-tokens function with no per-user targeting. It stays unchanged.
- `line-oa-bridge` is a **new, independent** edge function that sends Flex Messages via LINE Messaging API to users with `line_uid`
- Phase 3 adds `profiles.notification_channel` column (`'push' | 'line' | 'both'` default `'both'`) for user preference
- Eventually, a unified `notify-v2` edge function can replace both, but this is a Phase 3+ optimization

---

## Critical Files

| File | Modification |
|------|-------------|
| `src/services/auth.ts` | Add `signInWithLine()` |
| `src/app/(auth)/login.tsx` | Add LINE Login button |
| `src/app/_layout.tsx` | Add deep link handler |
| `src/components/ShareSheet.tsx` | Add LINE direct share + deep link |
| `src/components/SharePoster.tsx` | Enhance LINE format with deep link text |
| `supabase/functions/auth-line/index.ts` | New: LINE token verification |
| `supabase/functions/line-oa-bridge/index.ts` | New: Supabase → LINE Messaging API bridge |
| `supabase/migrations/022_line_metadata.sql` | New: profiles.line_uid column |
| `supabase/migrations/023_share_records.sql` | New: share tracking table |
| `supabase/migrations/024_analytics_events.sql` | New: analytics events table |
| `app.json` | Add expo-auth-session / expo-web-browser plugins |
| `src/i18n/ja.json` | Add LINE-related UI strings |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| LINE Login needs EAS native build | Plan build early; test on preview channel |
| No built-in Supabase LINE provider | Custom edge function returns `{access_token, refresh_token}`, app calls `setSession()` |
| OA 200 msg/month limit | Targeted sends only; reply messages are unlimited; upgrade at 100 followers |
| Deep link lost on first install | Encode referral in App Store campaign params; evaluate Branch.io in Phase 2 if needed |
| LINE Login adoption low initially | Make LINE primary on Android; prominent on iOS below Apple |
| Brand dilution from LINE green | LINE green ONLY on login button; all OA content uses PH palette |
| Account linking email spoofing | Only merge when LINE `email_verified: true` + explicit user confirmation UI |
| LINE Login Channel review delay | Submit in Week 1; can take 1-2 weeks; OA setup proceeds independently |
| Privacy compliance (Japan APPI) | Update `privacy.tsx` to disclose `line_uid` storage; add LINE data to deletion flow |

## Compliance Notes

- **Japan APPI**: Storing `line_uid` is PII. Privacy policy (`src/app/(tabs)/privacy.tsx`) must disclose LINE data collection.
- **App Store account deletion requirement**: LINE-linked accounts must be deletable. Ensure `deleteAccount()` in `auth.ts` also revokes LINE tokens and removes `line_uid`.
- **LINE Platform Terms**: Official Account content must comply with LINE's acceptable use policy. PH's gentle tone inherently complies.

---

## Verification

### Phase 1
- [ ] LINE Login: test OAuth flow on iOS + Android preview builds
- [ ] Verify `line_uid` is stored in profiles after login
- [ ] Confirm `bot_prompt=normal` shows OA friend-add option during login
- [ ] OA: send test message from LINE OA Manager, verify Rich Menu renders
- [ ] Deep links: test `pixelherbarium://spot/1` opens correct screen

### Phase 2
- [ ] Share flow: tap "LINEに送る" → verify LINE opens with card + deep link text
- [ ] Viral loop: share card → tap link on another device → verify app opens at target page
- [ ] Share records: verify `share_records` table populated after sharing
- [ ] Flex Message: send test flower card from OA, verify PH brand colors render correctly

### Phase 3
- [ ] Analytics: verify events tracked in `analytics_events` table
- [ ] Content calendar: schedule test message, verify delivery and open tracking
- [ ] Metrics: query Supabase for LINE Login adoption rate, share rate, K coefficient
