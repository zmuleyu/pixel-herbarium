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
- **Home tab**: Featured sakura spots, bloom status, and personal flower diary
- **Map tab**: Sakura spot pins across Japan (requires location permission)
- **Herbarium tab**: Plant collection grid (locked items shown as silhouettes)
- **Settings tab**: Language, privacy policy, version info

### Login (Required for Full Features)
To test stamp saving and check-in features, sign in via **Apple Sign In**:
1. Tap the **Settings** tab → "ログイン"
2. Tap "Appleでサインイン"
3. Use your Apple reviewer account

No separate test credentials are needed — Apple Sign In works directly.

### Core Feature Walkthrough

**Path A — Sakura Spot Check-in + Stamp Editor (主要機能)**
1. Open **Map tab** → Allow location when prompted
2. Tap a sakura spot pin → "打卡する" button appears
3. Tap "打卡する" → Select photo (camera or library)
4. **Stamp Editor** appears: drag the pixel-art stamp to desired position; pinch to resize; rotate with two fingers
5. Adjust opacity and size with sliders in the bottom panel
6. Tap "写真に保存" to save to photo library, or share via LINE/Instagram

**Path B — Home Diary & Collection**
1. Open **Home tab** → View personal flower diary cards
2. Tap any card → View stamp card detail with spot name and date
3. View collection progress (spots visited / total)

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
- **LINE Login**: Optional convenience login for Japan market users
- **Email/Password**: Available as fallback

All login methods are optional — the app is usable in guest mode.

---

## Privacy & Data

- **Privacy Policy**: https://pixel-herbarium.com/privacy-policy (accessible in-app: Settings → "プライバシーポリシー")
- **Account Deletion**: Settings tab → scroll to bottom (when logged in) → "アカウントを削除" → confirm → 30-day soft-delete initiated (reversible within 30 days)
- **Data Export**: Settings → "データのエクスポート" (JSON download of check-in history)

---

## Additional Notes

- **No In-App Purchases**: v1.1 is entirely free with no IAP or subscriptions.
- **No User-Generated Content visible to others**: Shared content goes through the OS share sheet to external apps (LINE, Instagram). The in-app city map shows anonymized discovery heat points only.
- **Encryption**: `ITSAppUsesNonExemptEncryption: false` — standard HTTPS only.
- **Content Rating**: 4+
- **Backend**: Supabase (PostgreSQL + PostGIS) hosted in EU region. Cross-border data transfer is disclosed in the privacy policy.
