#!/bin/bash
set -euo pipefail

VARIANT="${1:-preview}"
SCREENSHOT_MODE="${SCREENSHOT_MODE:-false}"

echo "=== iOS build setup ==="
echo "Variant: $VARIANT"
echo "Screenshot mode: $SCREENSHOT_MODE"

bash scripts/inject-env.sh "$VARIANT"

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
