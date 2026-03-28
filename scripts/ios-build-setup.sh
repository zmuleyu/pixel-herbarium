#!/bin/bash
set -euo pipefail

VARIANT="${1:-preview}"
SCREENSHOT_MODE="${SCREENSHOT_MODE:-false}"

echo "=== iOS build setup ==="
echo "Variant: $VARIANT"
echo "Screenshot mode: $SCREENSHOT_MODE"

bash scripts/inject-env.sh "$VARIANT"

if [[ "$VARIANT" == "production" ]]; then
  echo "=== Removing Expo dev client modules for production archive ==="
  rm -rf \
    node_modules/expo-dev-client \
    node_modules/expo-dev-launcher \
    node_modules/expo-dev-menu \
    node_modules/expo-dev-menu-interface
fi

if [[ "$SCREENSHOT_MODE" == "true" ]]; then
  cat >> .env.local <<'EOF'
EXPO_PUBLIC_SCREENSHOT_MODE=true
EOF
  echo "Enabled EXPO_PUBLIC_SCREENSHOT_MODE in .env.local"
fi

echo "=== Running Expo prebuild ==="
npx expo prebuild --platform ios --clean

echo "=== Applying pre-pod compatibility patches ==="
bash scripts/patch-xcode26-compat.sh --pre-pod

echo "=== Installing CocoaPods ==="
(
  cd ios
  pod install
)

echo "=== Applying post-pod compatibility patches ==="
bash scripts/patch-xcode26-compat.sh --post-pod

echo "=== iOS build setup complete ==="
