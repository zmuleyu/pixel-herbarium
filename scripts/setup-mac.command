#!/bin/bash
# 花図鉑截图生成器 — 一键安装脚本
# =============================================
# 使用方法：把此文件拖进"终端"窗口，按回车
# =============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

PROJ_DIR="$HOME/pixel-herbarium"

# 错误捕获：出错时打印中文提示
trap 'echo ""; echo -e "${RED}❌ 出错了！（第 $LINENO 行）${NC}"; echo "请截图此窗口发给我，我来帮你排查。"; echo ""; read -p "按 Enter 关闭..." _; exit 1' ERR

clear
echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD}   花図鉑 App Store 截图生成器${NC}"
echo -e "${BOLD}   Pixel Herbarium Screenshot Setup${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""

# ============================================================
# STEP 0: 检查 Xcode
# ============================================================
echo -e "${BLUE}【步骤 0/6】检查 Xcode...${NC}"

if ! xcode-select -p &>/dev/null || [ ! -d "/Applications/Xcode.app" ]; then
  echo ""
  echo -e "${YELLOW}⚠️  未找到 Xcode，请先安装：${NC}"
  echo ""
  echo "  1. 打开 App Store（Dock 栏蓝色 A 图标）"
  echo "  2. 右上角搜索框输入：Xcode"
  echo "  3. 点击「获取」→「安装」（约 30GB，可能需要 30-60 分钟）"
  echo "  4. 安装完成后，回到这个窗口"
  echo ""
  read -p "Xcode 安装完成后按 Enter 继续..." _
  echo ""
fi

echo -e "  接受 Xcode 许可协议..."
sudo xcodebuild -license accept 2>/dev/null || true
XCODE_VER=$(xcodebuild -version 2>/dev/null | head -1 || echo "已安装")
echo -e "  ${GREEN}✓ ${XCODE_VER}${NC}"

# ============================================================
# STEP 1: Homebrew
# ============================================================
echo ""
echo -e "${BLUE}【步骤 1/6】安装 Homebrew（包管理器）...${NC}"

