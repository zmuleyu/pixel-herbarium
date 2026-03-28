#!/bin/bash
set -euo pipefail

source "$PWD/scripts/ios-build-config.sh"

DIAGNOSTICS_DIR="${DIAGNOSTICS_DIR:-$BUILD_OUTPUT_DIR/diagnostics}"
VARIANT="${1:-preview}"
SCREENSHOT_MODE="${SCREENSHOT_MODE:-false}"
PACKAGE_JSON_BAK=""

restore_package_json() {
  if [[ -n "$PACKAGE_JSON_BAK" && -f "$PACKAGE_JSON_BAK" ]]; then
    mv "$PACKAGE_JSON_BAK" package.json
  fi
}

trap restore_package_json EXIT

echo "=== iOS build setup ==="
echo "Variant: $VARIANT"
echo "Screenshot mode: $SCREENSHOT_MODE"

mkdir -p "$BUILD_OUTPUT_DIR" "$DIAGNOSTICS_DIR"

bash scripts/inject-env.sh "$VARIANT"

if [[ "$VARIANT" == "production" ]]; then
  echo "=== Removing Expo dev client from production prebuild inputs ==="
  PACKAGE_JSON_BAK="$(mktemp package.json.XXXXXX.bak)"
  cp package.json "$PACKAGE_JSON_BAK"
  node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));if(pkg.dependencies){delete pkg.dependencies['expo-dev-client'];}fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2)+'\\n');"
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
if [[ "$VARIANT" == "production" ]]; then
  npx expo prebuild --platform ios --clean --no-install
else
  npx expo prebuild --platform ios --clean
fi

echo "=== Applying pre-pod compatibility patches ==="
bash scripts/patch-xcode26-compat.sh --pre-pod

echo "=== Installing CocoaPods ==="
(
  cd ios
  pod install
)

echo "=== Applying post-pod compatibility patches ==="
bash scripts/patch-xcode26-compat.sh --post-pod

echo "=== Verifying compatibility patches ==="
bash scripts/ios-patch-verify.sh

{
  echo "variant=$VARIANT"
  echo "workflow_sha=${GITHUB_SHA:-unknown}"
  echo "actual_sha=$(git rev-parse HEAD)"
  echo "xcode_version=$(xcodebuild -version | tr '\n' '; ' | sed 's/; $//')"
  echo "sdk_version=$(xcodebuild -showsdks | tr '\n' '; ' | sed 's/; $//')"
  echo "patch_source=patch-package"
  echo "patches_applied=expo-modules-core,expo-router,expo-notifications,expo-image-picker,expo-image"
  echo "patches_verified=ok"
} | tee "$DIAGNOSTICS_DIR/build-summary.txt"

echo "=== iOS build setup complete ==="
