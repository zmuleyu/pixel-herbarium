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

API_URL="https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/workflows/${WORKFLOW_FILE}/runs?head_sha=${TARGET_SHA}&status=completed&per_page=20"

echo "=== Preview gate ===" | tee "$REPORT_PATH"
echo "target_sha=$TARGET_SHA" | tee -a "$REPORT_PATH"
echo "workflow_file=$WORKFLOW_FILE" | tee -a "$REPORT_PATH"

curl -fsSL \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "$API_URL" > "$DIAGNOSTICS_DIR/preview-runs.json"

"$PYTHON_BIN" - "$DIAGNOSTICS_DIR/preview-runs.json" "$REPORT_PATH" "$TARGET_SHA" <<'PY'
import json
import sys
from pathlib import Path

payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
report_path = Path(sys.argv[2])
target_sha = sys.argv[3]
runs = payload.get("workflow_runs", [])
success_run = next((run for run in runs if run.get("head_sha") == target_sha and run.get("conclusion") == "success"), None)

with report_path.open("a", encoding="utf-8") as report:
    report.write(f"runs_found={len(runs)}\n")
    if success_run:
        report.write(f"preview_run_id={success_run['id']}\n")
        report.write(f"preview_run_url={success_run['html_url']}\n")
        report.write("preview_gate=ok\n")
    else:
        report.write("preview_gate=missing-success\n")

if not success_run:
    print("No successful preview workflow found for current sha", file=sys.stderr)
    sys.exit(1)
PY
