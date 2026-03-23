#!/bin/bash
# Local iOS Simulator Screenshot Generator
# Run on Mac with Xcode 26+ installed
# Usage: EXPO_PUBLIC_SCREENSHOT_MODE=true bash scripts/local-screenshots.sh [--capture-only]
set -euo pipefail

PROJ_DIR="${PROJ_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$PROJ_DIR"

CAPTURE_ONLY="${1:-}"

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
# Kill any existing instance
xcrun simctl terminate booted com.pixelherbarium.app 2>/dev/null || true
sleep 1

# Launch fresh
xcrun simctl launch booted com.pixelherbarium.app
echo "App launched — useScreenshotSequence auto-navigating..."

mkdir -p e2e/current

# useScreenshotSequence waits for tabs to mount, then navigates:
#   tabs ready + 0s:  home (already here)
#   tabs ready + 5s:  → checkin
#   tabs ready + 10s: → settings
#   tabs ready + 15s: → home (for detail tap)
# Auth bootstrap ~3-8s before tabs mount.

sleep 15  # T+15s: home rendered with demo data
xcrun simctl io booted screenshot e2e/current/01-home.png
echo "✓ 01-home (T+15s)"

sleep 10  # T+25s: checkin tab
xcrun simctl io booted screenshot e2e/current/02-checkin.png
echo "✓ 02-checkin (T+25s)"

sleep 7   # T+32s: settings tab
xcrun simctl io booted screenshot e2e/current/03-settings.png
echo "✓ 03-settings (T+32s)"

sleep 7   # T+39s: home again
# Tap a plant card for detail view
# Adjust CARD_X/CARD_Y if needed for your simulator resolution
CARD_X=220
CARD_Y=500
xcrun simctl ui booted tap $CARD_X $CARD_Y 2>/dev/null || echo "WARN: card tap failed — tap manually in Simulator, then re-run with --capture-only"
sleep 3
xcrun simctl io booted screenshot e2e/current/04-detail.png
echo "✓ 04-detail (T+43s)"

echo ""
echo "=== Step 9: Verify ==="
echo "--- File sizes ---"
ls -la e2e/current/*.png
echo ""
echo "--- MD5 checksums ---"
md5 e2e/current/*.png
echo ""
echo "If all 4 MD5 values are different → screenshots are valid!"
echo "If 04-detail matches 01-home → card tap failed, tap manually and re-run:"
echo "  bash scripts/local-screenshots.sh --capture-only"
