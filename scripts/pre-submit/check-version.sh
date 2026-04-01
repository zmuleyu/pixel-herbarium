#!/bin/bash
# check-version.sh — Verify app.json version/buildNumber is incremented vs last git tag
# Usage: bash scripts/pre-submit/check-version.sh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
APP_JSON="$PROJECT_DIR/app.json"

echo "═══ Pre-Submit: Version Check ═══"
echo ""

# Read current version from app.json (use relative path for Windows/Git Bash compat)
cd "$PROJECT_DIR"
CURRENT_VERSION=$(node -e "const a=require('./app.json'); console.log(a.expo?.version || a.version || '')")
CURRENT_BUILD=$(node -e "const a=require('./app.json'); console.log(a.expo?.ios?.buildNumber || '')")

echo "  Current: v$CURRENT_VERSION (build $CURRENT_BUILD)"

# Get last git tag version
cd "$PROJECT_DIR"
LAST_TAG=$(git tag --sort=-v:refname 2>/dev/null | head -1 || echo "")

if [ -z "$LAST_TAG" ]; then
  echo "  Last tag: (none found — first release)"
  echo ""
  if [ -n "$CURRENT_VERSION" ] && [ -n "$CURRENT_BUILD" ]; then
    echo "═══ Result: ✅ PASS (first release, version $CURRENT_VERSION build $CURRENT_BUILD) ═══"
    exit 0
  else
    echo "═══ Result: ❌ FAIL (version or buildNumber missing in app.json) ═══"
    exit 1
  fi
fi

echo "  Last tag: $LAST_TAG"

# Extract version from tag (strip v prefix and -buildN suffix)
TAG_VERSION=$(echo "$LAST_TAG" | sed 's/^v//' | sed 's/-build.*//')
TAG_BUILD=$(echo "$LAST_TAG" | sed -n 's/.*build\([0-9]*\).*/\1/p' || echo "0")

echo "  Tag version: $TAG_VERSION (build $TAG_BUILD)"
echo ""

# Compare
FAIL=0

# Check version is valid semver
if ! echo "$CURRENT_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "  ❌ Version '$CURRENT_VERSION' is not valid semver (expected X.Y.Z)"
  FAIL=1
fi

# Check buildNumber is a positive integer
if ! echo "$CURRENT_BUILD" | grep -qE '^[0-9]+$'; then
  echo "  ❌ buildNumber '$CURRENT_BUILD' is not a positive integer"
  FAIL=1
fi

# Check buildNumber is incremented
if [ -n "$CURRENT_BUILD" ] && [ -n "$TAG_BUILD" ] && [ "$CURRENT_BUILD" -le "$TAG_BUILD" ] 2>/dev/null; then
  echo "  ❌ buildNumber $CURRENT_BUILD is not greater than last tag build $TAG_BUILD"
  FAIL=1
else
  echo "  ✅ buildNumber incremented ($TAG_BUILD → $CURRENT_BUILD)"
fi

# Check version is >= last tag
if [ "$CURRENT_VERSION" = "$TAG_VERSION" ]; then
  echo "  ✅ Version unchanged ($CURRENT_VERSION) — buildNumber increment is sufficient"
elif [ "$(printf '%s\n' "$TAG_VERSION" "$CURRENT_VERSION" | sort -V | tail -1)" = "$CURRENT_VERSION" ]; then
  echo "  ✅ Version incremented ($TAG_VERSION → $CURRENT_VERSION)"
else
  echo "  ❌ Version $CURRENT_VERSION is less than last tag $TAG_VERSION"
  FAIL=1
fi

echo ""
if [ "$FAIL" -gt 0 ]; then
  echo "═══ Result: ❌ FAIL — fix version/buildNumber in app.json ═══"
  exit 1
else
  echo "═══ Result: ✅ PASS ═══"
  exit 0
fi
