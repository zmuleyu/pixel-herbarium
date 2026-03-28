#!/bin/bash
set -euo pipefail

source "$PWD/scripts/ios-build-config.sh"

DIAGNOSTICS_DIR="${DIAGNOSTICS_DIR:-$BUILD_OUTPUT_DIR/diagnostics}"
EXPECTED_SHA="${EXPECTED_SHA:-${GITHUB_SHA:-}}"
CURRENT_SHA="$(git rev-parse HEAD)"
REF_NAME="${GITHUB_REF_NAME:-}"
REF_TYPE="${GITHUB_REF_TYPE:-}"
REMOTE_SHA=""

mkdir -p "$DIAGNOSTICS_DIR"

if [[ -z "$EXPECTED_SHA" ]]; then
  echo "Missing EXPECTED_SHA/GITHUB_SHA for ref gate" >&2
  exit 1
fi

if [[ "$REF_TYPE" == "branch" && -n "$REF_NAME" ]]; then
  REMOTE_SHA="$(git ls-remote origin "refs/heads/$REF_NAME" | awk '{print $1}')"
fi

{
  echo "workflow_sha=$EXPECTED_SHA"
  echo "actual_sha=$CURRENT_SHA"
  echo "ref_type=${REF_TYPE:-unknown}"
  echo "ref_name=${REF_NAME:-unknown}"
  echo "remote_sha=${REMOTE_SHA:-unknown}"
} | tee "$DIAGNOSTICS_DIR/ref-gate.txt"

echo "=== Ref gate ==="
cat "$DIAGNOSTICS_DIR/ref-gate.txt"

if [[ "$CURRENT_SHA" != "$EXPECTED_SHA" ]]; then
  echo "Ref mismatch: checkout HEAD does not match workflow sha" >&2
  exit 1
fi

if [[ "$REF_TYPE" == "branch" && -n "$REMOTE_SHA" && "$REMOTE_SHA" != "$EXPECTED_SHA" ]]; then
  echo "Ref mismatch: workflow sha is not current remote branch head" >&2
  exit 1
fi

