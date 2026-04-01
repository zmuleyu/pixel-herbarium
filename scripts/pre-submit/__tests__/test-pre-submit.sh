#!/bin/bash
# test-pre-submit.sh — Unit tests for pre-submit scripts
# Usage: bash scripts/pre-submit/__tests__/test-pre-submit.sh

SCRIPTS_DIR="$(cd "$(dirname "$0")/.." && pwd)"

PASS=0
FAIL=0

run_test() {
  local name="$1"
  local expected_exit="$2"
  shift 2
  local cmd=("$@")

  "${cmd[@]}" > /dev/null 2>&1
  local actual_exit=$?

  if [ "$actual_exit" -eq "$expected_exit" ]; then
    echo "PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $name (expected exit $expected_exit, got $actual_exit)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Pre-Submit Script Tests ==="
echo ""

# check-version.sh: expects exit 0 (app.json has valid version + buildNumber)
run_test "check-version.sh exits 0" 0 \
  bash "$SCRIPTS_DIR/check-version.sh"

# check-urls.sh: expects exit 0 (URLs accessible or WARN is acceptable)
run_test "check-urls.sh exits 0" 0 \
  bash "$SCRIPTS_DIR/check-urls.sh"

# check-secrets.sh: syntax check with bash -n expects exit 0
run_test "check-secrets.sh syntax valid (bash -n)" 0 \
  bash -n "$SCRIPTS_DIR/check-secrets.sh"

echo ""
echo "=== Results: $PASS PASS / $FAIL FAIL ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
else
  exit 0
fi
