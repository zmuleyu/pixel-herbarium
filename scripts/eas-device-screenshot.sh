#!/bin/bash
# eas-device-screenshot.sh — EAS Build + iPhone real-device screenshot (China network optimized)
# Usage:
#   EXPO_TOKEN="xxx" bash scripts/eas-device-screenshot.sh
#   EXPO_TOKEN="xxx" bash scripts/eas-device-screenshot.sh --skip-device
#   EXPO_TOKEN="xxx" bash scripts/eas-device-screenshot.sh --skip-device --skip-build
set -e

PROJ_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUNDLE_ID="com.pixelherbarium.app"
REPO="zmuleyu/pixel-herbarium"
BUILD_PROFILE="preview-screenshot"

SKIP_DEVICE=""
SKIP_BUILD=""
for arg in "$@"; do
  case "$arg" in
    --skip-device) SKIP_DEVICE=1 ;;
    --skip-build)  SKIP_BUILD=1 ;;
  esac
done

cd "$PROJ_DIR"

# ============================================================
# Step 0: Environment check
# ============================================================
echo ""
echo "========================================="
echo "  Step 0: Environment Check"
echo "========================================="

# Check node/npx
if ! command -v npx &>/dev/null; then
  echo "ERROR: npx not found. Install Node.js first."
  exit 1
fi
echo "  ✓ node $(node -v) / npx available"

# Check EXPO_TOKEN
if [ -z "${EXPO_TOKEN:-}" ]; then
  echo ""
  echo "ERROR: EXPO_TOKEN not set."
  echo ""
  echo "  How to get a token:"
  echo "  1. Open https://expo.dev/login in browser"
  echo "  2. Login (use 'Continue with GitHub' if you forgot password)"
  echo "  3. Go to https://expo.dev/settings/access-tokens"
  echo "  4. Create Token → copy it"
  echo "  5. Re-run: EXPO_TOKEN=\"your-token-here\" bash scripts/eas-device-screenshot.sh"
  echo ""
  exit 1
fi
echo "  ✓ EXPO_TOKEN set"

# Auto-detect proxy
detect_proxy() {
  # Try direct connection first
  if curl -s --connect-timeout 3 https://expo.dev -o /dev/null 2>/dev/null; then
    echo "  ✓ Direct connection OK (no proxy needed)"
    return
  fi
  # Try common proxy ports
  for PORT in 7890 7891 1087 8080; do
    if curl -s --connect-timeout 3 -x "http://127.0.0.1:$PORT" https://expo.dev -o /dev/null 2>/dev/null; then
      export HTTPS_PROXY="http://127.0.0.1:$PORT"
      export HTTP_PROXY="http://127.0.0.1:$PORT"
      export https_proxy="http://127.0.0.1:$PORT"
      export http_proxy="http://127.0.0.1:$PORT"
      echo "  ✓ Proxy detected: 127.0.0.1:$PORT"
      return
    fi
  done
  echo ""
  echo "  WARNING: Cannot reach expo.dev (no direct or proxy connection)"
  echo "  Make sure your proxy software (Clash/V2Ray) is running."
  echo ""
  read -p "  Press Enter to continue anyway, or Ctrl+C to abort... "
}
detect_proxy

# ============================================================
# Step 1: EAS Login Verification
# ============================================================
echo ""
echo "========================================="
echo "  Step 1: EAS Login"
echo "========================================="

EAS_USER=$(npx eas whoami 2>/dev/null || true)
if [ -n "$EAS_USER" ]; then
  echo "  ✓ Logged in as: $EAS_USER"
else
  echo "  ERROR: EXPO_TOKEN invalid or expired."
  echo "  Get a new token from https://expo.dev/settings/access-tokens"
  exit 1
fi

# ============================================================
# Step 2: Register Device (skip with --skip-device)
# ============================================================
echo ""
echo "========================================="
echo "  Step 2: Register iPhone Device"
echo "========================================="

if [ -n "$SKIP_DEVICE" ]; then
  echo "  [skipped] --skip-device flag set"
else
  echo "  Running eas device:create ..."
  echo "  A URL will appear — open it in iPhone Safari to install the profile."
  echo ""
  npx eas device:create || {
    echo ""
    echo "  WARNING: device:create failed."
    echo "  If device is already registered, re-run with --skip-device"
    echo ""
    read -p "  Press Enter to continue, or Ctrl+C to abort... "
  }
  echo ""
  read -p "  ✋ Have you installed the profile on iPhone? Press Enter to continue... "
fi

# ============================================================
# Step 3: Trigger EAS Build (skip with --skip-build)
# ============================================================
echo ""
echo "========================================="
echo "  Step 3: EAS Build"
echo "========================================="

