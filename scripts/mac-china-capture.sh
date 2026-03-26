#!/bin/bash
# mac-china-capture.sh — Mac one-stop screenshot capture (China network optimized)
# Usage:
#   PROXY=http://127.0.0.1:7890 bash scripts/mac-china-capture.sh
#   bash scripts/mac-china-capture.sh                              # no proxy
#   bash scripts/mac-china-capture.sh --skip-download              # use cached _sim-build/*.app
#   bash scripts/mac-china-capture.sh --skip-download /path/app.app # use explicit .app
set -e

PROXY="${PROXY:-}"
RUN_ID="23600114591"
ARTIFACT_NAME="screenshot-sim-d0349921d3e9c705510ce4326d3d13970386f657"
BUNDLE_ID="com.pixelherbarium.app"
REPO="zmuleyu/pixel-herbarium"
PROJ_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$PROJ_DIR/_sim-build"

SKIP_DOWNLOAD=""
MANUAL_APP=""
if [ "${1:-}" = "--skip-download" ]; then
  SKIP_DOWNLOAD=1
  MANUAL_APP="${2:-}"
fi

cd "$PROJ_DIR"

# --- Proxy setup ---
if [ -n "$PROXY" ]; then
  export HTTPS_PROXY="$PROXY" https_proxy="$PROXY"
  export HTTP_PROXY="$PROXY"  http_proxy="$PROXY"
  echo "[proxy] $PROXY"
fi

# --- Step 1: Resolve .app ---
if [ -n "$SKIP_DOWNLOAD" ] && [ -n "$MANUAL_APP" ]; then
  APP_PATH="$MANUAL_APP"
  echo "[skip] Using provided .app: $APP_PATH"
elif [ -n "$SKIP_DOWNLOAD" ]; then
  APP_PATH=$(find "$WORK_DIR" -name "*.app" -type d 2>/dev/null | head -1)
  [ -z "$APP_PATH" ] && echo "ERROR: No .app in $WORK_DIR. Run without --skip-download first." && exit 1
  echo "[skip] Using cached .app: $APP_PATH"
else
  if ! gh auth status &>/dev/null; then
    echo "ERROR: gh not authenticated."
    echo "  Fix: HTTPS_PROXY=${PROXY:-http://127.0.0.1:7890} gh auth login"
    exit 1
  fi
  mkdir -p "$WORK_DIR"
  echo "[download] run=$RUN_ID"
  gh run download "$RUN_ID" --repo "$REPO" \
     --name "$ARTIFACT_NAME" --dir "$WORK_DIR"
  cd "$WORK_DIR"
  tar xzf screenshot-sim.tar.gz 2>/dev/null || true
  APP_PATH=$(find "$WORK_DIR" -name "*.app" -type d | head -1)
  [ -z "$APP_PATH" ] && echo "ERROR: .app not found after extract" && exit 1
  echo "[download] OK: $APP_PATH"
  cd "$PROJ_DIR"
fi

# --- Step 2: Find simulator ---
UDID=""
for MODEL in "iPhone 17 Pro Max" "iPhone 16 Pro Max" "iPhone 16 Pro" "iPhone 15 Pro Max"; do
  UDID=$(xcrun simctl list devices available | grep "$MODEL" | head -1 \
         | grep -oE '[A-F0-9-]{36}')
  [ -n "$UDID" ] && echo "[sim] $MODEL ($UDID)" && break
done
[ -z "$UDID" ] && echo "ERROR: No suitable iPhone simulator found" \
  && xcrun simctl list devices available && exit 1

# --- Step 3: Boot simulator ---
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b &
BPID=$!
( sleep 60; kill $BPID 2>/dev/null ) &
wait $BPID 2>/dev/null || true
sleep 3

