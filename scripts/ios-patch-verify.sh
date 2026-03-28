#!/bin/bash
set -euo pipefail

source "$PWD/scripts/ios-build-config.sh"

DIAGNOSTICS_DIR="${DIAGNOSTICS_DIR:-$BUILD_OUTPUT_DIR/diagnostics}"
REPORT_PATH="${PATCH_VERIFY_REPORT_PATH:-$DIAGNOSTICS_DIR/patch-verify.txt}"

mkdir -p "$DIAGNOSTICS_DIR"
: > "$REPORT_PATH"

if command -v node >/dev/null 2>&1; then
  NODE_BIN="node"
elif command -v node.exe >/dev/null 2>&1; then
  NODE_BIN="node.exe"
else
  echo "node or node.exe is required" | tee -a "$REPORT_PATH" >&2
  exit 1
fi

assert_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "Missing expected file: $path" | tee -a "$REPORT_PATH" >&2
    exit 1
  fi
}

assert_contains() {
  local path="$1"
  local pattern="$2"
  local label="$3"
  if ! grep -Fq "$pattern" "$path"; then
    echo "Missing expected patched state: $label ($path)" | tee -a "$REPORT_PATH" >&2
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

PATCH_FILES=(
  "patches/expo-router+55.0.5.patch"
  "patches/expo-notifications+55.0.12.patch"
  "patches/expo-image-picker+55.0.12.patch"
  "patches/expo-image+55.0.6.patch"
  "patches/expo-modules-core+55.0.17.patch"
)

for file in "${PATCH_FILES[@]}"; do
  assert_file "$file"
done

echo "=== patch-package check ===" | tee -a "$REPORT_PATH"
"$NODE_BIN" node_modules/patch-package/dist/index.js --check 2>&1 | tee -a "$REPORT_PATH"

ROUTER_HOST="node_modules/expo-router/ios/Toolbar/RouterToolbarHostView.swift"
ROUTER_ITEM="node_modules/expo-router/ios/Toolbar/RouterToolbarItemView.swift"
ROUTER_MODULE="node_modules/expo-router/ios/Toolbar/RouterToolbarModule.swift"
NOTIFICATIONS="node_modules/expo-notifications/ios/ExpoNotifications/Notifications/DateComponentsSerializer.swift"
IMAGE_PICKER="node_modules/expo-image-picker/ios/MediaHandler.swift"
IMAGE_MODULE="node_modules/expo-image/ios/ImageModule.swift"
IMAGE_VIEW="node_modules/expo-image/ios/ImageView.swift"
MODULES_PODSPEC="node_modules/expo-modules-core/ExpoModulesCore.podspec"
MODULES_HOSTING="node_modules/expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIHostingView.swift"
MODULES_VIRTUAL="node_modules/expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIVirtualView.swift"
MODULES_VIEWDEF="node_modules/expo-modules-core/ios/Core/Views/ViewDefinition.swift"

for file in "$ROUTER_HOST" "$ROUTER_ITEM" "$ROUTER_MODULE" "$NOTIFICATIONS" "$IMAGE_PICKER" "$IMAGE_MODULE" "$IMAGE_VIEW" "$MODULES_PODSPEC" "$MODULES_HOSTING" "$MODULES_VIRTUAL" "$MODULES_VIEWDEF"; do
  assert_file "$file"
done

assert_contains "$MODULES_PODSPEC" "s.swift_version  = '5.9'" "expo-modules-core swift 5.9"
assert_absent "$MODULES_HOSTING" "@MainActor AnyExpoSwiftUIHostingView" "expo-modules-core hosting actor annotation"
assert_absent "$MODULES_VIRTUAL" "@MainActor ExpoSwiftUI.ViewWrapper" "expo-modules-core virtual actor annotation"
assert_absent "$MODULES_VIEWDEF" "extension UIView: @MainActor AnyArgument" "expo-modules-core UIView actor annotation"

assert_contains "$ROUTER_HOST" "Xcode 16.x SDK does not expose iOS 26 toolbar background APIs." "expo-router toolbar background fallback"
assert_contains "$ROUTER_ITEM" "Toolbar search bar is unavailable on the current Xcode SDK." "expo-router search fallback"
assert_contains "$ROUTER_ITEM" "Xcode 16.x SDK does not expose iOS 26 toolbar background APIs." "expo-router toolbar item background fallback"
assert_contains "$ROUTER_ITEM" "Xcode 16.x SDK does not expose iOS 26 toolbar badge APIs." "expo-router badge fallback"
assert_contains "$ROUTER_MODULE" "return .done" "expo-router prominent fallback"

assert_contains "$NOTIFICATIONS" "Xcode 16.x SDK does not expose iOS 26 DateComponents.isRepeatedDay." "expo-notifications repeated day fallback"
assert_contains "$IMAGE_PICKER" "let utType = UTType(filenameExtension: fileExtension)" "expo-image-picker asset mime type fallback"
assert_contains "$IMAGE_PICKER" "let utType = UTType(resource.uniformTypeIdentifier) ?? UTType(filenameExtension: fileExtension)" "expo-image-picker resource mime type fallback"
assert_contains "$IMAGE_MODULE" "DispatchQueue.main.async" "expo-image main thread dispatch"
assert_contains "$IMAGE_VIEW" "pendingOperation?.cancel()" "expo-image deinit fallback"
assert_contains "$IMAGE_VIEW" "skip analysis to preserve a stable release pipeline." "expo-image analysis disabled for Xcode 16"

assert_absent "$NOTIFICATIONS" "dateComponents.isRepeatedDay" "DateComponents.isRepeatedDay"
assert_absent "$IMAGE_PICKER" "asset?.contentType" "PHAsset.contentType"
assert_absent "$IMAGE_PICKER" "resource.contentType" "PHAssetResource.contentType"
assert_absent "$ROUTER_ITEM" "item = controller.navigationItem.searchBarPlacementBarButtonItem" "searchBarPlacementBarButtonItem"
assert_absent "$ROUTER_HOST" "menu.hidesSharedBackground" "hidesSharedBackground host"
assert_absent "$ROUTER_HOST" "item.hidesSharedBackground" "hidesSharedBackground host assignment"
assert_absent "$ROUTER_ITEM" "item.hidesSharedBackground =" "hidesSharedBackground item"
assert_absent "$IMAGE_VIEW" "drawOn" "drawOn"
assert_absent "$IMAGE_VIEW" "drawOff" "drawOff"
assert_absent "$IMAGE_VIEW" "imageAnalyzer.analyze(" "ImageAnalyzer.analyze invocation"

{
  echo "patch_source=patch-package"
  echo "patches_applied=expo-modules-core,expo-router,expo-notifications,expo-image-picker,expo-image"
  echo "patches_verified=ok"
} | tee -a "$REPORT_PATH"
