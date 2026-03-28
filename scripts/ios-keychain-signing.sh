#!/bin/bash
set -euo pipefail

if [[ -z "${IOS_DIST_P12_BASE64:-}" || -z "${IOS_DIST_P12_PASSWORD:-}" || -z "${IOS_PROFILE_BASE64:-}" || -z "${KEYCHAIN_PASSWORD:-}" ]]; then
  echo "Missing required signing secrets"
  exit 1
fi

TMP_DIR="$(mktemp -d)"
KEYCHAIN_PATH="${RUNNER_TEMP:-$TMP_DIR}/pixel-herbarium-signing.keychain-db"
CERT_PATH="$TMP_DIR/dist-cert.p12"
PROFILE_PATH="$TMP_DIR/profile.mobileprovision"
PROFILE_PLIST="$TMP_DIR/profile.plist"

decode_base64() {
  if base64 --decode >/dev/null 2>&1 <<<""; then
    base64 --decode
  else
    base64 -D
  fi
}

echo "$IOS_DIST_P12_BASE64" | decode_base64 > "$CERT_PATH"
echo "$IOS_PROFILE_BASE64" | decode_base64 > "$PROFILE_PATH"

security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
security set-keychain-settings -lut 21600 "$KEYCHAIN_PATH"
security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
security list-keychains -d user -s "$KEYCHAIN_PATH" login.keychain-db

security import "$CERT_PATH" \
  -P "$IOS_DIST_P12_PASSWORD" \
  -A \
  -t cert \
  -f pkcs12 \
  -k "$KEYCHAIN_PATH"

security set-key-partition-list \
  -S apple-tool:,apple:,codesign: \
  -s \
  -k "$KEYCHAIN_PASSWORD" \
  "$KEYCHAIN_PATH"

mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"

security cms -D -i "$PROFILE_PATH" > "$PROFILE_PLIST"
PROFILE_UUID="$(/usr/libexec/PlistBuddy -c 'Print UUID' "$PROFILE_PLIST")"
PROFILE_NAME="$(/usr/libexec/PlistBuddy -c 'Print Name' "$PROFILE_PLIST")"
cp "$PROFILE_PATH" "$HOME/Library/MobileDevice/Provisioning Profiles/$PROFILE_UUID.mobileprovision"

echo "Installed provisioning profile: $PROFILE_NAME ($PROFILE_UUID)"

if [[ -n "${GITHUB_ENV:-}" ]]; then
  {
    echo "IOS_PROFILE_UUID=$PROFILE_UUID"
    echo "IOS_PROFILE_NAME=$PROFILE_NAME"
    echo "KEYCHAIN_PATH=$KEYCHAIN_PATH"
  } >> "$GITHUB_ENV"
fi
