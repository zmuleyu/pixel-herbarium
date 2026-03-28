#!/bin/bash
# patch-xcode26-compat.sh
# Patches Expo SDK 55 native modules for Xcode 16/26 compatibility
# Usage:
#   bash scripts/patch-xcode26-compat.sh --pre-pod
#   bash scripts/patch-xcode26-compat.sh --post-pod
#   bash scripts/patch-xcode26-compat.sh
set -e

MODE="${1:---all}"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "python3 or python is required" >&2
  exit 1
fi

if [[ "$MODE" == "--pre-pod" || "$MODE" == "--all" ]]; then
  echo "=== Patching expo-modules-core (Swift 6.0 -> 5.9) ==="

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

  echo "=== Patching expo-router toolbar APIs for Xcode 16.x ==="

  ROUTER_HOST="node_modules/expo-router/ios/Toolbar/RouterToolbarHostView.swift"
  ROUTER_ITEM="node_modules/expo-router/ios/Toolbar/RouterToolbarItemView.swift"
  ROUTER_MODULE="node_modules/expo-router/ios/Toolbar/RouterToolbarModule.swift"

  if [ -f "$ROUTER_HOST" ]; then
    "$PYTHON_BIN" - <<'PY'
from pathlib import Path
path = Path("node_modules/expo-router/ios/Toolbar/RouterToolbarHostView.swift")
text = path.read_text(encoding="utf-8")
text = text.replace(
"""            if #available(iOS 26.0, *) {
              if let hidesSharedBackground = menu.hidesSharedBackground {
                item.hidesSharedBackground = hidesSharedBackground
              }
              if let sharesBackground = menu.sharesBackground {
                item.sharesBackground = sharesBackground
              }
            }
""",
"""            // Xcode 16.x SDK does not expose iOS 26 toolbar background APIs.
""")
path.write_text(text, encoding="utf-8")
PY
  fi

  if [ -f "$ROUTER_ITEM" ]; then
    "$PYTHON_BIN" - <<'PY'
from pathlib import Path
path = Path("node_modules/expo-router/ios/Toolbar/RouterToolbarItemView.swift")
text = path.read_text(encoding="utf-8")
text = text.replace(
"      item = controller.navigationItem.searchBarPlacementBarButtonItem\n",
"""      logger?.warn(
        "[expo-router] Toolbar search bar is unavailable on the current Xcode SDK."
      )
      currentBarButtonItem = nil
      return
""")
text = text.replace(
"""    if #available(iOS 26.0, *) {
      item.hidesSharedBackground = hidesSharedBackground
      item.sharesBackground = sharesBackground
    }
""",
"""    // Xcode 16.x SDK does not expose iOS 26 toolbar background APIs.
""")
text = text.replace(
"""    if #available(iOS 26.0, *) {
      if let badgeConfig = badgeConfiguration {
        var badge = UIBarButtonItem.Badge.indicator()
        if let value = badgeConfig.value {
          badge = .string(value)
        }
        if let backgroundColor = badgeConfig.backgroundColor {
          badge.backgroundColor = backgroundColor
        }
        if let foregroundColor = badgeConfig.color {
          badge.foregroundColor = foregroundColor
        }
        if badgeConfig.fontFamily != nil || badgeConfig.fontSize != nil
          || badgeConfig.fontWeight != nil {
          let font = RouterFontUtils.convertTitleStyleToFont(
            TitleStyle(
              fontFamily: badgeConfig.fontFamily,
              fontSize: badgeConfig.fontSize,
              fontWeight: badgeConfig.fontWeight
            ))
          badge.font = font
        }
        item.badge = badge
      } else {
        item.badge = nil
      }
    }
""",
"""    // Xcode 16.x SDK does not expose iOS 26 toolbar badge APIs.
""")
path.write_text(text, encoding="utf-8")
PY
  fi

  if [ -f "$ROUTER_MODULE" ]; then
    "$PYTHON_BIN" - <<'PY'
from pathlib import Path
path = Path("node_modules/expo-router/ios/Toolbar/RouterToolbarModule.swift")
text = path.read_text(encoding="utf-8")
text = text.replace(
"""    case .prominent:
      if #available(iOS 26.0, *) {
        return .prominent
      } else {
        return .done
      }
""",
"""    case .prominent:
      return .done
""")
path.write_text(text, encoding="utf-8")
PY
  fi

  echo "=== Patching expo-notifications DateComponentsSerializer for Xcode 16.x ==="

  NOTIFICATIONS_DATE_COMPONENTS="node_modules/expo-notifications/ios/ExpoNotifications/Notifications/DateComponentsSerializer.swift"
  if [ -f "$NOTIFICATIONS_DATE_COMPONENTS" ]; then
    "$PYTHON_BIN" - <<'PY'
