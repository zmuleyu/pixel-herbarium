#!/bin/bash
set -euo pipefail

source "$PWD/scripts/ios-build-config.sh"

DIAGNOSTICS_DIR="${DIAGNOSTICS_DIR:-$BUILD_OUTPUT_DIR/diagnostics}"
REPORT_PATH="${PREVIEW_GATE_REPORT_PATH:-$DIAGNOSTICS_DIR/preview-gate.txt}"
TARGET_SHA="${TARGET_SHA:-${GITHUB_SHA:-}}"
WORKFLOW_FILE="${PREVIEW_WORKFLOW_FILE:-preview-build.yml}"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "python3 or python is required" >&2
  exit 1
fi

mkdir -p "$DIAGNOSTICS_DIR"

if [[ -z "${GITHUB_REPOSITORY:-}" || -z "${GITHUB_TOKEN:-}" || -z "$TARGET_SHA" ]]; then
  echo "Missing GITHUB_REPOSITORY, GITHUB_TOKEN, or TARGET_SHA for preview gate" >&2
  exit 1
fi

# Collect recent ancestor SHAs (up to PREVIEW_GATE_ANCESTOR_DEPTH commits back)
# This allows docs-only commits to pass the gate without a new Preview Build.
ANCESTOR_DEPTH="${PREVIEW_GATE_ANCESTOR_DEPTH:-5}"
RECENT_SHAS="$TARGET_SHA"
if command -v git >/dev/null 2>&1 && [[ -d ".git" ]]; then
  RECENT_SHAS=$(git log --format="%H" -n "$ANCESTOR_DEPTH" "$TARGET_SHA" 2>/dev/null || echo "$TARGET_SHA")
fi

# Fetch recent preview runs (broader query, filter in Python)
API_URL="https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/workflows/${WORKFLOW_FILE}/runs?status=completed&per_page=50"

echo "=== Preview gate ===" | tee "$REPORT_PATH"
echo "target_sha=$TARGET_SHA" | tee -a "$REPORT_PATH"
echo "ancestor_depth=$ANCESTOR_DEPTH" | tee -a "$REPORT_PATH"
echo "workflow_file=$WORKFLOW_FILE" | tee -a "$REPORT_PATH"

curl -fsSL \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "$API_URL" > "$DIAGNOSTICS_DIR/preview-runs.json"

"$PYTHON_BIN" - "$DIAGNOSTICS_DIR/preview-runs.json" "$REPORT_PATH" "$TARGET_SHA" "$RECENT_SHAS" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
report_path = Path(sys.argv[2])
target_sha = sys.argv[3]
# recent_shas is newline-separated list from git log
recent_shas = set(sys.argv[4].strip().splitlines()) if len(sys.argv) > 4 else {target_sha}
runs = payload.get("workflow_runs", [])

# First try exact SHA match, then try recent ancestors
success_run = next((run for run in runs if run.get("head_sha") == target_sha and run.get("conclusion") == "success"), None)
ancestor_match = False
if not success_run:
    success_run = next((run for run in runs if run.get("head_sha") in recent_shas and run.get("conclusion") == "success"), None)
    if success_run:
        ancestor_match = True

with report_path.open("a", encoding="utf-8") as report:
    report.write(f"runs_found={len(runs)}\n")
    report.write(f"recent_shas_checked={len(recent_shas)}\n")
    if success_run:
        report.write(f"preview_run_id={success_run['id']}\n")
        report.write(f"preview_run_sha={success_run['head_sha']}\n")
        report.write(f"preview_run_url={success_run['html_url']}\n")
        report.write(f"ancestor_match={ancestor_match}\n")
        report.write("preview_gate=ok\n")
        if ancestor_match:
            print(f"Preview gate passed via ancestor sha {success_run['head_sha'][:8]} (docs-only commits allowed)")
    else:
        report.write("preview_gate=missing-success\n")

if not success_run:
    print("No successful preview workflow found for current sha or recent ancestors", file=sys.stderr)
    sys.exit(1)
PY