if ! command -v brew &>/dev/null; then
  echo "  即将安装 Homebrew，需要输入 Mac 登录密码。"
  echo -e "  ${YELLOW}输入密码时屏幕不显示字符，这是正常现象，输完直接回车。${NC}"
  echo ""
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# 适配 Apple Silicon（M1/M2/M3）和 Intel Mac
if [ -f /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
  export PATH="/opt/homebrew/bin:$PATH"
elif [ -f /usr/local/bin/brew ]; then
  eval "$(/usr/local/bin/brew shellenv)"
  export PATH="/usr/local/bin:$PATH"
fi

BREW_VER=$(brew --version 2>/dev/null | head -1 || echo "已安装")
echo -e "  ${GREEN}✓ ${BREW_VER}${NC}"

# ============================================================
# STEP 2: 开发工具
# ============================================================
echo ""
echo -e "${BLUE}【步骤 2/6】安装开发工具（git / node / gh / cocoapods）...${NC}"
echo "  已安装的工具会自动跳过，约 1-3 分钟..."
echo ""

brew install git node gh cocoapods 2>/dev/null || brew upgrade git node gh cocoapods 2>/dev/null || true

echo -e "  ${GREEN}✓ Node $(node --version 2>/dev/null || echo '已安装')${NC}"
echo -e "  ${GREEN}✓ CocoaPods $(pod --version 2>/dev/null || echo '已安装')${NC}"
echo -e "  ${GREEN}✓ GitHub CLI $(gh --version 2>/dev/null | head -1 || echo '已安装')${NC}"

# ============================================================
# STEP 3: GitHub 登录
# ============================================================
echo ""
echo -e "${BLUE}【步骤 3/6】GitHub 账号授权...${NC}"

if gh auth status &>/dev/null; then
  GH_USER=$(gh api user --jq '.login' 2>/dev/null || echo "已登录")
  echo -e "  ${GREEN}✓ 已登录：${GH_USER}${NC}"
else
  echo "  即将打开浏览器进行 GitHub 授权。"
  echo "  请在浏览器中：登录 GitHub → 点击「Authorize」→ 回到此窗口"
  echo ""
  sleep 2
  gh auth login --web --git-protocol https
  GH_USER=$(gh api user --jq '.login' 2>/dev/null || echo "已授权")
  echo -e "  ${GREEN}✓ 授权成功：${GH_USER}${NC}"
fi

# ============================================================
# STEP 4: 下载项目
# ============================================================
echo ""
echo -e "${BLUE}【步骤 4/6】下载项目代码...${NC}"

if [ -d "$PROJ_DIR/.git" ]; then
  echo "  项目已存在，更新到最新版本..."
  cd "$PROJ_DIR"
  git fetch origin
  git checkout dev
  git pull origin dev
  COMMIT=$(git log --oneline -1)
  echo -e "  ${GREEN}✓ 已更新：${COMMIT}${NC}"
else
  echo "  正在从 GitHub 下载项目（约 1-2 分钟）..."
  gh repo clone zmuleyu/pixel-herbarium "$PROJ_DIR" -- --branch dev
  cd "$PROJ_DIR"
  COMMIT=$(git log --oneline -1)
  echo -e "  ${GREEN}✓ 下载完成：${COMMIT}${NC}"
fi

# ============================================================
# STEP 5: 安装 Node 依赖
# ============================================================
echo ""
echo -e "${BLUE}【步骤 5/6】安装项目依赖（约 2-5 分钟）...${NC}"

cd "$PROJ_DIR"
npm ci 2>&1 | tail -5
echo -e "  ${GREEN}✓ 依赖安装完成${NC}"

# ============================================================
# STEP 6: 生成截图
# ============================================================
echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD}  ✅ 环境准备完毕！开始生成 App Store 截图${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""
echo -e "${YELLOW}  ⏳ 首次运行需要编译 iOS 应用，约 30-40 分钟${NC}"
echo -e "${YELLOW}  请勿关闭此窗口，编译期间 CPU 会满载，属正常现象${NC}"
echo ""
echo "  开始时间：$(date '+%H:%M:%S')"
echo ""

cd "$PROJ_DIR"
EXPO_PUBLIC_SCREENSHOT_MODE=true bash scripts/local-screenshots.sh

# ============================================================
# 完成
# ============================================================
echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${GREEN}${BOLD}  🎉 截图生成完成！${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""
echo -e "  完成时间：$(date '+%H:%M:%S')"
echo ""
echo "  截图文件位置："
echo "  $PROJ_DIR/e2e/current/"
echo ""

# 快速 MD5 验证
if ls "$PROJ_DIR/e2e/current/"*.png &>/dev/null; then
  echo "  MD5 校验（4个值必须各不相同才算成功）："
  md5 "$PROJ_DIR/e2e/current/"*.png 2>/dev/null | awk '{print "  " $0}'
  echo ""

  # 文件大小检查
  ALL_OK=true
  for f in "$PROJ_DIR/e2e/current/"*.png; do
    SIZE=$(stat -f%z "$f" 2>/dev/null || echo 0)
    FNAME=$(basename "$f")
    if [ "$SIZE" -lt 200000 ]; then
      echo -e "  ${RED}⚠️  ${FNAME} 体积过小（${SIZE} bytes），可能是空白截图${NC}"
      ALL_OK=false
    fi
  done

  if $ALL_OK; then
    echo -e "  ${GREEN}✓ 所有截图体积正常${NC}"
  fi
fi

echo ""
echo -e "${BOLD}下一步：将截图发回给我${NC}"
echo ""
echo "  请在此窗口复制以下命令，按回车执行："
echo ""
echo -e "${YELLOW}  cd ~/pixel-herbarium && git add e2e/current/*.png && git commit -m 'chore: add App Store screenshots [local-sim]' && git push origin dev${NC}"
echo ""
echo "  执行成功后，告诉我 'push 完成' 即可。"
echo ""
read -p "按 Enter 关闭此窗口..." _