from pathlib import Path
import re
path = Path("node_modules/expo-notifications/ios/ExpoNotifications/Notifications/DateComponentsSerializer.swift")
text = path.read_text(encoding="utf-8")
text = re.sub(
    r'\s*if #available\(iOS 26\.0, \*\) \{\s*serializedComponents\["isRepeatedDay"\] = dateComponents\.isRepeatedDay \?\? false\s*\}\s*',
    '\n    // Xcode 16.x SDK does not expose iOS 26 DateComponents.isRepeatedDay.\n\n',
    text,
    count=1,
)
path.write_text(text, encoding="utf-8")
PY
  fi

  echo "=== Patching expo-image-picker contentType APIs for Xcode 16.x ==="

  IMAGE_PICKER_MEDIA_HANDLER="node_modules/expo-image-picker/ios/MediaHandler.swift"
  if [ -f "$IMAGE_PICKER_MEDIA_HANDLER" ]; then
    "$PYTHON_BIN" - <<'PY'
from pathlib import Path
import re
path = Path("node_modules/expo-image-picker/ios/MediaHandler.swift")
text = path.read_text(encoding="utf-8")
text = re.sub(
    r'  private func getMimeType\(from asset: PHAsset\?, fileExtension: String\) -> String\? \{\s+let utType: UTType\? = if #available\(iOS 26\.0, \*\) \{\s+asset\?\.contentType \?\? UTType\(filenameExtension: fileExtension\)\s+\} else \{\s+UTType\(filenameExtension: fileExtension\)\s+\}\s+return utType\?\.preferredMIMEType\s+\}',
    """  private func getMimeType(from asset: PHAsset?, fileExtension: String) -> String? {
    let utType = UTType(filenameExtension: fileExtension)
    return utType?.preferredMIMEType
  }""",
    text,
    count=1,
)
text = re.sub(
    r'  private func getMimeType\(from resource: PHAssetResource, fileExtension: String\) -> String\? \{\s+let utType: UTType\? = if #available\(iOS 26\.0, \*\) \{\s+resource\.contentType\s+\} else \{\s+UTType\(resource\.uniformTypeIdentifier\) \?\? UTType\(filenameExtension: fileExtension\)\s+\}\s+return utType\?\.preferredMIMEType\s+\}',
    """  private func getMimeType(from resource: PHAssetResource, fileExtension: String) -> String? {
    let utType = UTType(resource.uniformTypeIdentifier) ?? UTType(filenameExtension: fileExtension)
    return utType?.preferredMIMEType
  }""",
    text,
    count=1,
)
path.write_text(text, encoding="utf-8")
PY
  fi

  echo "=== Patching expo-image actor isolation for Xcode 16.x ==="

  EXPO_IMAGE_MODULE="node_modules/expo-image/ios/ImageModule.swift"
  if [ -f "$EXPO_IMAGE_MODULE" ]; then
    "$PYTHON_BIN" - <<'PY'
