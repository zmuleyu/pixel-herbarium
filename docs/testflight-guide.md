# TestFlight Deployment Guide — Pixel Herbarium v1.0.0

## Prerequisites

- [ ] Apple Developer Program membership ($99/year, approved)
- [ ] Expo account (`eas login`)
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Node.js 20.18.0+

---

## Phase 1: Apple Developer Setup

### 1.1 Get Apple Team ID
1. Go to https://developer.apple.com/account
2. Navigate to **Membership Details**
3. Copy the **Team ID** (10-char alphanumeric, e.g. `ABCDEFGHIJ`)

### 1.2 Create App in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: `花図鉑` (or `Pixel Herbarium` for English store)
   - **Primary Language**: Japanese
   - **Bundle ID**: `com.pixelherbarium.app`
   - **SKU**: `pixel-herbarium`
4. After creation, note the **Apple ID** (numeric) shown in **App Information** — this is the `ascAppId`

### 1.3 Enable Capabilities
In **Certificates, Identifiers & Profiles** → **Identifiers** → select `com.pixelherbarium.app`:
- [x] Sign In with Apple
- [x] Push Notifications

---

## Phase 2: Configure EAS Credentials

### 2.1 Update eas.json
Fill in the submit section:
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your.email@example.com",
      "ascAppId": "1234567890",
      "appleTeamId": "ABCDEFGHIJ"
    }
  }
}
```

### 2.2 Set EAS Secrets
```bash
# Supabase anon key (rotate first in Supabase Dashboard if needed)
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <key> --scope project

# Verify
eas secret:list
```

### 2.3 Link Project to EAS
```bash
eas init
# Follow prompts to link to your Expo account
```

---

## Phase 3: Supabase Production Config

### 3.1 Set Edge Function Secrets
In **Supabase Dashboard** → Project `uwdgnueaycatmkzkbxwo` → **Edge Functions** → **Secrets**:

| Secret | Source | Notes |
|--------|--------|-------|
| `PLANTNET_API_KEY` | https://my.plantnet.org/ | Free tier: 500 IDs/day |
| `REPLICATE_API_TOKEN` | https://replicate.com/ | For pixel art generation |

Or via CLI:
```bash
npx supabase secrets set PLANTNET_API_KEY=<key> REPLICATE_API_TOKEN=<token>
```

### 3.2 Auth Redirect URLs
In **Supabase Dashboard** → **Authentication** → **URL Configuration**:

Add to **Redirect URLs**:
```
pixelherbarium://
pixelherbarium://**
exp://pixel-herbarium
```

### 3.3 Verify RLS Policies
All 16 migrations have been applied with RLS policies. Verify in Dashboard → **Database** → **Policies** that all tables have appropriate row-level security.

---

## Phase 4: Pre-Build Validation

```bash
# Run full validation (env + assets + typecheck + tests)
npm run build:validate

# Or individually:
npx tsc --noEmit          # TypeScript check
npx jest --ci             # 270 tests
```

---

## Phase 5: Build & Submit

### 5.1 Preview Build (TestFlight Internal Testing)
```bash
# Build for real iOS device (not simulator)
npm run build:preview:ios
# Equivalent: eas build --profile preview --platform ios

# EAS will:
# 1. Auto-manage provisioning profiles (first time: select Apple account)
# 2. Upload to EAS build servers
# 3. Return build URL when complete (~10-15 min)
```

### 5.2 Install on Device
After build completes:
1. Open build URL from EAS dashboard or CLI output
2. Scan QR code on iOS device, or
3. Download IPA and install via Apple Configurator

### 5.3 Production Build + App Store Submit
```bash
# Build production IPA
npm run build:prod:ios
# Equivalent: eas build --profile production --platform ios

# Submit to App Store Connect (after build completes)
npm run submit:ios
# Equivalent: eas submit --platform ios --profile production

# Or combined:
eas build --profile production --platform ios --auto-submit
```

---

## Phase 6: TestFlight Distribution

1. Go to **App Store Connect** → **TestFlight**
2. The build should appear after processing (~5-30 min)
3. **Internal Testing**: Add testers by email (up to 100)
4. **External Testing**: Create a test group, add testers (up to 10,000)
5. External testing requires **Beta App Review** (usually 24-48 hours)

---

## App Store Submission Checklist

Before submitting for App Store review:

- [ ] **Screenshots**: 3-5 per device size (iPhone 6.7" required, 5.5" recommended)
  - See `docs/aso/` for metadata templates
- [ ] **Privacy Policy URL**: Required — host on your domain
- [ ] **App Description**: See `docs/aso/app-store-metadata-ja.md`
- [ ] **Keywords**: See `docs/aso/keywords-analysis.md`
- [ ] **Age Rating**: Complete questionnaire in App Store Connect
- [ ] **Contact Information**: Support URL + email

---

## Troubleshooting

### "No matching provisioning profiles found"
```bash
eas credentials   # Manage credentials interactively
# Or let EAS auto-generate: answer "yes" when prompted during build
```

### "apple-id authentication failed"
- Use **App-Specific Password** if 2FA enabled:
  1. Go to https://appleid.apple.com → Security → App-Specific Passwords
  2. Generate password
  3. Set: `eas secret:create --name EXPO_APPLE_APP_SPECIFIC_PASSWORD --value <pwd> --scope project`

### Build succeeds but crash on launch
1. Check Supabase URL/key are correct in EAS env
2. Verify Edge Functions are deployed: `npx supabase functions list`
3. Check Expo Updates channel matches build profile

### "Exceeded budget" or timeout during build
- EAS free tier: 30 builds/month, 15 min timeout
- Upgrade to EAS Production ($99/month) if needed for faster builds
