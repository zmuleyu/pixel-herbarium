#!/bin/bash
set -euo pipefail

MODE="${1:---all}"
MARKER_PREFIX="// PH Xcode 16 compatibility patch"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "python3 or python is required" >&2
  exit 1
fi

run_patch() {
  local target_file="$1"
  local patch_name="$2"
  local patch_kind="$3"
  local search_text="${4:-}"
  local replace_text="${5:-}"
  local search_regex="${6:-}"
  local replace_regex="${7:-}"

  if [[ ! -f "$target_file" ]]; then
    echo "Missing patch target: $target_file" >&2
    exit 1
  fi

  PATCH_FILE="$target_file" \
  PATCH_NAME="$patch_name" \
  PATCH_KIND="$patch_kind" \
  PATCH_SEARCH_TEXT="$search_text" \
  PATCH_REPLACE_TEXT="$replace_text" \
  PATCH_SEARCH_REGEX="$search_regex" \
  PATCH_REPLACE_REGEX="$replace_regex" \
  PATCH_MARKER_PREFIX="$MARKER_PREFIX" \
  "$PYTHON_BIN" - <<'PY'
from pathlib import Path
import os
import re
import sys

path = Path(os.environ["PATCH_FILE"])
patch_name = os.environ["PATCH_NAME"]
patch_kind = os.environ["PATCH_KIND"]
search_text = os.environ.get("PATCH_SEARCH_TEXT", "")
replace_text = os.environ.get("PATCH_REPLACE_TEXT", "")
search_regex = os.environ.get("PATCH_SEARCH_REGEX", "")
replace_regex = os.environ.get("PATCH_REPLACE_REGEX", "")
marker = f'{os.environ["PATCH_MARKER_PREFIX"]}: {patch_name}'

text = path.read_text(encoding="utf-8")
if marker in text:
    sys.exit(0)

if patch_kind == "replace":
    if search_text not in text:
        print(f"Patch '{patch_name}' did not match expected text in {path}", file=sys.stderr)
        sys.exit(1)
    text = text.replace(search_text, replace_text, 1)
elif patch_kind == "regex":
    updated, count = re.subn(search_regex, replace_regex, text, count=1, flags=re.S)
    if count != 1:
        print(f"Patch '{patch_name}' did not match expected pattern in {path}", file=sys.stderr)
        sys.exit(1)
    text = updated
else:
    print(f"Unsupported patch kind: {patch_kind}", file=sys.stderr)
    sys.exit(1)

path.write_text(text, encoding="utf-8")
PY
}

