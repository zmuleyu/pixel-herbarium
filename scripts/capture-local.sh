#!/bin/bash
# capture-local.sh — Local signal-driven screenshot capture for Machine C
# Replaces GHA's capture role when running via Expo Go on local simulator.
#
# Usage:
#   1. Boot iPhone 15 Pro Max simulator
#   2. Override status bar: xcrun simctl status_bar <UDID> override --time "9:41" ...
#   3. Start this script:  bash scripts/capture-local.sh <SIM_UDID> [expo|native]
#   4. In another terminal:  npx expo start --no-dev --minify
#   5. Open app in Expo Go on simulator
#
# The script polls for signal files written by useScreenshotSequence.ts,
# captures a screenshot when each signal appears, then deletes the signal
# so the app proceeds to the next screen.

set -e

SIM_UDID="${1:?Usage: $0 <SIM_UDID> [expo|native]}"
MODE="${2:-expo}"

if [ "$MODE" = "expo" ]; then
  BUNDLE_ID="host.exp.Exponent"
elif [ "$MODE" = "native" ]; then
  BUNDLE_ID="com.pixelherbarium.app"
else
  echo "Unknown mode: $MODE (use 'expo' or 'native')"
  exit 1
fi

echo "=== PH Local Screenshot Capture ==="
echo "Simulator: $SIM_UDID"
echo "Bundle:    $BUNDLE_ID"
echo "Mode:      $MODE"
echo ""

# Wait for app to launch and create Documents directory
echo "Waiting for app container..."
MAX_WAIT=30
WAIT=0
DATA_DIR=""
while [ $WAIT -lt $MAX_WAIT ]; do
  DATA_DIR=$(xcrun simctl get_app_container "$SIM_UDID" "$BUNDLE_ID" data 2>/dev/null || true)
  if [ -n "$DATA_DIR" ]; then
    break
  fi
  sleep 2
  WAIT=$((WAIT + 2))
done

if [ -z "$DATA_DIR" ]; then
  echo "ERROR: Could not find app container after ${MAX_WAIT}s"
  echo "Make sure the app is running in the simulator."
  exit 1
fi

SIGNAL_DIR="${DATA_DIR}/Documents"
echo "Signal directory: $SIGNAL_DIR"
echo ""

mkdir -p e2e/current

capture_screenshot() {
  local SIGNAL_NAME="$1"
  local OUTPUT="$2"
  local TIMEOUT="${3:-90}"
  local ELAPSED=0

  echo "Waiting for signal: $SIGNAL_NAME ..."

  while [ $ELAPSED -lt $TIMEOUT ]; do
    if [ -f "${SIGNAL_DIR}/${SIGNAL_NAME}" ]; then
      # Small delay to ensure render is fully committed
      sleep 0.5
      xcrun simctl io "$SIM_UDID" screenshot "$OUTPUT"
      rm -f "${SIGNAL_DIR}/${SIGNAL_NAME}"
      echo "  -> $(basename "$OUTPUT") captured (${ELAPSED}s)"
      return 0
    fi
    sleep 1
    ELAPSED=$((ELAPSED + 1))
  done

  echo "  -> TIMEOUT (${TIMEOUT}s) waiting for $SIGNAL_NAME"
  # Take screenshot anyway for debugging
  xcrun simctl io "$SIM_UDID" screenshot "$OUTPUT" 2>/dev/null || true
  return 1
}

FAIL=0

# 01 — Home (with emoji placeholder cards)
capture_screenshot "screenshot_ready_home"      "e2e/current/01-home.png"      90 || FAIL=1

# 02 — Checkin photo step
capture_screenshot "screenshot_ready_checkin"    "e2e/current/02-checkin.png"   60 || FAIL=1

# 03 — Footprint history grid
capture_screenshot "screenshot_ready_footprint"  "e2e/current/03-footprint.png" 60 || FAIL=1

# 04 — Settings
capture_screenshot "screenshot_ready_settings"   "e2e/current/04-settings.png"  60 || FAIL=1

echo ""
echo "=== Results ==="
if [ $FAIL -eq 0 ]; then
  echo "All 4 screenshots captured successfully!"
else
  echo "WARNING: Some captures failed (see above)"
fi
echo ""
ls -lh e2e/current/*.png 2>/dev/null || echo "No screenshots found"

# Validate dimensions
echo ""
echo "=== Dimensions ==="
for f in e2e/current/*.png; do
  if [ -f "$f" ]; then
    W=$(sips -g pixelWidth  "$f" 2>/dev/null | awk '/pixelWidth/{print $2}')
    H=$(sips -g pixelHeight "$f" 2>/dev/null | awk '/pixelHeight/{print $2}')
    echo "  $(basename "$f"): ${W}x${H}px"
  fi
done
