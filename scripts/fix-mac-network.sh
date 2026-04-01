#!/bin/bash
# fix-mac-network.sh — Mac 网络诊断+修复（一键排查 proxy/git/curl 问题）
# Usage: bash /tmp/fix-network.sh
# 适用于 macOS 12+ 的 Clash/代理环境
set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Mac Network Diagnostic & Fix Tool      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ============================================================
# Phase 1: 诊断（只读，不做任何改动）
# ============================================================
echo "═══ Phase 1: 诊断 ═══"
echo ""

ISSUES=()

# 1a. Git proxy (global)
GIT_PROXY_G=$(git config --global http.proxy 2>/dev/null || true)
if [ -n "$GIT_PROXY_G" ]; then
  echo "  git global proxy:  $GIT_PROXY_G  ← ISSUE"
  ISSUES+=("git-global-proxy")
else
  echo "  git global proxy:  (none)"
fi

# 1b. Git proxy (local) — only if inside a git repo
GIT_PROXY_L=""
if git rev-parse --is-inside-work-tree &>/dev/null; then
  GIT_PROXY_L=$(git config --local http.proxy 2>/dev/null || true)
  if [ -n "$GIT_PROXY_L" ]; then
    echo "  git local proxy:   $GIT_PROXY_L  ← ISSUE"
    ISSUES+=("git-local-proxy")
  else
    echo "  git local proxy:   (none)"
  fi
fi

# 1c. Git proxy (system)
GIT_PROXY_S=$(git config --system http.proxy 2>/dev/null || true)
if [ -n "$GIT_PROXY_S" ]; then
  echo "  git system proxy:  $GIT_PROXY_S  ← ISSUE"
  ISSUES+=("git-system-proxy")
else
  echo "  git system proxy:  (none)"
fi

# 1d. Environment variables
for VAR in http_proxy https_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY all_proxy; do
  VAL="${!VAR:-}"
  if [ -n "$VAL" ]; then
    echo "  ENV $VAR:  $VAL  ← ISSUE"
    ISSUES+=("env-proxy")
  fi
done
if [[ ! " ${ISSUES[*]:-} " =~ "env-proxy" ]]; then
  echo "  ENV proxy vars:    (none)"
fi

# 1e. Shell profile proxy
PROFILE_PROXY=""
for PROFILE in ~/.bash_profile ~/.bashrc ~/.zshrc ~/.profile; do
  if [ -f "$PROFILE" ]; then
    MATCH=$(grep -n 'export.*[Hh][Tt][Tt][Pp].*[Pp][Rr][Oo][Xx][Yy]' "$PROFILE" 2>/dev/null | head -3 || true)
    if [ -n "$MATCH" ]; then
      echo "  shell profile:     $PROFILE has proxy exports  ← WARN"
      echo "                     $MATCH"
      PROFILE_PROXY="$PROFILE"
    fi
  fi
done
if [ -z "$PROFILE_PROXY" ]; then
  echo "  shell profiles:    no proxy exports"
fi

# 1f. macOS system proxy
echo ""
NETWORK_SERVICE="Wi-Fi"
# Try to detect the active network service
ACTIVE_DEV=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}' || true)
if [ -n "$ACTIVE_DEV" ]; then
  SVC=$(networksetup -listallhardwareports 2>/dev/null | grep -B1 "$ACTIVE_DEV" | awk -F': ' '/Hardware Port/{print $2}' || true)
  [ -n "$SVC" ] && NETWORK_SERVICE="$SVC"
fi
echo "  Active network:    $NETWORK_SERVICE"

MAC_HTTP=$(networksetup -getwebproxy "$NETWORK_SERVICE" 2>/dev/null || echo "UNKNOWN")
MAC_HTTPS=$(networksetup -getsecurewebproxy "$NETWORK_SERVICE" 2>/dev/null || echo "UNKNOWN")
MAC_SOCKS=$(networksetup -getsocksfirewallproxy "$NETWORK_SERVICE" 2>/dev/null || echo "UNKNOWN")

MAC_HTTP_ON=$(echo "$MAC_HTTP" | awk '/^Enabled/{print $2}')
MAC_HTTP_HOST=$(echo "$MAC_HTTP" | awk '/^Server/{print $2}')
MAC_HTTP_PORT=$(echo "$MAC_HTTP" | awk '/^Port/{print $2}')

MAC_HTTPS_ON=$(echo "$MAC_HTTPS" | awk '/^Enabled/{print $2}')
MAC_HTTPS_HOST=$(echo "$MAC_HTTPS" | awk '/^Server/{print $2}')
MAC_HTTPS_PORT=$(echo "$MAC_HTTPS" | awk '/^Port/{print $2}')

MAC_SOCKS_ON=$(echo "$MAC_SOCKS" | awk '/^Enabled/{print $2}')

if [ "$MAC_HTTP_ON" = "Yes" ]; then
  echo "  macOS HTTP proxy:  ${MAC_HTTP_HOST}:${MAC_HTTP_PORT}  ← ISSUE"
  ISSUES+=("macos-http-proxy")
else
  echo "  macOS HTTP proxy:  OFF"
fi

