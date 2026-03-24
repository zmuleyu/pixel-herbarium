#!/bin/bash
# 花図鉑截图生成器 — 一键安装 + 云端截图
# =============================================
# 使用方法：把此文件拖进"终端"窗口，按回车
# =============================================
# 不需要 Xcode 26！截图在 GitHub Actions 云端生成。
# 本机只需：Homebrew + Node + GitHub CLI

set -eo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

PROJ_DIR="$HOME/pixel-herbarium"
REPO="zmuleyu/pixel-herbarium"

trap 'echo ""; echo -e "${RED}❌ 出错了！（第 $LINENO 行）${NC}"; echo "请截图此窗口发给我，我来帮你排查。"; echo ""; read -p "按 Enter 关闭..." _; exit 1' ERR

clear
echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD}   花図鉑 App Store 截图生成器${NC}"
echo -e "${BOLD}   Pixel Herbarium Screenshot Generator${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""
echo -e "${DIM}  截图在 GitHub Actions 云端生成，无需安装 Xcode${NC}"
echo -e "${DIM}  预计总耗时：首次 10 分钟安装 + 15 分钟云端截图${NC}"
echo ""

# ============================================================
# STEP 1: Homebrew
# ============================================================
echo -e "${BLUE}【步骤 1/7】安装 Homebrew（包管理器）...${NC}"

if command -v brew &>/dev/null; then
  BREW_VER=$(brew --version 2>/dev/null | head -1)
  echo -e "  ${GREEN}✓ 已安装：${BREW_VER}${NC}"
