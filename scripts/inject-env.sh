#!/bin/bash
# inject-env.sh — Write .env.local for GHA builds
# Usage: bash scripts/inject-env.sh [preview|production|development]
set -euo pipefail

VARIANT="${1:-preview}"

cat > .env.local << EOF
EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL:-https://uwdgnueaycatmkzkbxwo.supabase.co}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${EXPO_PUBLIC_SUPABASE_ANON_KEY}
APP_VARIANT=${VARIANT}
NO_PROXY=localhost,127.0.0.1,::1,0.0.0.0
EOF

echo "✓ .env.local written (variant: $VARIANT)"
