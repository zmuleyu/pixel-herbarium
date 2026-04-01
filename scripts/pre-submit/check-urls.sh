#!/bin/bash
# check-urls.sh — Verify Support/Privacy/Marketing URLs are accessible with valid SSL
# Usage: bash scripts/pre-submit/check-urls.sh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
APP_JSON="$PROJECT_DIR/app.json"

PASS=0
FAIL=0
WARN=0

print_result() {
  local status=$1
  local label=$2
  local detail=$3
  if [ "$status" = "PASS" ]; then
    echo "  ✅ $label — $detail"
    PASS=$((PASS + 1))
  elif [ "$status" = "FAIL" ]; then
    echo "  ❌ $label — $detail"
    FAIL=$((FAIL + 1))
  else
    echo "  ⚠️  $label — $detail"
    WARN=$((WARN + 1))
  fi
}

echo "═══ Pre-Submit: URL Check ═══"
echo ""

# Extract URLs from app.json (use relative path for Windows/Git Bash compat)
cd "$PROJECT_DIR"
SUPPORT_URL=$(node -e "const a=require('./app.json'); console.log(a.expo?.extra?.supportUrl || a.expo?.ios?.infoPlist?.supportUrl || '')" 2>/dev/null || echo "")
PRIVACY_URL=$(node -e "const a=require('./app.json'); console.log(a.expo?.extra?.privacyPolicyUrl || '')" 2>/dev/null || echo "")

# Also check metadata and review-notes for URLs
METADATA_DIR="$PROJECT_DIR/docs/launch"
ALL_URLS=()

if [ -n "$SUPPORT_URL" ]; then
  ALL_URLS+=("support:$SUPPORT_URL")
fi
if [ -n "$PRIVACY_URL" ]; then
  ALL_URLS+=("privacy:$PRIVACY_URL")
fi

# Check each URL for HTTP 200 + valid SSL
echo "--- URL Accessibility ---"

check_url() {
  local label=$1
  local url=$2

  if [ -z "$url" ]; then
    print_result "WARN" "$label" "URL not found in app.json"
    return
  fi

  local http_code
  http_code=$(curl -sL --max-time 10 -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  local ssl_result
  ssl_result=$(curl -sL --max-time 10 -o /dev/null -w "%{ssl_verify_result}" "$url" 2>/dev/null || echo "99")

  if [ "$http_code" = "200" ] && [ "$ssl_result" = "0" ]; then
    print_result "PASS" "$label" "$url → HTTP $http_code, SSL OK"
  elif [ "$http_code" = "200" ]; then
    print_result "FAIL" "$label" "$url → HTTP $http_code, SSL error ($ssl_result)"
  elif [ "$http_code" = "000" ]; then
    print_result "FAIL" "$label" "$url → Connection failed (timeout or DNS)"
  else
    print_result "FAIL" "$label" "$url → HTTP $http_code"
  fi
}

check_url "Support URL" "$SUPPORT_URL"
check_url "Privacy URL" "$PRIVACY_URL"

# Domain consistency check
echo ""
echo "--- Domain Consistency ---"

DOMAINS=()
extract_domain() {
  echo "$1" | sed -n 's|.*://\([^/]*\).*|\1|p' | sed 's/.*\.\([^.]*\.[^.]*\)$/\1/' || echo ""
}

if [ -n "$SUPPORT_URL" ]; then
  DOMAINS+=("$(extract_domain "$SUPPORT_URL")")
fi
if [ -n "$PRIVACY_URL" ]; then
  DOMAINS+=("$(extract_domain "$PRIVACY_URL")")
fi

# Check docs for URLs with different domains
if [ -d "$METADATA_DIR" ]; then
  DOC_DOMAINS=$(grep -rho 'https\?://pixel-herbarium\.[a-z]*' "$METADATA_DIR" 2>/dev/null | sed 's/.*\.//' | sort -u || echo "")
  for tld in $DOC_DOMAINS; do
    DOMAINS+=("pixel-herbarium.$tld")
  done
fi

UNIQUE_DOMAINS=$(printf '%s\n' "${DOMAINS[@]}" 2>/dev/null | sort -u | grep -v '^$' || echo "")
DOMAIN_COUNT=$(echo "$UNIQUE_DOMAINS" | grep -c . 2>/dev/null || echo "0")

if [ "$DOMAIN_COUNT" -le 1 ]; then
  print_result "PASS" "Domain consistency" "All URLs use same root domain"
elif [ "$DOMAIN_COUNT" -gt 1 ]; then
  print_result "WARN" "Domain consistency" "Multiple domains found: $(echo $UNIQUE_DOMAINS | tr '\n' ', ')"
fi

# Summary
echo ""
echo "═══ Result: $PASS PASS / $FAIL FAIL / $WARN WARN ═══"

if [ "$FAIL" -gt 0 ]; then
  echo "❌ URL check FAILED — fix issues before submitting"
  exit 1
else
  echo "✅ URL check PASSED"
  exit 0
fi
