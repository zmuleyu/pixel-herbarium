#!/bin/bash
# Local iOS Simulator Screenshot Generator
# Run on Mac with Xcode 26+ installed
# Usage: EXPO_PUBLIC_SCREENSHOT_MODE=true bash scripts/local-screenshots.sh [--capture-only]
set -euo pipefail

PROJ_DIR="${PROJ_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$PROJ_DIR"

CAPTURE_ONLY="${1:-}"

# Card tap coordinates for detail screenshot (adjust if UI layout changes)
CARD_X="${CARD_X:-220}"
CARD_Y="${CARD_Y:-500}"

if [ "$CAPTURE_ONLY" != "--capture-only" ]; then
  echo "=== Step 1: Patch node_modules for Xcode 26 ==="
  # Swift version downgrade
  sed -i '' "s/s\.swift_version  = '6\.0'/s.swift_version  = '5.9'/" \
    node_modules/expo-modules-core/ExpoModulesCore.podspec 2>/dev/null || true

  # Remove @MainActor (Swift 6 syntax)
  HOSTING="node_modules/expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIHostingView.swift"
  VIRTUAL="node_modules/expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIVirtualView.swift"
  VIEWDEF="node_modules/expo-modules-core/ios/Core/Views/ViewDefinition.swift"
  sed -i '' 's/, @MainActor AnyExpoSwiftUIHostingView/, AnyExpoSwiftUIHostingView/' "$HOSTING" 2>/dev/null || true
  sed -i '' 's/: @MainActor ExpoSwiftUI\.ViewWrapper/: ExpoSwiftUI.ViewWrapper/' "$VIRTUAL" 2>/dev/null || true
  sed -i '' 's/extension UIView: @MainActor AnyArgument {/extension UIView: AnyArgument {/' "$VIEWDEF" 2>/dev/null || true

  # Patch verification (Swift + @MainActor)
  SWIFT_OK="✗"; ACTOR_OK="✗"
  grep -q "swift_version  = '5.9'" node_modules/expo-modules-core/ExpoModulesCore.podspec 2>/dev/null && SWIFT_OK="✓"
  grep -qL "@MainActor" "$HOSTING" 2>/dev/null && ACTOR_OK="✓"
  echo "  Patch status — Swift 5.9: $SWIFT_OK | @MainActor removed: $ACTOR_OK"
  if [ "$SWIFT_OK" = "✗" ] || [ "$ACTOR_OK" = "✗" ]; then
    echo "ERROR: Xcode 26 patch failed. Check expo-modules-core version."
    echo "  expo-modules-core may have been upgraded — review sed patterns in Step 1."
    exit 1
  fi

  echo "=== Step 2: Prebuild + Pod Install ==="
  EXPO_PUBLIC_SCREENSHOT_MODE=true npx expo prebuild --platform ios --clean
  cd ios && pod install && cd ..

  echo "=== Step 3: Patch folly headers ==="
  find ios/Pods -name '*.h' -path '*/folly/*' -type l 2>/dev/null | while read f; do
    cp -L "$f" "$f.tmp" && mv "$f.tmp" "$f"
  done
  for f in $(find ios/Pods -name '*.h' -path '*/folly/*' -type f 2>/dev/null); do
    if grep -q '#if FOLLY_HAS_COROUTINES' "$f"; then
      sed -i '' 's/#if FOLLY_HAS_COROUTINES/#if 0 \/* FOLLY_HAS_COROUTINES disabled *\//' "$f"
    fi
  done
  FOLLY_PATCHED=$(grep -rl '#if 0 /\* FOLLY_HAS_COROUTINES' ios/Pods 2>/dev/null | wc -l | tr -d ' ')
  echo "  Folly patches applied: ${FOLLY_PATCHED} files"

  echo "=== Step 4: Build ==="
  cd ios
  xcodebuild \
    -workspace app.xcworkspace \
    -scheme app \
    -configuration Release \
    -sdk iphonesimulator \
    -derivedDataPath build \
    ONLY_ACTIVE_ARCH=NO \
    CODE_SIGNING_ALLOWED=NO \
    build
  cd ..

  echo "=== Step 5: Find .app ==="
  APP_PATH=$(find ios/build -name "*.app" -path "*Release-iphonesimulator*" | head -1)
  if [ -z "$APP_PATH" ]; then
    echo "ERROR: .app not found in ios/build. Build may have failed."
    exit 1
  fi
  echo "Built: $APP_PATH"

  echo "=== Step 6: Boot Simulator ==="
  DEVICE=""
  for d in "iPhone 17 Pro Max" "iPhone 17 Pro" "iPhone 16 Pro Max" "iPhone 16 Pro" "iPhone 15 Pro Max"; do
    if xcrun simctl list devices available | grep -q "$d"; then
      DEVICE="$d"
      break
    fi
  done
  if [ -z "$DEVICE" ]; then
    echo "ERROR: No suitable simulator device found"
    xcrun simctl list devices available
    exit 1
  fi
  echo "Using device: $DEVICE"
  xcrun simctl boot "$DEVICE" 2>/dev/null || true
  sleep 5

  echo "=== Step 7: Install App ==="
  xcrun simctl install booted "$APP_PATH"
  xcrun simctl privacy booted grant camera com.pixelherbarium.app
  xcrun simctl privacy booted grant location com.pixelherbarium.app
  xcrun simctl privacy booted grant photos com.pixelherbarium.app
