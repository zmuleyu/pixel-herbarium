#!/bin/bash
set -euo pipefail

MODE="${1:---all}"

if [[ "$MODE" == "--pre-pod" || "$MODE" == "--all" ]]; then
  echo "=== patch-package handles Expo dependency compatibility patches ==="
fi

if [[ "$MODE" == "--post-pod" || "$MODE" == "--all" ]]; then
  echo "=== Patching folly headers (disable coroutines) ==="

  find ios/Pods -name '*.h' -path '*/folly/*' -type l 2>/dev/null | while read -r f; do
    cp -L "$f" "$f.tmp" && mv "$f.tmp" "$f"
  done

  PATCHED=0
  while IFS= read -r f; do
    if grep -q '#if FOLLY_HAS_COROUTINES' "$f" 2>/dev/null; then
      sed -i '' 's/#if FOLLY_HAS_COROUTINES/#if 0 \/* PH Xcode 16 compatibility patch: disable folly coroutines *\//' "$f" 2>/dev/null || true
      PATCHED=$((PATCHED + 1))
    fi
  done < <(find ios/Pods -name '*.h' -path '*/folly/*' -type f 2>/dev/null)

  echo "Folly files patched: $PATCHED"
fi