else
  echo "  即将安装 Homebrew，可能需要输入 Mac 登录密码。"
  echo -e "  ${YELLOW}输入密码时屏幕不显示字符，这是正常现象，输完直接回车。${NC}"
  echo ""
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# 适配 Apple Silicon（M1/M2/M3/M4）和 Intel Mac
if [ -f /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -f /usr/local/bin/brew ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# ============================================================
# STEP 2: 开发工具
# ============================================================
echo ""
echo -e "${BLUE}【步骤 2/7】安装开发工具（git / node / gh）...${NC}"
echo -e "  ${DIM}已安装的工具会自动跳过${NC}"

for pkg in git node gh; do
  if command -v "$pkg" &>/dev/null; then
    echo -e "  ${GREEN}✓ $pkg 已安装${NC}"
  else
    echo "  安装 $pkg ..."
    brew install "$pkg"
    echo -e "  ${GREEN}✓ $pkg 安装完成${NC}"
  fi
done

NODE_VER=$(node --version 2>/dev/null || echo "?")
GH_VER=$(gh --version 2>/dev/null | head -1 || echo "?")
echo -e "  ${DIM}Node ${NODE_VER} | ${GH_VER}${NC}"

# ============================================================
# STEP 3: GitHub 登录
# ============================================================
echo ""
echo -e "${BLUE}【步骤 3/7】GitHub 账号授权...${NC}"

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
echo -e "${BLUE}【步骤 4/7】下载项目代码...${NC}"

if [ -d "$PROJ_DIR/.git" ]; then
  echo "  项目已存在，更新到最新版本..."
  cd "$PROJ_DIR"
  git fetch origin
  git checkout dev
  git pull origin dev
else
  echo "  正在从 GitHub 下载项目（约 1-2 分钟）..."
  gh repo clone "$REPO" "$PROJ_DIR" -- --branch dev
  cd "$PROJ_DIR"
fi

COMMIT=$(git log --oneline -1)
echo -e "  ${GREEN}✓ ${COMMIT}${NC}"

# ============================================================
# STEP 5: 安装依赖
# ============================================================
echo ""
echo -e "${BLUE}【步骤 5/7】安装项目依赖（约 2-5 分钟）...${NC}"

cd "$PROJ_DIR"
npm ci 2>&1 | tail -3
echo -e "  ${GREEN}✓ 依赖安装完成${NC}"

# ============================================================
# STEP 6: 触发云端截图
# ============================================================
echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD}  ✅ 本机环境就绪！触发云端截图生成${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""
echo -e "  ${CYAN}截图在 GitHub Actions 云端服务器上生成${NC}"
echo -e "  ${CYAN}服务器已预装 Xcode 26，无需本机安装${NC}"
echo ""

# 触发 workflow
echo -e "${BLUE}【步骤 6/7】触发 GitHub Actions 截图工作流...${NC}"

gh workflow run screenshots.yml --ref dev --repo "$REPO"
echo -e "  ${GREEN}✓ 工作流已触发${NC}"

# 等待 run 出现
echo "  等待工作流启动..."
sleep 5

# 获取最新 run ID
RUN_ID=""
for i in 1 2 3 4 5; do
  RUN_ID=$(gh run list --workflow=screenshots.yml --repo "$REPO" --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || true)
  if [ -n "$RUN_ID" ]; then break; fi
  sleep 3
done

if [ -z "$RUN_ID" ]; then
  echo -e "${RED}❌ 无法获取工作流运行 ID${NC}"
  echo "  请手动检查：https://github.com/$REPO/actions"
  read -p "按 Enter 关闭..." _
  exit 1
fi

echo -e "  ${DIM}Run ID: ${RUN_ID}${NC}"
echo ""
echo -e "  ${YELLOW}⏳ 云端编译 + 截图中，大约 15-20 分钟${NC}"
echo -e "  ${YELLOW}可以去喝杯茶，窗口会自动提示完成${NC}"
echo ""

# 实时跟踪进度
gh run watch "$RUN_ID" --repo "$REPO" --exit-status 2>/dev/null
RUN_EXIT=$?

if [ $RUN_EXIT -ne 0 ]; then
  echo ""
  echo -e "${RED}❌ 云端截图失败${NC}"
  echo "  查看日志：gh run view $RUN_ID --repo $REPO --log"
  echo "  或访问：https://github.com/$REPO/actions/runs/$RUN_ID"
  echo ""
  read -p "请截图此窗口发给我。按 Enter 关闭..." _
  exit 1
fi

echo ""
echo -e "  ${GREEN}✓ 云端截图完成！${NC}"

# ============================================================
# STEP 7: 下载 + 验证 + 推送
# ============================================================
echo ""
echo -e "${BLUE}【步骤 7/7】下载截图并推送...${NC}"

cd "$PROJ_DIR"
mkdir -p e2e/current

# 下载 artifact
gh run download "$RUN_ID" --repo "$REPO" --dir e2e/current 2>/dev/null || true

# artifact 可能在子目录中，扁平化到 e2e/current/
find e2e/current -mindepth 2 -name "*.png" -exec mv {} e2e/current/ \; 2>/dev/null || true
find e2e/current -mindepth 1 -type d -empty -delete 2>/dev/null || true

# 验证
PNG_COUNT=$(ls e2e/current/*.png 2>/dev/null | wc -l | tr -d ' ')
echo ""

if [ "$PNG_COUNT" -lt 4 ]; then
  echo -e "${RED}⚠️  只下载到 ${PNG_COUNT} 张截图（应有 4 张）${NC}"
  echo "  请截图此窗口发给我排查。"
  read -p "按 Enter 关闭..." _
  exit 1
fi

echo "  截图文件："
ALL_OK=true
for f in e2e/current/*.png; do
  SIZE=$(stat -f%z "$f" 2>/dev/null || echo 0)
  FNAME=$(basename "$f")
  if [ "$SIZE" -lt 100000 ]; then
    echo -e "  ${RED}  ⚠️  ${FNAME} (${SIZE} bytes — 可能为空白)${NC}"
    ALL_OK=false
  else
    SIZE_KB=$((SIZE / 1024))
    echo -e "  ${GREEN}  ✓ ${FNAME} (${SIZE_KB} KB)${NC}"
  fi
done

echo ""
echo "  MD5 校验（4 个值必须各不相同）："
md5 e2e/current/*.png 2>/dev/null | awk '{print "    " $0}'

# 自动推送
echo ""
echo -e "  推送截图到 GitHub..."
cd "$PROJ_DIR"
git add e2e/current/*.png
git commit -m "screenshots: capture via GHA signal-driven workflow" 2>/dev/null || echo "  (截图无变化，跳过提交)"
git push origin dev 2>/dev/null || echo -e "  ${YELLOW}推送失败，请手动执行：git push origin dev${NC}"

# ============================================================
# 完成
# ============================================================
echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${GREEN}${BOLD}  🎉 全部完成！${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""
echo -e "  截图已生成并推送到 GitHub。"
echo -e "  告诉我「${BOLD}push 完成${NC}」即可进入下一步。"
echo ""
echo -e "${DIM}  ─── 后续如需重新截图 ───${NC}"
echo -e "${DIM}  cd ~/pixel-herbarium${NC}"
echo -e "${DIM}  git pull origin dev${NC}"
echo -e "${DIM}  gh workflow run screenshots.yml --ref dev${NC}"
echo -e "${DIM}  gh run watch${NC}"
echo -e "${DIM}  gh run download --dir e2e/current${NC}"
echo ""
read -p "按 Enter 关闭此窗口..." _