fi

echo "=== Step 8: Launch & Capture ==="
# In full mode, reinstall for clean state; --capture-only keeps existing data
if [ "$CAPTURE_ONLY" != "--capture-only" ]; then
  echo "Reinstalling app for clean state..."
  xcrun simctl uninstall booted com.pixelherbarium.app 2>/dev/null || true
  xcrun simctl install booted "$APP_PATH"
  xcrun simctl privacy booted grant camera com.pixelherbarium.app
  xcrun simctl privacy booted grant location com.pixelherbarium.app
  xcrun simctl privacy booted grant photos com.pixelherbarium.app
else
  xcrun simctl terminate booted com.pixelherbarium.app 2>/dev/null || true
  sleep 1
fi

# Launch fresh
xcrun simctl launch booted com.pixelherbarium.app
echo "App launched — useScreenshotSequence auto-navigating..."

# Timing design (synced with useScreenshotSequence.ts):
#   Auth bootstrap: 3-8s → tabs mount at T+3 to T+8
#   Hook delays (from mount): checkin@+17s, settings@+32s, home@+47s
#   Script captures (from launch): T+15, T+30, T+45, T+60+3
#   Each capture has 5-12s buffer before next hook navigation.
#   If auth is slow (>12s), 01-home may catch onboarding.
#   Fix: re-run with --capture-only (app already past auth on 2nd launch).

mkdir -p e2e/current

sleep 15  # T+15s: home (hook checkin at T+20~25, still on home)
xcrun simctl io booted screenshot e2e/current/01-home.png
echo "✓ 01-home (T+15s)"

sleep 15  # T+30s: checkin (hook navigated at T+20~25, settings at T+35~40)
xcrun simctl io booted screenshot e2e/current/02-checkin.png
echo "✓ 02-checkin (T+30s)"

sleep 15  # T+45s: settings (hook navigated at T+35~40, home at T+50~55)
xcrun simctl io booted screenshot e2e/current/03-settings.png
echo "✓ 03-settings (T+45s)"

sleep 15  # T+60s: home again (hook navigated at T+50~55)
# Tap a plant card for detail view (override: CARD_X=300 CARD_Y=600 bash ...)
xcrun simctl ui booted tap $CARD_X $CARD_Y 2>/dev/null || echo "WARN: card tap failed — tap manually in Simulator, then re-run with --capture-only"
sleep 3
xcrun simctl io booted screenshot e2e/current/04-detail.png
echo "✓ 04-detail (T+63s)"

echo ""
echo "=== Step 9: Verify ==="

# Auto-validate card tap success
DETAIL_MD5=$(md5 -q e2e/current/04-detail.png 2>/dev/null || echo "none")
HOME_MD5=$(md5 -q e2e/current/01-home.png 2>/dev/null || echo "none2")
if [ "$DETAIL_MD5" = "$HOME_MD5" ]; then
  echo ""
  echo "⚠️  04-detail 与 01-home MD5 相同 — card tap 未命中"
  echo "请在 Simulator 中手动点击一张植物卡片，然后运行："
  echo "  bash scripts/local-screenshots.sh --capture-only"
  echo ""
fi

echo "--- File sizes ---"
ls -la e2e/current/*.png
echo ""
echo "--- Dimensions ---"
for f in e2e/current/*.png; do
  DIM=$(sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null | awk '/pixel/{print $2}' | tr '\n' 'x' | sed 's/x$//')
  echo "  $(basename "$f"): ${DIM:-unknown}"
done
echo "  Expected: 1290x2796 (6.7\") or 1284x2778 (6.5\")"
echo ""
echo "--- MD5 checksums ---"
md5 e2e/current/*.png
echo ""
echo "If all 4 MD5 values are different → screenshots are valid!"
