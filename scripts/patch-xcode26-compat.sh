#!/bin/bash
# patch-xcode26-compat.sh
# Patches Expo SDK 55 native modules for Xcode 26 compatibility
# Usage:
#   bash scripts/patch-xcode26-compat.sh --pre-pod    # Before pod install
#   bash scripts/patch-xcode26-compat.sh --post-pod   # After pod install
#   bash scripts/patch-xcode26-compat.sh              # Both phases
set -e

MODE="${1:---all}"

if [[ "$MODE" == "--pre-pod" || "$MODE" == "--all" ]]; then
  echo "=== Patching expo-modules-core (Swift 6.0 → 5.9) ==="

  PODSPEC="node_modules/expo-modules-core/ExpoModulesCore.podspec"
  if [ -f "$PODSPEC" ]; then
    sed -i '' "s/s\.swift_version  = '6\.0'/s.swift_version  = '5.9'/" "$PODSPEC" 2>/dev/null || true
    grep "swift_version" "$PODSPEC" || true
  fi

  HOSTING="node_modules/expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIHostingView.swift"
  VIRTUAL="node_modules/expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIVirtualView.swift"
  VIEWDEF="node_modules/expo-modules-core/ios/Core/Views/ViewDefinition.swift"

  for f in "$HOSTING" "$VIRTUAL" "$VIEWDEF"; do
    [ -f "$f" ] || continue
    sed -i '' 's/, @MainActor AnyExpoSwiftUIHostingView/, AnyExpoSwiftUIHostingView/' "$f" 2>/dev/null || true
    sed -i '' 's/: @MainActor ExpoSwiftUI\.ViewWrapper/: ExpoSwiftUI.ViewWrapper/' "$f" 2>/dev/null || true
    sed -i '' 's/extension UIView: @MainActor AnyArgument {/extension UIView: AnyArgument {/' "$f" 2>/dev/null || true
  done

  echo "✓ Pre-pod patches applied"
fi

if [[ "$MODE" == "--post-pod" || "$MODE" == "--all" ]]; then
  echo "=== Patching folly headers (disable coroutines) ==="

  find ios/Pods -name '*.h' -path '*/folly/*' -type l 2>/dev/null | while read f; do
    cp -L "$f" "$f.tmp" && mv "$f.tmp" "$f"
  done

  PATCHED=0
  for f in $(find ios/Pods -name '*.h' -path '*/folly/*' -type f 2>/dev/null); do
    if grep -q '#if FOLLY_HAS_COROUTINES' "$f" 2>/dev/null; then
      sed -i '' 's/#if FOLLY_HAS_COROUTINES/#if 0 \/* FOLLY_HAS_COROUTINES disabled *\//' "$f" 2>/dev/null || true
      PATCHED=$((PATCHED + 1))
    fi
  done

  echo "✓ Folly files patched: $PATCHED"
fi
