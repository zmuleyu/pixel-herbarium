#!/bin/bash
# check-secrets.sh — Verify all 12 required GitHub Secrets exist for GHA build
# Usage: bash scripts/pre-submit/check-secrets.sh

set -euo pipefail

REPO="zmuleyu/pixel-herbarium"
GH_CMD="${GH_CMD:-/c/Users/Admin/gh-cli/bin/gh}"

# Required secrets for preview-build + release workflows
REQUIRED_SECRETS=(
  "ADHOC_PROVISIONING_PROFILE_BASE64"
  "IOS_APPSTORE_PROFILE_BASE64"
  "APPLE_CERTIFICATE_P12_BASE64"
  "APPLE_CERTIFICATE_PASSWORD"
  "KEYCHAIN_PASSWORD"
  "APPLE_TEAM_ID"
  "EXPO_PUBLIC_SUPABASE_ANON_KEY"
  "EXPO_TOKEN"
  "ASC_KEY_ID"
  "ASC_ISSUER_ID"
  "ASC_PRIVATE_KEY_BASE64"
  "EXPO_APPLE_APP_SPECIFIC_PASSWORD"
)

echo "═══ Pre-Submit: GitHub Secrets Check ═══"
echo ""
echo "  Repo: $REPO"
echo "  Required: ${#REQUIRED_SECRETS[@]} secrets"
echo ""

# Get current secrets list
EXISTING=$("$GH_CMD" secret list --repo "$REPO" 2>/dev/null | awk '{print $1}' || echo "")

if [ -z "$EXISTING" ]; then
  echo "  ❌ Failed to list secrets (check gh auth status)"
  echo ""
  echo "═══ Result: ❌ FAIL ═══"
  exit 1
fi

PASS=0
FAIL=0

for secret in "${REQUIRED_SECRETS[@]}"; do
  if echo "$EXISTING" | grep -q "^${secret}$"; then
    echo "  ✅ $secret"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $secret — MISSING"
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "═══ Result: $PASS/$((PASS + FAIL)) secrets present ═══"

if [ "$FAIL" -gt 0 ]; then
  echo "❌ Secrets check FAILED — $FAIL secret(s) missing"
  echo ""
  echo "To add a missing secret:"
  echo "  $GH_CMD secret set SECRET_NAME --repo $REPO"
  exit 1
else
  echo "✅ All secrets present"
  exit 0
fi