from pathlib import Path
import re
path = Path("node_modules/expo-image/ios/ImageModule.swift")
text = path.read_text(encoding="utf-8")
text = re.sub(
    r'      AsyncFunction\("startAnimating"\) \{ \(view: ImageView\) in\s+if view\.isSFSymbolSource \{\s+view\.startSymbolAnimation\(\)\s+\} else \{\s+view\.sdImageView\.startAnimating\(\)\s+\}\s+\}',
    """      AsyncFunction("startAnimating") { (view: ImageView) in
        DispatchQueue.main.async {
          if view.isSFSymbolSource {
            view.startSymbolAnimation()
          } else {
            view.sdImageView.startAnimating()
          }
        }
      }""",
    text,
    count=1,
)
text = re.sub(
    r'      AsyncFunction\("stopAnimating"\) \{ \(view: ImageView\) in\s+if view\.isSFSymbolSource \{\s+view\.stopSymbolAnimation\(\)\s+\} else \{\s+view\.sdImageView\.stopAnimating\(\)\s+\}\s+\}',
    """      AsyncFunction("stopAnimating") { (view: ImageView) in
        DispatchQueue.main.async {
          if view.isSFSymbolSource {
            view.stopSymbolAnimation()
          } else {
            view.sdImageView.stopAnimating()
          }
        }
      }""",
    text,
    count=1,
)
text = re.sub(
    r'      AsyncFunction\("lockResourceAsync"\) \{ \(view: ImageView\) in\s+view\.lockResource = true\s+\}',
    """      AsyncFunction("lockResourceAsync") { (view: ImageView) in
        DispatchQueue.main.async {
          view.lockResource = true
        }
      }""",
    text,
    count=1,
)
text = re.sub(
    r'      AsyncFunction\("unlockResourceAsync"\) \{ \(view: ImageView\) in\s+view\.lockResource = false\s+\}',
    """      AsyncFunction("unlockResourceAsync") { (view: ImageView) in
        DispatchQueue.main.async {
          view.lockResource = false
        }
      }""",
    text,
    count=1,
)
text = re.sub(
    r'      AsyncFunction\("reloadAsync"\) \{ \(view: ImageView\) in\s+view\.reload\(force: true\)\s+\}',
    """      AsyncFunction("reloadAsync") { (view: ImageView) in
        DispatchQueue.main.async {
          view.reload(force: true)
        }
      }""",
    text,
    count=1,
)
text = re.sub(
    r'      OnViewDidUpdateProps \{ view in\s+view\.reload\(\)\s+\}',
    """      OnViewDidUpdateProps { view in
        DispatchQueue.main.async {
          view.reload()
        }
      }""",
    text,
    count=1,
)
path.write_text(text, encoding="utf-8")
PY
  fi

  EXPO_IMAGE_VIEW="node_modules/expo-image/ios/ImageView.swift"
  if [ -f "$EXPO_IMAGE_VIEW" ]; then
    "$PYTHON_BIN" - <<'PY'
from pathlib import Path
import re
path = Path("node_modules/expo-image/ios/ImageView.swift")
text = path.read_text(encoding="utf-8")
text = text.replace(
"""  @available(iOS 26.0, tvOS 26.0, *)
  private func applySymbolEffectiOS26(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {
    switch effect {
    case .drawOn:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.drawOn.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.drawOn.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.drawOn, options: options)
      }
    case .drawOff:
      switch scope {
      case .byLayer: sdImageView.addSymbolEffect(.drawOff.byLayer, options: options)
      case .wholeSymbol: sdImageView.addSymbolEffect(.drawOff.wholeSymbol, options: options)
      case .none: sdImageView.addSymbolEffect(.drawOff, options: options)
      }
    default:
      break
    }
  }
""",
"""  @available(iOS 26.0, tvOS 26.0, *)
  private func applySymbolEffectiOS26(effect: SFSymbolEffectType, scope: SFSymbolEffectScope?, options: SymbolEffectOptions) {
    // Xcode 16.x SDK does not expose iOS 26 draw symbol effects.
  }
""")
text = re.sub(
    r'    Task \{\s+guard let imageAnalyzer = Self\.imageAnalyzer, let imageAnalysisInteraction = findImageAnalysisInteraction\(\) else \{\s+return\s+\}\s+let configuration = ImageAnalyzer\.Configuration\(\[\.text, \.machineReadableCode\]\)\s+do \{\s+let imageAnalysis = try await imageAnalyzer\.analyze\(image, configuration: configuration\)\s+\s+// Make sure the image haven\'t changed in the meantime\.\s+if image == sdImageView\.image \{\s+imageAnalysisInteraction\.analysis = imageAnalysis\s+imageAnalysisInteraction\.preferredInteractionTypes = \.automatic\s+\}\s+\} catch \{\s+log\.error\(error\)\s+\}\s+\}',
    """    Task { @MainActor in
      guard let imageAnalyzer = Self.imageAnalyzer, let imageAnalysisInteraction = findImageAnalysisInteraction() else {
        return
      }
      let configuration = ImageAnalyzer.Configuration([.text, .machineReadableCode])

      do {
        let imageAnalysis = try await imageAnalyzer.analyze(image, configuration: configuration)

        if image == sdImageView.image {
          imageAnalysisInteraction.analysis = imageAnalysis
          imageAnalysisInteraction.preferredInteractionTypes = .automatic
        }
      } catch {
        log.error(error)
      }
    }
    }""",
    text,
    count=1,
    flags=re.S,
)
text = re.sub(
    r'  deinit \{\s+// Cancel pending requests when the view is deallocated\.\s+cancelPendingOperation\(\)\s+\}',
    """  deinit {
    pendingOperation?.cancel()
    pendingOperation = nil
  }""",
    text,
    count=1,
)
path.write_text(text, encoding="utf-8")
PY
  fi

  echo "Pre-pod patches applied"
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

  echo "Folly files patched: $PATCHED"
fi