if [ "$MAC_HTTPS_ON" = "Yes" ]; then
  echo "  macOS HTTPS proxy: ${MAC_HTTPS_HOST}:${MAC_HTTPS_PORT}  ← ISSUE"
  ISSUES+=("macos-https-proxy")
else
  echo "  macOS HTTPS proxy: OFF"
fi

if [ "$MAC_SOCKS_ON" = "Yes" ]; then
  echo "  macOS SOCKS proxy: ON  ← WARN"
  ISSUES+=("macos-socks-proxy")
else
  echo "  macOS SOCKS proxy: OFF"
fi

# 1g. Clash process
echo ""
CLASH_PID=$(pgrep -fi "clash" 2>/dev/null || true)
if [ -n "$CLASH_PID" ]; then
  echo "  Clash process:     RUNNING (PID: $CLASH_PID)"
else
  echo "  Clash process:     NOT RUNNING  ← ISSUE"
  ISSUES+=("clash-not-running")
fi

# 1h. Test proxy port
if curl -s --connect-timeout 2 -x "http://127.0.0.1:7890" https://github.com -o /dev/null 2>/dev/null; then
  echo "  Port 7890:         ALIVE (proxy responding)"
else
  echo "  Port 7890:         DEAD (connection refused)"
fi

# 1i. SSH key
echo ""
SSH_KEY=$(ls ~/.ssh/id_*.pub 2>/dev/null | head -1 || true)
if [ -n "$SSH_KEY" ]; then
  echo "  SSH key:           $SSH_KEY"
else
  echo "  SSH key:           NONE"
fi

