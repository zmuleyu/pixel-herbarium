#!/bin/bash
set -euo pipefail

source "$PWD/scripts/ios-build-config.sh"

DIAGNOSTICS_DIR="${DIAGNOSTICS_DIR:-$BUILD_OUTPUT_DIR/diagnostics}"
REPORT_PATH="${PATCH_VERIFY_REPORT_PATH:-$DIAGNOSTICS_DIR/patch-verify.txt}"
MARKER_PREFIX="// PH Xcode 16 compatibility patch"

mkdir -p "$DIAGNOSTICS_DIR"

assert_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "Missing expected patch target: $path" | tee -a "$REPORT_PATH" >&2
    exit 1
  fi
}

assert_contains() {
  local path="$1"
  local pattern="$2"
  local label="$3"
  if ! grep -Fq "$pattern" "$path"; then
    echo "Missing patch marker: $label ($path)" | tee -a "$REPORT_PATH" >&2
    exit 1
  fi
}

assert_absent() {
  local path="$1"
  local pattern="$2"
  local label="$3"
  if grep -Fq "$pattern" "$path"; then
    echo "Forbidden API still present: $label ($path)" | tee -a "$REPORT_PATH" >&2
    exit 1
  fi
}

: > "$REPORT_PATH"

echo "=== Patch verify ===" | tee -a "$REPORT_PATH"

ROUTER_HOST="node_modules/expo-router/ios/Toolbar/RouterToolbarHostView.swift"
ROUTER_ITEM="node_modules/expo-router/ios/Toolbar/RouterToolbarItemView.swift"
ROUTER_MODULE="node_modules/expo-router/ios/Toolbar/RouterToolbarModule.swift"
NOTIFICATIONS="node_modules/expo-notifications/ios/ExpoNotifications/Notifications/DateComponentsSerializer.swift"
IMAGE_PICKER="node_modules/expo-image-picker/ios/MediaHandler.swift"
IMAGE_MODULE="node_modules/expo-image/ios/ImageModule.swift"
IMAGE_VIEW="node_modules/expo-image/ios/ImageView.swift"

for file in "$ROUTER_HOST" "$ROUTER_ITEM" "$ROUTER_MODULE" "$NOTIFICATIONS" "$IMAGE_PICKER" "$IMAGE_MODULE" "$IMAGE_VIEW"; do
  assert_file "$file"
done

assert_contains "$ROUTER_HOST" "disable expo-router toolbar background APIs." "expo-router toolbar background"
assert_contains "$ROUTER_ITEM" "disable expo-router toolbar search button." "expo-router toolbar search button"
assert_contains "$ROUTER_ITEM" "disable expo-router toolbar item background APIs." "expo-router toolbar background item"
assert_contains "$ROUTER_ITEM" "disable expo-router toolbar badge APIs." "expo-router toolbar badge"
assert_contains "$ROUTER_MODULE" "fallback expo-router prominent to done." "expo-router prominent fallback"
assert_contains "$NOTIFICATIONS" "disable expo-notifications repeated day API." "expo-notifications repeated day"
assert_contains "$IMAGE_PICKER" "fallback expo-image-picker asset mime type inference." "expo-image-picker asset mime type"
assert_contains "$IMAGE_PICKER" "fallback expo-image-picker resource mime type inference." "expo-image-picker resource mime type"
assert_contains "$IMAGE_MODULE" "force expo-image startAnimating onto main thread." "expo-image startAnimating"
assert_contains "$IMAGE_VIEW" "disable expo-image iOS 26 draw symbol effects." "expo-image draw effects"
assert_contains "$IMAGE_VIEW" "cancel expo-image pending operation without actor-isolated helper." "expo-image deinit"
assert_contains "$IMAGE_VIEW" "$MARKER_PREFIX: expo-image analyze image main actor" "expo-image analyze image"

assert_absent "$NOTIFICATIONS" "isRepeatedDay" "DateComponents.isRepeatedDay"
assert_absent "$IMAGE_PICKER" "contentType" "PHAsset.contentType / PHAssetResource.contentType"
assert_absent "$ROUTER_ITEM" "searchBarPlacementBarButtonItem" "searchBarPlacementBarButtonItem"
assert_absent "$ROUTER_HOST" "hidesSharedBackground" "hidesSharedBackground"
assert_absent "$ROUTER_ITEM" "hidesSharedBackground" "hidesSharedBackground"
assert_absent "$IMAGE_VIEW" "drawOn" "drawOn"
assert_absent "$IMAGE_VIEW" "drawOff" "drawOff"

{
  echo "patches_applied=expo-router,expo-notifications,expo-image-picker,expo-image"
  echo "patches_verified=ok"
} | tee -a "$REPORT_PATH"