if [[ "$MODE" == "--pre-pod" || "$MODE" == "--all" ]]; then
  echo "=== Patching expo-modules-core for Xcode 16.x ==="

  run_patch \
    "node_modules/expo-modules-core/ExpoModulesCore.podspec" \
    "expo-modules-core swift 5.9" \
    "replace" \
    "  s.swift_version  = '6.0'" \
    "  s.swift_version  = '5.9'\n  // PH Xcode 16 compatibility patch: expo-modules-core swift 5.9"

  run_patch \
    "node_modules/expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIHostingView.swift" \
    "expo-modules-core hosting @MainActor" \
    "replace" \
    ", @MainActor AnyExpoSwiftUIHostingView" \
    ", AnyExpoSwiftUIHostingView /* PH Xcode 16 compatibility patch: expo-modules-core hosting @MainActor */"

  run_patch \
    "node_modules/expo-modules-core/ios/Core/Views/SwiftUI/SwiftUIVirtualView.swift" \
    "expo-modules-core virtual wrapper @MainActor" \
    "replace" \
    ": @MainActor ExpoSwiftUI.ViewWrapper" \
    ": ExpoSwiftUI.ViewWrapper /* PH Xcode 16 compatibility patch: expo-modules-core virtual wrapper @MainActor */"

  run_patch \
    "node_modules/expo-modules-core/ios/Core/Views/ViewDefinition.swift" \
    "expo-modules-core UIView AnyArgument @MainActor" \
    "replace" \
    "extension UIView: @MainActor AnyArgument {" \
    "extension UIView: AnyArgument { // PH Xcode 16 compatibility patch: expo-modules-core UIView AnyArgument @MainActor"

  echo "=== Patching expo-router for Xcode 16.x ==="

  run_patch \
    "node_modules/expo-router/ios/Toolbar/RouterToolbarHostView.swift" \
    "expo-router toolbar background" \
    "regex" \
    "" \
    "" \
    "\\s*if #available\\(iOS 26\\.0, \\*\\) \\{\\s*if let hidesSharedBackground = menu\\.hidesSharedBackground \\{\\s*item\\.hidesSharedBackground = hidesSharedBackground\\s*\\}\\s*if let sharesBackground = menu\\.sharesBackground \\{\\s*item\\.sharesBackground = sharesBackground\\s*\\}\\s*\\}\\s*" \
    "\n            // PH Xcode 16 compatibility patch: disable expo-router toolbar background APIs.\n"

  run_patch \
    "node_modules/expo-router/ios/Toolbar/RouterToolbarItemView.swift" \
    "expo-router toolbar search button" \
    "regex" \
    "" \
    "" \
    "\\s*item = controller\\.navigationItem\\.searchBarPlacementBarButtonItem\\s*" \
    "\n      logger?.warn(\n        \"[expo-router] Toolbar search bar is unavailable on the current Xcode SDK.\"\n      )\n      currentBarButtonItem = nil\n      // PH Xcode 16 compatibility patch: disable expo-router toolbar search button.\n      return\n"

  run_patch \
    "node_modules/expo-router/ios/Toolbar/RouterToolbarItemView.swift" \
    "expo-router toolbar background item" \
    "regex" \
    "" \
    "" \
    "\\s*if #available\\(iOS 26\\.0, \\*\\) \\{\\s*item\\.hidesSharedBackground = hidesSharedBackground\\s*item\\.sharesBackground = sharesBackground\\s*\\}\\s*" \
    "\n    // PH Xcode 16 compatibility patch: disable expo-router toolbar item background APIs.\n"

  run_patch \
    "node_modules/expo-router/ios/Toolbar/RouterToolbarItemView.swift" \
    "expo-router toolbar badge" \
    "regex" \
    "" \
    "" \
    "\\s*if #available\\(iOS 26\\.0, \\*\\) \\{\\s*if let badgeConfig = badgeConfiguration \\{.*?item\\.badge = badge\\s*\\} else \\{\\s*item\\.badge = nil\\s*\\}\\s*\\}\\s*" \
    "\n    // PH Xcode 16 compatibility patch: disable expo-router toolbar badge APIs.\n"

  run_patch \
    "node_modules/expo-router/ios/Toolbar/RouterToolbarModule.swift" \
    "expo-router prominent fallback" \
    "regex" \
    "" \
    "" \
    "    case \\.prominent:\\s*if #available\\(iOS 26\\.0, \\*\\) \\{\\s*return \\.prominent\\s*\\} else \\{\\s*return \\.done\\s*\\}\\s*" \
    "    case .prominent:\n      // PH Xcode 16 compatibility patch: fallback expo-router prominent to done.\n      return .done\n"

  echo "=== Patching expo-notifications for Xcode 16.x ==="

  run_patch \
    "node_modules/expo-notifications/ios/ExpoNotifications/Notifications/DateComponentsSerializer.swift" \
    "expo-notifications repeated day" \
    "regex" \
    "" \
    "" \
    "\\s*if #available\\(iOS 26\\.0, \\*\\) \\{\\s*serializedComponents\\[\"isRepeatedDay\"\\] = dateComponents\\.isRepeatedDay \\?\\? false\\s*\\}\\s*" \
    "\n    // PH Xcode 16 compatibility patch: disable expo-notifications repeated day API.\n\n"

  echo "=== Patching expo-image-picker for Xcode 16.x ==="

  run_patch \
    "node_modules/expo-image-picker/ios/MediaHandler.swift" \
    "expo-image-picker asset mime type" \
    "regex" \
    "" \
    "" \
    "  private func getMimeType\\(from asset: PHAsset\\?, fileExtension: String\\) -> String\\? \\{.*?return utType\\?\\.preferredMIMEType\\s*\\}" \
    "  private func getMimeType(from asset: PHAsset?, fileExtension: String) -> String? {\n    // PH Xcode 16 compatibility patch: fallback expo-image-picker asset mime type inference.\n    let utType = UTType(filenameExtension: fileExtension)\n    return utType?.preferredMIMEType\n  }"

  run_patch \
    "node_modules/expo-image-picker/ios/MediaHandler.swift" \
    "expo-image-picker resource mime type" \
    "regex" \
    "" \
    "" \
    "  private func getMimeType\\(from resource: PHAssetResource, fileExtension: String\\) -> String\\? \\{.*?return utType\\?\\.preferredMIMEType\\s*\\}" \
    "  private func getMimeType(from resource: PHAssetResource, fileExtension: String) -> String? {\n    // PH Xcode 16 compatibility patch: fallback expo-image-picker resource mime type inference.\n    let utType = UTType(resource.uniformTypeIdentifier) ?? UTType(filenameExtension: fileExtension)\n    return utType?.preferredMIMEType\n  }"

  echo "=== Patching expo-image for Xcode 16.x ==="

  run_patch \
    "node_modules/expo-image/ios/ImageModule.swift" \
    "expo-image start animating main thread" \
    "regex" \
    "" \
    "" \
    "      AsyncFunction\\(\"startAnimating\"\\) \\{ \\(view: ImageView\\) in.*?\\n      \\}\\s*" \
    "      AsyncFunction(\"startAnimating\") { (view: ImageView) in\n        DispatchQueue.main.async {\n          // PH Xcode 16 compatibility patch: force expo-image startAnimating onto main thread.\n          if view.isSFSymbolSource {\n            view.startSymbolAnimation()\n          } else {\n            view.sdImageView.startAnimating()\n          }\n        }\n      }\n"

  run_patch \
    "node_modules/expo-image/ios/ImageModule.swift" \
    "expo-image stop animating main thread" \
    "regex" \
    "" \
    "" \
    "      AsyncFunction\\(\"stopAnimating\"\\) \\{ \\(view: ImageView\\) in.*?\\n      \\}\\s*" \
    "      AsyncFunction(\"stopAnimating\") { (view: ImageView) in\n        DispatchQueue.main.async {\n          // PH Xcode 16 compatibility patch: force expo-image stopAnimating onto main thread.\n          if view.isSFSymbolSource {\n            view.stopSymbolAnimation()\n          } else {\n            view.sdImageView.stopAnimating()\n          }\n        }\n      }\n"

  run_patch \
    "node_modules/expo-image/ios/ImageModule.swift" \
    "expo-image lock resource main thread" \
    "regex" \
    "" \
    "" \
    "      AsyncFunction\\(\"lockResourceAsync\"\\) \\{ \\(view: ImageView\\) in.*?\\n      \\}\\s*" \
    "      AsyncFunction(\"lockResourceAsync\") { (view: ImageView) in\n        DispatchQueue.main.async {\n          // PH Xcode 16 compatibility patch: mutate expo-image lockResource on main thread.\n          view.lockResource = true\n        }\n      }\n"

  run_patch \
    "node_modules/expo-image/ios/ImageModule.swift" \
    "expo-image unlock resource main thread" \
    "regex" \
    "" \
    "" \
    "      AsyncFunction\\(\"unlockResourceAsync\"\\) \\{ \\(view: ImageView\\) in.*?\\n      \\}\\s*" \
    "      AsyncFunction(\"unlockResourceAsync\") { (view: ImageView) in\n        DispatchQueue.main.async {\n          // PH Xcode 16 compatibility patch: mutate expo-image lockResource on main thread.\n          view.lockResource = false\n        }\n      }\n"

  run_patch \
    "node_modules/expo-image/ios/ImageModule.swift" \
    "expo-image reload main thread" \
    "regex" \
    "" \
    "" \
    "      AsyncFunction\\(\"reloadAsync\"\\) \\{ \\(view: ImageView\\) in.*?\\n      \\}\\s*" \
    "      AsyncFunction(\"reloadAsync\") { (view: ImageView) in\n        DispatchQueue.main.async {\n          // PH Xcode 16 compatibility patch: force expo-image reloadAsync onto main thread.\n          view.reload(force: true)\n        }\n      }\n"

  run_patch \
    "node_modules/expo-image/ios/ImageModule.swift" \
    "expo-image view did update props main thread" \
    "regex" \
    "" \
    "" \
    "      OnViewDidUpdateProps \\{ view in\\s*view\\.reload\\(\\)\\s*\\}\\s*" \
    "      OnViewDidUpdateProps { view in\n        DispatchQueue.main.async {\n          // PH Xcode 16 compatibility patch: force expo-image prop reload onto main thread.\n          view.reload()\n        }\n      }\n"

  run_patch \
    "node_modules/expo-image/ios/ImageView.swift" \
    "expo-image deinit cancel pending operation" \
    "regex" \
    "" \
    "" \
    "  deinit \\{\\s*// Cancel pending requests when the view is deallocated\\.\\s*cancelPendingOperation\\(\\)\\s*\\}\\s*" \
    "  deinit {\n    // PH Xcode 16 compatibility patch: cancel expo-image pending operation without actor-isolated helper.\n    pendingOperation?.cancel()\n    pendingOperation = nil\n  }\n"

  run_patch \
    "node_modules/expo-image/ios/ImageView.swift" \
    "expo-image draw symbol effects" \
    "regex" \
    "" \
    "" \
    "  @available\\(iOS 26\\.0, tvOS 26\\.0, \\*\\)\\s*private func applySymbolEffectiOS26\\(effect: SFSymbolEffectType, scope: SFSymbolEffectScope\\?, options: SymbolEffectOptions\\) \\{.*?\\n  \\}\\s*" \
    "  @available(iOS 26.0, tvOS 26.0, *)\n  private func applySymbolEffectiOS26(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {\n    // PH Xcode 16 compatibility patch: disable expo-image iOS 26 draw symbol effects.\n  }\n"

  run_patch \
    "node_modules/expo-image/ios/ImageView.swift" \
    "expo-image analyze image main actor" \
    "regex" \
    "" \
    "" \
    "    Task \\{\\s*guard let imageAnalyzer = Self\\.imageAnalyzer, let imageAnalysisInteraction = findImageAnalysisInteraction\\(\\) else \\{\\s*return\\s*\\}\\s*let configuration = ImageAnalyzer\\.Configuration\\(\\[\\.text, \\.machineReadableCode\\]\\)\\s*do \\{.*?\\s*\\} catch \\{\\s*log\\.error\\(error\\)\\s*\\}\\s*\\}\\s*" \
    "    Task { @MainActor in\n      // PH Xcode 16 compatibility patch: expo-image analyze image main actor\n      guard let imageAnalyzer = Self.imageAnalyzer, let imageAnalysisInteraction = findImageAnalysisInteraction() else {\n        return\n      }\n      let configuration = ImageAnalyzer.Configuration([.text, .machineReadableCode])\n\n      do {\n        let imageAnalysis = try await imageAnalyzer.analyze(image, configuration: configuration)\n\n        if image == sdImageView.image {\n          imageAnalysisInteraction.analysis = imageAnalysis\n          imageAnalysisInteraction.preferredInteractionTypes = .automatic\n        }\n      } catch {\n        log.error(error)\n      }\n    }\n"

  echo "Pre-pod patches applied"
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
