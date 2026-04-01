# App Store Review Notes — 花図鉑 v1.1.0

> Copy this into App Store Connect → App Review → Review Notes before submission.

---

## What's New in v1.1.0

- Brand visual redesign: new App Icon, Splash, Tab Bar icons, brand color system
- **Stamp Editor**: Users can now add pixel-art stamps to their flower photos with pan/pinch/rotate gesture controls
- Tab structure update: Footprint tab hidden, redirected to Home (collection accessible via Home screen diary)
- New user onboarding flow polish
- Account deletion feature (Settings → "アカウントを削除")

---

## App Overview

花図鉑 (Pixel Herbarium) is a flower-spotting diary app for Japan's cherry blossom season. Users visit sakura spots across Japan, photograph flowers, add pixel-art stamps, and build a personal stamp collection. The core loop is: **visit spot → take photo → add stamp → save/share**.

---

## How to Test

### Guest Mode
The app supports a **guest-first** experience. After the 3-slide onboarding, users can browse:
- **Home tab**: Seasonal header, camera CTA ("花を撮る"), library picker, and recent check-in preview
- **Diary tab** (日記): Check-in history as photo grid with stats (check-in count, spots visited, last record date)
- **Settings tab**: Language toggle (日本語/English), privacy policy, usage guide, feedback, data export

### Login (Required for Full Features)

**Option A — Email/Password (Recommended for review):**

Demo Account:
- **Email**: `review@pixelherbarium.app`
- **Password**: `[ASC Demo Account Password に記入済み]`

Steps:
1. Tap the **Settings** tab → "ログイン"
2. Tap "メールでサインイン"
3. Enter the email and password above

**Option B — Apple Sign In:**
1. Tap the **Settings** tab → "ログイン"
2. Tap "Appleでサインイン"
3. Use your Apple reviewer account

**Creating a new account (Email):**
1. On the login screen, tap "**メールで登録**" at the bottom
2. Enter an email and a password of at least 6 characters
3. Tap "メールで登録" to submit
4. A confirmation email is sent; tap the link to activate the account

### Core Feature Walkthrough

**Path A — Check-in + Stamp Editor (主要機能)**
1. Open **Home tab** → Tap "花を撮る" CTA (camera) or "ライブラリから選ぶ" (photo library)
2. **Checkin Wizard** opens → Select a sakura spot from the list
3. Take or choose a photo
4. **Stamp Editor** appears: drag the pixel-art stamp to desired position; pinch to resize; rotate with two fingers
5. Tap "写真に保存" to save to photo library, or tap share icon to share via system share sheet

**Path B — Diary (花の日記)**
1. Open **Diary tab** (日記) → View check-in stats (打卡数, 訪問スポット, 最後の記録)
2. Scroll to see all check-in photos in a grid layout
3. Tap any photo card to view full-size stamp photo

---

## Permissions Used

| Permission | Purpose | Type |
|-----------|---------|------|
| Camera | Photograph flowers for check-in cards | When In Use |
| Location | Show nearby sakura spots; record check-in location | When In Use only (no background tracking) |
| Photo Library (Read) | Select existing photos for stamp cards | On demand |
| Photo Library (Write) | Save stamp cards and share posters | On demand |
| Notifications | Seasonal bloom alerts (opt-in) | Optional |

**Location data** is used solely within the app to show nearby sakura spots and record check-in locations. It is never shared with third parties or used for tracking.

---

## Third-Party Login

- **Apple Sign In**: Primary login method ✅
- **LINE Login**: Optional convenience login for Japan market users (via OAuth 2.0)

All login methods are optional — the app is fully usable in guest mode.

---

## Privacy & Data

- **Privacy Policy**: https://pixel-herbarium.com/privacy-policy (accessible in-app: Settings → "プライバシーポリシー")
- **Account Deletion**: Settings tab → scroll to bottom (when logged in) → "アカウントを削除" → confirm → 30-day soft-delete initiated (reversible within 30 days)
- **Data Export**: Settings → "データのエクスポート" (JSON download of check-in history)

---

## Account States for Review

AHB has two distinct account states. Please test both:

| State | How to enter | Features available |
|-------|-------------|-------------------|
| **Guest (no login)** | Skip login on Settings tab, or use app without signing in | Home tab, Diary tab (read-only), Settings tab, privacy policy, usage guide |
| **Logged in** | Sign in via email/password (Demo Account above) or Apple Sign In | All guest features + stamp saving, check-in history sync, privacy settings, account deletion |

**To switch states during review:** Settings tab → "ログアウト" (logout) returns to guest mode.

---

## Additional Notes

- **No In-App Purchases**: This app is entirely free with no IAP or subscriptions.
- **Business model**: Free app, no monetization in current version.
- **Geographic design intent**: The app is designed for Japan's cherry blossom season. Sakura spot data covers Japan. The app is fully functional outside Japan but spot selection will show Japan locations.
- **No User-Generated Content visible to others**: Shared content goes through the OS share sheet to external apps. All check-in data is private to the user.
- **Encryption**: `ITSAppUsesNonExemptEncryption: false` — standard HTTPS only.
- **Content Rating**: 4+
- **Backend**: Supabase (PostgreSQL + PostGIS) hosted in EU region. Cross-border data transfer is disclosed in the privacy policy.
