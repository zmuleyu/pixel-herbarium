#!/bin/bash
set -euo pipefail

IPA_PATH="${1:-production.ipa}"

if [[ ! -f "$IPA_PATH" ]]; then
  echo "IPA not found: $IPA_PATH"
  exit 1
fi

if [[ -n "${ASC_KEY_ID:-}" && -n "${ASC_ISSUER_ID:-}" && -n "${ASC_PRIVATE_KEY_BASE64:-}" ]]; then
  echo "=== Submitting IPA via App Store Connect API key ==="

  TMP_DIR="$(mktemp -d)"
  APPSTORECONNECT_DIR="${HOME}/.appstoreconnect/private_keys"
  KEY_PATH="${APPSTORECONNECT_DIR}/AuthKey_${ASC_KEY_ID}.p8"

  mkdir -p "$APPSTORECONNECT_DIR"

  if base64 --decode >/dev/null 2>&1 <<<""; then
    echo "$ASC_PRIVATE_KEY_BASE64" | base64 --decode > "$KEY_PATH"
  else
    echo "$ASC_PRIVATE_KEY_BASE64" | base64 -D > "$KEY_PATH"
  fi

  chmod 600 "$KEY_PATH"

  xcrun altool \
    --upload-app \
    --type ios \
    --file "$IPA_PATH" \
    --apiKey "$ASC_KEY_ID" \
    --apiIssuer "$ASC_ISSUER_ID"

  rm -rf "$TMP_DIR"
  exit 0
fi

echo "=== ASC API key secrets not found, falling back to eas submit ==="
npx eas submit \
  --platform ios \
  --path "$IPA_PATH" \
  --non-interactive