if [ -n "$SKIP_BUILD" ]; then
  echo "  [skipped] --skip-build flag set"
else
  echo "  Building profile: $BUILD_PROFILE (cloud build, ~20-30 min)"
  echo "  This does NOT require local Xcode."
  echo ""
  npx eas build --profile "$BUILD_PROFILE" --platform ios --non-interactive || {
    echo ""
    echo "  ERROR: Build failed. Check the build logs:"
    echo "  npx eas build:list --platform ios --limit 1"
    exit 1
  }
fi

# ============================================================
# Step 4: Get Install Link
# ============================================================
echo ""
echo "========================================="
echo "  Step 4: Install on iPhone"
echo "========================================="

echo "  Fetching latest build info..."
npx eas build:list --platform ios --limit 1 --non-interactive 2>/dev/null || true

echo ""
echo "  ┌─────────────────────────────────────────────┐"
echo "  │  Open the build URL above in iPhone Safari   │"
echo "  │  → Tap 'Install' to download the app         │"
echo "  │  → If blocked: Settings → General →           │"
echo "  │    VPN & Device Management → Trust            │"
echo "  └─────────────────────────────────────────────┘"
echo ""
read -p "  ✋ App installed on iPhone? Press Enter to continue... "

# ============================================================
# Step 5: Screenshot Instructions
# ============================================================
echo ""
echo "========================================="
echo "  Step 5: Take Screenshots"
echo "========================================="
echo ""
echo "  Open the app on iPhone. It will automatically:"
echo "    1. Skip onboarding (screenshot mode)"
echo "    2. Show demo data"
echo "    3. Navigate through 4 screens (~30s each):"
echo "       Screen 1: Home (首页)"
echo "       Screen 2: Check-in (签到)"
echo "       Screen 3: Footprint (足迹)"
echo "       Screen 4: Settings (设置)"
echo ""
echo "  For each screen: press Side Button + Volume Up to screenshot."
echo "  Then AirDrop all 4 screenshots to this Mac."
echo ""
read -p "  ✋ Screenshots transferred to Mac? Press Enter to continue... "

# ============================================================
# Step 6: Organize and Commit
# ============================================================
echo ""
echo "========================================="
echo "  Step 6: Organize & Commit"
echo "========================================="

mkdir -p e2e/current

echo "  Looking for screenshots in ~/Desktop and ~/Downloads..."
FOUND=0
for DIR in ~/Desktop ~/Downloads; do
  for f in "$DIR"/IMG_*.png "$DIR"/IMG_*.PNG "$DIR"/Simulator*.png; do
    [ -f "$f" ] || continue
    echo "  Found: $f"
    FOUND=$((FOUND + 1))
  done
done

if [ "$FOUND" -eq 0 ]; then
  echo ""
  echo "  No screenshots auto-detected."
  echo "  Please manually copy your 4 screenshots to e2e/current/ as:"
  echo "    01-home.png"
  echo "    02-checkin.png"
  echo "    03-footprint.png"
  echo "    04-settings.png"
  echo ""
  read -p "  ✋ Done copying? Press Enter to continue... "
else
  echo ""
  echo "  Found $FOUND image(s). Please manually rename and copy to e2e/current/:"
  echo "    01-home.png  02-checkin.png  03-footprint.png  04-settings.png"
  echo ""
  read -p "  ✋ Done renaming? Press Enter to continue... "
fi

# Validate
COUNT=$(ls e2e/current/*.png 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "  Screenshots in e2e/current/: $COUNT file(s)"
ls -lh e2e/current/*.png 2>/dev/null || true

if [ "$COUNT" -lt 4 ]; then
  echo ""
  echo "  WARNING: Expected 4 screenshots, found $COUNT."
  read -p "  Press Enter to commit anyway, or Ctrl+C to fix first... "
fi

# Commit
echo ""
echo "  Committing..."
git add e2e/current/*.png
git rm --cached e2e/current/04-detail.png 2>/dev/null || true
git commit -m "screenshots: 4-screen capture via iPhone (home/checkin/footprint/settings)" || {
  echo "  Nothing to commit (screenshots unchanged?)"
}

# Push
echo ""
echo "  Pushing to origin/dev..."
if [ -n "${HTTPS_PROXY:-}" ]; then
  PROXY_HOST=$(echo "$HTTPS_PROXY" | sed 's|https\?://||')
  git -c "http.proxy=http://$PROXY_HOST" push origin dev || {
    echo "  Push failed. Try manually:"
    echo "  git push origin dev"
  }
else
  git push origin dev || {
    echo "  Push failed. Try manually:"
    echo "  git push origin dev"
  }
fi

echo ""
echo "========================================="
echo "  ✅ Done! Screenshots committed & pushed"
echo "========================================="
echo ""