# --- Step 4: Install + permissions + status bar ---
xcrun simctl install "$UDID" "$APP_PATH"
xcrun simctl privacy "$UDID" grant camera   "$BUNDLE_ID"
xcrun simctl privacy "$UDID" grant location "$BUNDLE_ID"
xcrun simctl privacy "$UDID" grant photos   "$BUNDLE_ID"
xcrun simctl status_bar "$UDID" override \
  --time "9:41" --batteryState charged --batteryLevel 100 \
  --wifiBars 3 --cellularMode active --cellularBars 4 2>/dev/null \
  || echo "WARN: status_bar override not available"

# --- Step 5: Clean + launch ---
rm -f e2e/current/*.png 2>/dev/null || true
mkdir -p e2e/current
xcrun simctl launch "$UDID" "$BUNDLE_ID"
echo "[launch] App launched, waiting for container..."
sleep 5

MAX_WAIT=30; WAIT=0; DATA_DIR=""
while [ $WAIT -lt $MAX_WAIT ]; do
  DATA_DIR=$(xcrun simctl get_app_container "$UDID" "$BUNDLE_ID" data 2>/dev/null || true)
  [ -n "$DATA_DIR" ] && break
  sleep 2; WAIT=$((WAIT + 2))
done
[ -z "$DATA_DIR" ] && echo "ERROR: App container not found after ${MAX_WAIT}s" && exit 1
SIGNAL_DIR="${DATA_DIR}/Documents"
echo "[signal] $SIGNAL_DIR"

# --- Step 6: Signal-driven capture ---
capture() {
  local SIG="$1" OUT="$2" TIMEOUT="${3:-90}" ELAPSED=0
  echo "[wait] $SIG ..."
  while [ $ELAPSED -lt $TIMEOUT ]; do
    if [ -f "${SIGNAL_DIR}/${SIG}" ]; then
      sleep 0.5
      xcrun simctl io "$UDID" screenshot "$OUT"
      rm -f "${SIGNAL_DIR}/${SIG}"
      echo "  ✓ $(basename "$OUT") (${ELAPSED}s)"
      return 0
    fi
    sleep 1; ELAPSED=$((ELAPSED + 1))
  done
  echo "  TIMEOUT (${TIMEOUT}s): $SIG"
  return 1
}

FAIL=0
capture "screenshot_ready_home"      "e2e/current/01-home.png"      90 || FAIL=1
capture "screenshot_ready_checkin"   "e2e/current/02-checkin.png"   60 || FAIL=1
capture "screenshot_ready_footprint" "e2e/current/03-footprint.png" 60 || FAIL=1
capture "screenshot_ready_settings"  "e2e/current/04-settings.png"  60 || FAIL=1

# --- Step 7: Validate ---
echo ""
echo "=== Results ==="
ls -lh e2e/current/*.png 2>/dev/null || echo "No screenshots found"
echo ""
echo "=== Dimensions ==="
for f in e2e/current/*.png; do
  [ -f "$f" ] || continue
  W=$(sips -g pixelWidth  "$f" 2>/dev/null | awk '/pixelWidth/{print $2}')
  H=$(sips -g pixelHeight "$f" 2>/dev/null | awk '/pixelHeight/{print $2}')
  echo "  $(basename "$f"): ${W}x${H}px"
done
echo "  Expected: 1320x2868 (iPhone 17 Pro Max) or 1290x2796 (16 Pro Max)"

[ $FAIL -ne 0 ] && echo "" && echo "WARNING: Some captures failed — check output above" && exit 1

# --- Step 8: Commit instructions ---
echo ""
echo "=== All 4 screenshots captured! Run to commit: ==="
GIT_CMD="git add e2e/current/*.png"
GIT_CMD="$GIT_CMD && git rm --cached e2e/current/04-detail.png 2>/dev/null || true"
GIT_CMD="$GIT_CMD && git commit -m 'screenshots: 4-screen capture via Mac (home/checkin/footprint/settings)'"
if [ -n "$PROXY" ]; then
  GIT_CMD="$GIT_CMD && git -c http.proxy=$PROXY push origin dev"
else
  GIT_CMD="$GIT_CMD && git push origin dev"
fi
echo "$GIT_CMD"
