#!/bin/bash
set -euo pipefail

EXPORT_METHOD="${1:-ad-hoc}"
OUTPUT_IPA="${2:-build.ipa}"
ARCHIVE_PATH="${3:-$PWD/build/app.xcarchive}"

if [[ -z "${APPLE_TEAM_ID:-}" || -z "${IOS_PROFILE_NAME:-}" ]]; then
  echo "Missing APPLE_TEAM_ID or IOS_PROFILE_NAME"
  exit 1
fi

BUNDLE_ID="${BUNDLE_ID:-com.pixelherbarium.app}"
EXPORT_DIR="$(mktemp -d)"
EXPORT_OPTIONS_PLIST="$EXPORT_DIR/ExportOptions.plist"

case "$EXPORT_METHOD" in
  ad-hoc)
    XCODE_EXPORT_METHOD="ad-hoc"
    ;;
  app-store)
    XCODE_EXPORT_METHOD="app-store"
    ;;
  *)
    echo "Unsupported export method: $EXPORT_METHOD"
    exit 1
    ;;
esac

cat > "$EXPORT_OPTIONS_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>$XCODE_EXPORT_METHOD</string>
  <key>signingStyle</key>
  <string>manual</string>
  <key>teamID</key>
  <string>$APPLE_TEAM_ID</string>
  <key>provisioningProfiles</key>
  <dict>
    <key>$BUNDLE_ID</key>
    <string>$IOS_PROFILE_NAME</string>
  </dict>
</dict>
</plist>
EOF

rm -rf "$ARCHIVE_PATH"

echo "=== Archiving iOS app ==="
(
  cd ios
  xcodebuild \
    -workspace app.xcworkspace \
    -scheme app \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    -destination "generic/platform=iOS" \
    DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
    CODE_SIGN_STYLE=Manual \
    CODE_SIGN_IDENTITY="Apple Distribution" \
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
