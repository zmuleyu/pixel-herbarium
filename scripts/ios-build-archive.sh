#!/bin/bash
set -euo pipefail

source "$PWD/scripts/ios-build-config.sh"

EXPORT_METHOD="${1:-ad-hoc}"
OUTPUT_IPA="${2:-build.ipa}"
ARCHIVE_PATH="${3:-$BUILD_OUTPUT_DIR/app.xcarchive}"
XCRESULT_PATH="${XCRESULT_PATH:-$BUILD_OUTPUT_DIR/${EXPORT_METHOD}-archive.xcresult}"
EXPORT_OPTIONS_DIR="${EXPORT_OPTIONS_DIR:-$BUILD_OUTPUT_DIR/export-options}"

if [[ -z "${APPLE_TEAM_ID:-}" || -z "${IOS_PROFILE_NAME:-}" ]]; then
  echo "Missing APPLE_TEAM_ID or IOS_PROFILE_NAME"
  exit 1
fi

mkdir -p "$BUILD_OUTPUT_DIR" "$EXPORT_OPTIONS_DIR"

EXPORT_DIR="$(mktemp -d)"
EXPORT_OPTIONS_PLIST="$EXPORT_OPTIONS_DIR/ExportOptions-${EXPORT_METHOD}.plist"

render_export_options "$EXPORT_METHOD" "$EXPORT_OPTIONS_PLIST"

rm -rf "$ARCHIVE_PATH"
rm -rf "$XCRESULT_PATH"

echo "=== Archiving iOS app ==="
(
  cd ios
  xcodebuild \
    -workspace "$IOS_WORKSPACE" \
    -scheme "$IOS_SCHEME" \
    -configuration "$IOS_CONFIGURATION" \
    -archivePath "$ARCHIVE_PATH" \
    -resultBundlePath "$XCRESULT_PATH" \
    -destination "generic/platform=iOS" \
    DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
    CODE_SIGN_STYLE="$CODE_SIGN_STYLE" \
    CODE_SIGN_IDENTITY="$CODE_SIGN_IDENTITY" \
    PROVISIONING_PROFILE_SPECIFIER="$IOS_PROFILE_NAME" \
    archive
)

echo "=== Exporting IPA ==="
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR/out" \
  -exportOptionsPlist "$EXPORT_OPTIONS_PLIST"

IPA_PATH="$(find "$EXPORT_DIR/out" -maxdepth 1 -name '*.ipa' -type f | head -1)"
if [[ -z "$IPA_PATH" ]]; then
  echo "No IPA produced"
  exit 1
fi

cp "$IPA_PATH" "$OUTPUT_IPA"
ls -lh "$OUTPUT_IPA"
ls -lh "$EXPORT_OPTIONS_PLIST"
