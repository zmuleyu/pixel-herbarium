# LINE Platform Setup Guide — Pixel Herbarium

Zero-code setup steps for LINE Login Channel, Official Account, and Messaging API.
Engineering tasks are tracked in code; this covers operations-side steps.

---

## Step 1: LINE Developers Console

### 1-A. Create LINE Login Channel (for authentication)

1. Go to [developers.line.biz](https://developers.line.biz) → Console
2. Create or select a Provider (e.g., "Pixel Herbarium")
3. **Create channel** → type: **LINE Login**
   - Channel name: `花めぐり`
   - Channel description: `季節の花を発見するアプリ`
   - App type: Native app
4. Under **LINE Login** tab → add Callback URLs:
   - `pixelherbarium://auth/line/callback`
5. Enable **OpenID Connect** (required for `id_token`)
6. Note down:
   - **Channel ID** → `EXPO_PUBLIC_LINE_CHANNEL_ID` (EAS secret + local .env)
   - **Channel Secret** → `LINE_CHANNEL_SECRET` (Supabase edge function secret)
7. Submit for review (can take 1-2 weeks)

> **Set secrets immediately after noting Channel ID/Secret:**
> ```bash
> # EAS (app binary)
> eas secret:create --name EXPO_PUBLIC_LINE_CHANNEL_ID --value <channel_id> --scope project
>
> # Supabase Edge Function (server-side)
> npx supabase secrets set LINE_CHANNEL_SECRET=<channel_secret>
> ```

### 1-B. Create Messaging API Channel (for Official Account)

1. In LINE Developers Console → **Create channel** → type: **Messaging API**
2. Link to Official Account (create one in 1-C first if needed)
3. Note **Channel Access Token** (for `line-oa-bridge` edge function, Phase 2)

---

## Step 2: LINE Official Account (OA)

### 2-A. Create the OA (20 minutes)

1. Go to [account.line.biz](https://account.line.biz) → Create account
   - Name: `花めぐり — Pixel Herbarium`
   - Category: Lifestyle → Hobby
   - Plan: **Free** (200 msgs/month + unlimited reply + Rich Menu)
2. Profile image: use the app icon (cream background, pixel flower)

### 2-B. Rich Menu (3-zone layout)

Design specs:
- Background: `#f5f4f1` (PH cream — **NOT** LINE green)
- Text: `#3a3a3a`
- Accent: `#9fb69f` (sage green)
- Dimensions: 2500 × 843 px (LINE standard full)

| Zone | Label | Action type | Value |
|------|-------|-------------|-------|
| Left | 今日の桜 | URI | bloom status web page URL |
| Center | アプリを開く | URI | `pixelherbarium://` (fallback: App Store URL) |
| Right | 花言葉辞典 | Text | `花言葉を教えて` |

Steps:
1. OA Manager → Rich Menu → Create
2. Upload menu image (create in Figma/Canva using specs above)
3. Map actions per zone
4. Set as default → Publish

### 2-C. Welcome Message (auto-send on friend add)

In OA Manager → Auto-response → Friend added:

```
花めぐりへようこそ 🌸

季節の花を見つけて、
足跡を残す小さな旅。

桜の便りや花言葉を
時々お届けします。

📱 アプリはこちら →
[App Store link]
```

Tone: warm, unhurried — no countdown timers, no "今すぐ！"

---

## Step 3: Verify LINE Login ↔ OA Linkage

When user completes LINE Login with `bot_prompt=normal`:
- A dialog shows "Add 花めぐり as a friend?" during OAuth
- User can opt in without pressure (normal = checkbox unchecked by default)
- On opt-in: user `line_uid` is stored in `profiles.line_uid`
- This enables future Messaging API pushes to that user (Phase 2)

---

## Step 4: Test Checklist

- [ ] LINE Login Channel approved (check email from LINE)
- [ ] `EXPO_PUBLIC_LINE_CHANNEL_ID` set in EAS secrets
- [ ] `LINE_CHANNEL_SECRET` set in Supabase secrets
- [ ] EAS preview build with LINE button visible on login screen
- [ ] OAuth flow completes → `profiles.line_uid` populated in Supabase
- [ ] `bot_prompt=normal` shows OA friend-add prompt during login
- [ ] Rich Menu renders with PH colors (not LINE green)
- [ ] Welcome message sent on OA friend add
- [ ] Deep link `pixelherbarium://spot/1` opens correct screen

---

## Phase 2 Prerequisites (for reference)

When implementing the viral share loop (Weeks 4-6):
- Messaging API Channel Access Token → set as `LINE_MESSAGING_CHANNEL_TOKEN` Supabase secret
- Universal Links: register domain (e.g., `pixelherbarium.app`)
  - Add `apple-app-site-association` at `https://pixelherbarium.app/.well-known/apple-app-site-association`
  - Add `assetlinks.json` at `https://pixelherbarium.app/.well-known/assetlinks.json`
