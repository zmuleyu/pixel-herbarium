# App Store Review Notes — 花図鉑 v1.0.0

> Copy this into App Store Connect → App Review → Review Notes before submission.

---

## App Overview

花図鉑 (Pixel Herbarium) is a plant discovery app focused on Japan's cherry blossom season. Users visit sakura spots, take photos, and collect stamp cards. The app uses AI to identify plant species and generate pixel art renderings.

## How to Test

### Guest Mode
The app supports a **guest-first** experience. After the 3-slide onboarding, users can browse:
- **Home tab**: Featured sakura spots and bloom status
- **Map tab**: Sakura spot pins across Japan (requires location permission)
- **Herbarium tab**: Plant collection grid (locked items shown as silhouettes)
- **Settings tab**: Language, privacy, version info

### Login (Required for Core Features)
To test full functionality, sign in via **Apple Sign In** on the login screen:
1. Tap the **Settings** tab → "ログイン"
2. Tap "Appleでサインイン"
3. Use your Apple reviewer account

No separate test credentials are needed — Apple Sign In works directly.

### Core Feature Walkthrough

**Path A — Sakura Spot Check-in (打卡)**
1. Open **Map tab** (地図) → Allow location when prompted
2. Tap a sakura spot pin → "打卡する" button appears
3. Tap "打卡する" → Select photo (camera or library)
4. Preview stamp card → Save to photos or share via LINE/Instagram

**Path B — Plant Discovery (発見)**
1. Open **Discover tab** (発見) → Allow camera + location
2. Point camera at a plant → Tap shutter button
3. Wait for AI identification (~3-5 seconds)
4. View result: plant name, pixel art, hanakotoba (flower language)
5. Plant is added to your **Herbarium** (花図鉑) collection

## Permissions Used

| Permission | Purpose | Type |
|-----------|---------|------|
| Camera | Photograph plants for AI identification | When In Use |
| Location | Record where plants were discovered; show nearby spots | When In Use only (no background tracking) |
| Photo Library (Read) | Select existing photos for check-in cards | On demand |
| Photo Library (Write) | Save stamp cards and share posters | On demand |
| Notifications | Seasonal bloom alerts (opt-in) | Optional |

**Location data** is used solely within the app to show nearby sakura spots and record discovery locations. It is never shared with third parties or used for tracking.

## AI Features

- **Plant Identification**: Uses PlantNet API to identify plant species from photos. Results include a confidence indicator.
- **Pixel Art Generation**: Uses Replicate API to render identified plants as pixel art. These images are labeled as AI-generated content within the app.
- AI processing requires an internet connection. When offline, users can still browse cached data and use the check-in feature.

## Third-Party Login

- **Apple Sign In**: Primary login method ✅
- **LINE Login**: Optional convenience login for Japan market users (LINE Channel ID configured)
- **Email/Password**: Available as fallback

All login methods are optional — the app is usable in guest mode.

## Privacy & Data

- **Privacy Policy**: https://pixel-herbarium.app/privacy-policy
- **Account Deletion**: Settings → Privacy Settings → "アカウント削除" (30-day soft-delete with cancellation window)
- **Data Export**: Settings → Privacy Settings → "データをエクスポート" (JSON download)

## Additional Notes

- **No In-App Purchases**: v1.0 is entirely free with no IAP or subscriptions.
- **No User-Generated Content visible to others**: Shared content goes through OS share sheet to external apps (LINE, Instagram). The in-app city map shows anonymized discovery heat points only.
- **Encryption**: `ITSAppUsesNonExemptEncryption: false` — standard HTTPS only.
- **Content Rating**: 4+ (no objectionable content)