# 1j. Diagnosis summary
echo ""
echo "╔══════════════════════════════════════════╗"
if [ ${#ISSUES[@]} -eq 0 ]; then
  echo "║  DIAGNOSIS: No proxy issues found        ║"
else
  echo "║  DIAGNOSIS: ${#ISSUES[@]} issue(s) found              ║"
  echo "╠══════════════════════════════════════════╣"
  # Determine root cause
  if [[ " ${ISSUES[*]} " =~ "macos-http-proxy" ]] && [[ " ${ISSUES[*]} " =~ "clash-not-running" ]]; then
    echo "║  ROOT CAUSE:                             ║"
    echo "║  macOS system proxy → 127.0.0.1:7890     ║"
    echo "║  Clash NOT running → dead proxy port     ║"
    echo "║  → ALL network traffic fails             ║"
  fi
fi
echo "╚══════════════════════════════════════════╝"

if [ ${#ISSUES[@]} -eq 0 ]; then
  echo ""
  echo "✅ No issues found. Testing connectivity..."
  curl -sI https://github.com --connect-timeout 5 | head -1 || echo "  Connection failed"
  exit 0
fi

# ============================================================
# Phase 2: 修复（按优先级依次尝试）
# ============================================================
echo ""
echo "═══ Phase 2: 修复 ═══"
echo ""

# Helper: test if GitHub is reachable
test_github() {
  curl -sI https://github.com --connect-timeout 5 -o /dev/null 2>/dev/null
}

FIXED=0

# --- Strategy A: Start Clash ---
echo "[Strategy A] 尝试启动 Clash..."
CLASH_APP=$(find /Applications -maxdepth 2 -name "*lash*.app" -type d 2>/dev/null | head -1)
if [ -n "$CLASH_APP" ]; then
  echo "  Found: $CLASH_APP"
  open "$CLASH_APP" 2>/dev/null || true
  echo "  Waiting 5s for Clash to start..."
  sleep 5
  if curl -s --connect-timeout 3 -x "http://127.0.0.1:7890" https://github.com -o /dev/null 2>/dev/null; then
    echo "  ✓ Clash started! Port 7890 alive"
    FIXED=1
  else
    echo "  ✗ Clash started but port 7890 still dead"
  fi
else
  echo "  ✗ No Clash app found in /Applications"
fi

# --- Strategy B: Disable macOS system proxy ---
if [ $FIXED -eq 0 ]; then
  echo ""
  echo "[Strategy B] 关闭 macOS 系统代理..."

  # Save original values for restore command
  echo ""
  echo "  [backup] Original settings saved. Restore later with:"
  echo "    networksetup -setwebproxy \"$NETWORK_SERVICE\" ${MAC_HTTP_HOST:-127.0.0.1} ${MAC_HTTP_PORT:-7890}"
  echo "    networksetup -setsecurewebproxy \"$NETWORK_SERVICE\" ${MAC_HTTPS_HOST:-127.0.0.1} ${MAC_HTTPS_PORT:-7890}"
  echo ""

  networksetup -setwebproxystate "$NETWORK_SERVICE" off 2>/dev/null && \
    echo "  ✓ HTTP proxy: OFF" || echo "  ✗ Failed (may need sudo)"
  networksetup -setsecurewebproxystate "$NETWORK_SERVICE" off 2>/dev/null && \
    echo "  ✓ HTTPS proxy: OFF" || echo "  ✗ Failed (may need sudo)"
  networksetup -setsocksfirewallproxystate "$NETWORK_SERVICE" off 2>/dev/null && \
    echo "  ✓ SOCKS proxy: OFF" || echo "  ✗ Failed (may need sudo)"

  sleep 1
  if test_github; then
    echo "  ✓ GitHub reachable via direct connection!"
    FIXED=1
  else
    echo "  ✗ GitHub still unreachable (may be blocked by ISP)"
  fi
fi

# --- Strategy C: Clear all git proxy + env vars ---
if [ $FIXED -eq 0 ]; then
  echo ""
  echo "[Strategy C] 清除 git 代理配置 + 环境变量..."

  git config --global --unset-all http.proxy 2>/dev/null || true
  git config --global --unset-all https.proxy 2>/dev/null || true
  git config --local --unset-all http.proxy 2>/dev/null || true
  git config --local --unset-all https.proxy 2>/dev/null || true
  unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY all_proxy 2>/dev/null || true
  echo "  ✓ All git proxy configs cleared"
  echo "  ✓ Environment proxy vars cleared"

  if test_github; then
    echo "  ✓ GitHub reachable!"
    FIXED=1
  else
    echo "  ✗ Still unreachable"
  fi
fi

# --- Strategy D: Switch to SSH ---
if [ $FIXED -eq 0 ] && [ -n "$SSH_KEY" ]; then
  echo ""
  echo "[Strategy D] 切换 git remote 为 SSH..."

  # Test SSH connectivity
  if ssh -T -o ConnectTimeout=5 git@github.com 2>&1 | grep -q "successfully authenticated"; then
    CURRENT_URL=$(git remote get-url origin 2>/dev/null || true)
    if [[ "$CURRENT_URL" == https://* ]]; then
      SSH_URL=$(echo "$CURRENT_URL" | sed 's|https://github.com/|git@github.com:|')
      git remote set-url origin "$SSH_URL"
      echo "  ✓ Remote changed: $SSH_URL"
    fi
    if git ls-remote origin dev &>/dev/null; then
      echo "  ✓ SSH connection works!"
      FIXED=1
    else
      echo "  ✗ SSH ls-remote failed"
      # Revert
      [ -n "$CURRENT_URL" ] && git remote set-url origin "$CURRENT_URL"
    fi
  else
    echo "  ✗ SSH to github.com failed (key not authorized?)"
  fi
fi

# --- Strategy E: Force no-proxy via git -c ---
if [ $FIXED -eq 0 ]; then
  echo ""
  echo "[Strategy E] 尝试 git -c 强制绕过代理..."
  if git -c http.proxy="" -c https.proxy="" ls-remote origin dev &>/dev/null; then
    echo "  ✓ git -c http.proxy=\"\" works!"
    echo ""
    echo "  ⚠️  自动修复无法持久化此方法。请手动执行："
    echo "    git -c http.proxy=\"\" -c https.proxy=\"\" pull origin dev"
    FIXED=2  # partial fix
  else
    echo "  ✗ Still fails"
  fi
fi

# ============================================================
# Phase 3: 验证 + 下一步
# ============================================================
echo ""
echo "═══ Phase 3: 验证 ═══"
echo ""

if [ $FIXED -eq 1 ]; then
  echo "Testing git ls-remote..."
  if git ls-remote origin dev 2>/dev/null | head -1; then
    echo "  ✓ Git remote accessible"
    echo ""
    echo "╔══════════════════════════════════════════════════╗"
    echo "║  ✅ Network Fixed! Run these commands:           ║"
    echo "╠══════════════════════════════════════════════════╣"
    echo "║  git pull origin dev                             ║"
    echo "║  EXPO_TOKEN=\"aG_A5qqg...\" \\                     ║"
    echo "║    bash scripts/eas-device-screenshot.sh \\       ║"
    echo "║    --skip-device                                 ║"
    echo "╚══════════════════════════════════════════════════╝"
  else
    echo "  ✗ git ls-remote failed despite earlier success"
  fi
elif [ $FIXED -eq 2 ]; then
  echo "╔══════════════════════════════════════════════════╗"
  echo "║  ⚠️  Partial fix. Manual commands needed:        ║"
  echo "╠══════════════════════════════════════════════════╣"
  echo "║  git -c http.proxy=\"\" -c https.proxy=\"\" \\       ║"
  echo "║    pull origin dev                               ║"
  echo "╚══════════════════════════════════════════════════╝"
else
  echo "╔══════════════════════════════════════════════════╗"
  echo "║  ❌ All strategies failed                        ║"
  echo "╠══════════════════════════════════════════════════╣"
  echo "║  Possible causes:                                ║"
  echo "║  1. GitHub blocked by ISP (need VPN/proxy)       ║"
  echo "║  2. networksetup needs sudo                      ║"
  echo "║  3. No SSH key configured for GitHub             ║"
  echo "╠══════════════════════════════════════════════════╣"
  echo "║  Try manually:                                   ║"
  echo "║  sudo networksetup -setwebproxystate Wi-Fi off   ║"
  echo "║  sudo networksetup -setsecurewebproxystate \\     ║"
  echo "║    Wi-Fi off                                     ║"
  echo "╚══════════════════════════════════════════════════╝"
fi
echo ""
