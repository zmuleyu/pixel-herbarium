#!/bin/bash
set -euo pipefail

APPLE_TEAM_ID="${APPLE_TEAM_ID:-68JA8V8NC2}"
BUNDLE_ID="${BUNDLE_ID:-com.pixelherbarium.app}"
IOS_WORKSPACE="${IOS_WORKSPACE:-app.xcworkspace}"
IOS_SCHEME="${IOS_SCHEME:-app}"
IOS_CONFIGURATION="${IOS_CONFIGURATION:-Release}"
CODE_SIGN_STYLE="${CODE_SIGN_STYLE:-Manual}"
CODE_SIGN_IDENTITY="${CODE_SIGN_IDENTITY:-Apple Distribution}"
BUILD_OUTPUT_DIR="${BUILD_OUTPUT_DIR:-$PWD/build}"
EXPORT_OPTIONS_TEMPLATE_DIR="${EXPORT_OPTIONS_TEMPLATE_DIR:-$PWD/config/ios}"
ASC_APP_ID="${ASC_APP_ID:-6760695082}"

export APPLE_TEAM_ID
export BUNDLE_ID
export IOS_WORKSPACE
export IOS_SCHEME
export IOS_CONFIGURATION
export CODE_SIGN_STYLE
export CODE_SIGN_IDENTITY
export BUILD_OUTPUT_DIR
export EXPORT_OPTIONS_TEMPLATE_DIR
export ASC_APP_ID

export_options_template_path() {
  local export_method="$1"
  case "$export_method" in
    ad-hoc)
      printf '%s/export-options.ad-hoc.plist.template\n' "$EXPORT_OPTIONS_TEMPLATE_DIR"
      ;;
    app-store)
      printf '%s/export-options.app-store.plist.template\n' "$EXPORT_OPTIONS_TEMPLATE_DIR"
      ;;
    *)
      echo "Unsupported export method: $export_method" >&2
      return 1
      ;;
  esac
}

render_export_options() {
  local export_method="$1"
  local output_path="$2"
  local template_path
  template_path="$(export_options_template_path "$export_method")"

  if [[ ! -f "$template_path" ]]; then
    echo "Missing export options template: $template_path" >&2
    return 1
  fi

  sed \
    -e "s|__TEAM_ID__|$APPLE_TEAM_ID|g" \
    -e "s|__BUNDLE_ID__|$BUNDLE_ID|g" \
    -e "s|__PROFILE_NAME__|$IOS_PROFILE_NAME|g" \
    -e "s|__CODE_SIGN_IDENTITY__|$CODE_SIGN_IDENTITY|g" \
    "$template_path" > "$output_path"
}
