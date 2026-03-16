# DeskBuddy · 输入法桌宠 技术路线深度分析

> 本文档在整体规划方案的基础上，逐阶段拆解具体的技术选型、架构决策、关键难点与替代方案，为工程落地提供可执行级别的参考。

---

## 一、技术栈全局决策

在进入分阶段分析之前，需要先确定几个贯穿全局的技术选型。这些决策将约束后续所有阶段的实现空间。

### 1.1 主运行时：Electron vs Tauri vs 原生

| 维度 | Electron | Tauri (Rust + WebView) | 原生 (C++/Swift/Rust) |
|------|----------|----------------------|---------------------|
| 迷你形态内存 | ~50-80 MB（新开 Renderer） | ~15-25 MB（系统 WebView） | ~5-10 MB |
| 跨平台一致性 | 高 | 中（WebView 渲染差异） | 低（三套代码） |
| 系统托盘定制 | 一般（Tray API 有限） | 好（可调原生窗口） | 完全可控 |
| 键盘 Hook 能力 | 需 N-API 原生插件 | Rust 侧原生实现 | 原生实现 |
| 现有桌面形态兼容 | 假设已有 Electron 基座 | 需要迁移 | 需要重写 |
| 打包体积 | ~150 MB+ | ~8-15 MB | ~3-5 MB |

**推荐决策**：如果现有桌面端是 Electron 架构，迷你形态采用**同进程 BrowserWindow（隐藏 frame）**方案，共享主进程的 EmotionCore 实例，避免 IPC 延迟。长期考虑将迷你形态窗口迁移到 Tauri 的轻量 WebView 以压缩内存。

**如果现有桌面端是 Unity/Godot 等游戏引擎**：则迷你形态必须独立为一个轻量进程（Tauri 或原生），通过本地 IPC（Unix Socket / Named Pipe）与主进程通信。这会影响 Phase 0 的架构设计。

### 1.2 进程模型设计

```
方案 A：单进程多窗口（Electron 原生支持）
┌──────────────────────────────────────────────┐
│ Main Process                                 │
│  ├─ EmotionCore (共享内存)                    │
│  ├─ EventBus                                 │
│  ├─ TypingBehaviorSensor (N-API)             │
│  ├─ DesktopWindow (Renderer 1)               │
│  └─ MiniWindow (Renderer 2, 48×48 无框窗口)  │
└──────────────────────────────────────────────┘
优势：状态同步零延迟（直接读内存），开发简单
劣势：迷你形态绑死在 Electron 进程树上，整体内存较高

方案 B：双进程 IPC（适用于异构架构）
┌─────────────────────┐    IPC     ┌─────────────────────┐
│ Desktop Process      │◄─────────►│ Mini Process         │
│ (Unity/Godot/Electron)│  (Socket) │ (Tauri/原生)          │
│  ├─ EmotionCore ─────┼──广播────►│  ├─ EmotionMirror    │
│  ├─ EventBus         │           │  ├─ MiniRenderer     │
│  └─ TypingSensor     │           │  └─ PresenceSystem   │
└─────────────────────┘           └─────────────────────┘
优势：迷你形态极轻量（可以 < 15MB），可独立更新
劣势：IPC 引入 10-50ms 延迟，需处理进程生命周期同步
```

**关键决策点**：如果桌面端已经是 Electron，选方案 A；如果桌面端是游戏引擎，选方案 B。后续分析以方案 A 为主线，方案 B 差异点会单独标注。

### 1.3 键盘 Hook 技术选型

这是本项目最敏感的系统级操作，直接决定隐私合规边界。

| 平台 | API | 权限 | 安全边界 |
|------|-----|------|---------|
| Windows | `SetWindowsHookEx(WH_KEYBOARD_LL, ...)` | 无需特殊权限 | 回调收到 `KBDLLHOOKSTRUCT`，含 vkCode——**必须丢弃 vkCode，只保留时间戳** |
| macOS | `CGEventTapCreate(kCGHKIDEventTap, ...)` | 辅助功能权限 | 回调收到 `CGEvent`，含 keyCode——**同上，丢弃 keyCode** |
| Linux X11 | `XRecordCreateContext` + `XRecordEnableContextAsync` | 无需特殊权限 | 回调含 KeyPress event |
| Linux Wayland | `libinput` (需 input group) 或 `wlr-input-inhibitor` | 需 input group 权限 | Wayland 安全模型限制全局监听 |

**隐私硬性要求**：

```typescript
// 所有平台的键盘 Hook 回调必须遵循此接口
interface KeyEventCallback {
  // 注意：参数只有时间戳，没有按键码
  onKeyEvent(timestamp: number): void;
}

// 禁止事项（代码审计检查点）
// ❌ 不得记录 vkCode / keyCode / charCode
// ❌ 不得记录按键 up/down 状态（可推断输入内容）
// ❌ 不得记录任何修饰键状态（Shift/Ctrl 等）
// ✅ 只记录：时间戳数组
// ✅ 只计算：频率、间隔、连续时长
```

---

## 二、逐阶段技术深度分析

### Phase 0 · 基础设施（2 周）

#### 核心架构：EmotionCore 解耦

原方案定义了 `EmotionState` 接口，但未解决以下工程问题：

**问题 1：状态持久化策略**

EmotionCore 不仅需要在运行时被多个渲染出口订阅，还需要跨会话持久化（用户关机后好感度不能丢失）。

```typescript
// 持久化层设计
interface EmotionPersistence {
  // 写入策略：防抖，最多每 30 秒写一次磁盘
  save(state: EmotionState): Promise<void>;
  // 读取：启动时一次性加载
  load(): Promise<EmotionState | null>;
  // 存储位置
  // Windows: %APPDATA%/DeskBuddy/emotion_state.json
  // macOS:   ~/Library/Application Support/DeskBuddy/emotion_state.json
  // Linux:   ~/.config/DeskBuddy/emotion_state.json
}

// 防抖写入实现
class DebouncedPersistence implements EmotionPersistence {
  private dirty = false;
  private timer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 30_000; // 30 秒

  markDirty() {
    this.dirty = true;
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL);
    }
  }

  // 关键：应用退出时必须同步 flush
  async onBeforeQuit() {
    if (this.dirty) await this.flush();
  }
}
```

**问题 2：状态订阅模型选择**

两种主流方案的取舍：

```
方案 A：观察者模式（EventEmitter）
  EmotionCore.on('stateChange', (newState) => { ... })
  ✅ 简单直观
  ❌ 订阅者收到的是完整状态快照，无法高效 diff
  ❌ 如果状态更新频率高（打字时每秒多次），可能产生大量无效通知

方案 B：响应式状态管理（类 Zustand / Valtio / MobX proxy）
  const state = emotionCore.getState();
  // 只在特定字段变化时触发渲染
  subscribe(state, 'mood.blushCheek', (value) => { ... })
  ✅ 细粒度订阅，迷你形态只关心 eye/blush/mouth 三个参数
  ✅ 桌面形态可以订阅完整的 mood + combo + decayCurves
  ❌ 引入额外依赖

推荐：方案 B。使用 Valtio（proxy-based）或手写一个轻量的
selector-based subscribe 模式。迷你形态渲染帧率极低（1-2 fps），
不需要每次 mood 变化都重绘，只在 eye/mouth/blush 的离散档位
发生变化时才触发。
```

**问题 3：衰减曲线的 tick 引擎**

原方案定义了衰减曲线数据结构（`blush.halfLife` 等），但没有说明谁驱动衰减计算。

```typescript
// 衰减 tick 引擎设计
class DecayEngine {
  private tickInterval: NodeJS.Timeout | null = null;
  private readonly TICK_MS = 100; // 100ms tick（10fps 更新衰减值）

  start() {
    this.tickInterval = setInterval(() => this.tick(), this.TICK_MS);
  }

  private tick() {
    const now = Date.now();
    const state = emotionCore.getState();

    // blush 指数衰减
    if (state.decayCurves.blush.startValue > 0.01) {
      const elapsed = now - state.decayCurves.blush.startTime;
      const halfLife = state.decayCurves.blush.halfLife;
      const newValue = state.decayCurves.blush.startValue *
                       Math.pow(0.5, elapsed / halfLife);

      // 量化到 0.05 步长，避免无意义的微小更新
      const quantized = Math.round(newValue * 20) / 20;
      if (quantized !== state.mood.blushCheek) {
        emotionCore.update({ mood: { blushCheek: quantized } });
      }
    }

    // gaze 线性归位
    // ...（类似逻辑）
  }

  // 关键：桌面形态不可见时降频
  onVisibilityChange(visible: boolean) {
    clearInterval(this.tickInterval!);
    this.tickInterval = setInterval(
      () => this.tick(),
      visible ? this.TICK_MS : this.TICK_MS * 10  // 不可见时降到 1fps
    );
  }
}
```

#### 事件总线架构

原方案的事件总线需要明确分层：

```
事件产生层（Sources）
  ├─ CalendarEventSource   ─── 日历事件（已有）
  ├─ WeatherEventSource    ─── 天气变化（已有）
  ├─ TimeEventSource       ─── 时间触发（已有）
  ├─ AlarmEventSource      ─── 闹钟提醒（已有）
  └─ TypingBehaviorSource  ─── 打字行为（新增，Phase 1 实现）
       │
       ▼
事件处理层（EventBus）
  ├─ 事件去重 & 节流（同类事件 N 秒内只处理一次）
  ├─ 优先级排序（闹钟 > 日历 > 打字行为 > 天气）
  └─ 冲突消解（两个事件同时触发时的表现选择）
       │
       ▼
决策层（EmotionDecisionEngine）
  ├─ 事件 → 情感状态映射规则
  ├─ 好感度增减计算
  ├─ combo 判定
  └─ 台词选择（好感度等级 × 事件类型 → 台词池 → 加权随机）
       │
       ▼
分发层（Dispatcher）
  ├─ DesktopRendererAdapter  → 完整 Spine 动画指令
  └─ MiniRendererAdapter     → 简化表情参数 + 气泡文本
```

**事件冲突消解举例**：用户在深夜 23:30 连续打字超过 60 分钟。此时 `late_night_typing` 和 `long_session` 同时触发。规则：

```typescript
// 冲突消解规则表
const conflictRules: ConflictRule[] = [
  {
    events: ['late_night_typing', 'long_session'],
    resolve: 'merge', // 合并为一条消息
    // 台词优先使用 late_night_typing 的，但好感度取两者中较高的
    mergeStrategy: {
      dialogue: 'late_night_typing',
      affectionDelta: 'max'
    }
  },
  {
    events: ['calendar_event', 'typing_burst'],
    resolve: 'priority', // 日历事件优先展示，打字行为延后 30s
    delayMs: 30_000
  }
];
```

#### Phase 0 交付检查清单

| 检查项 | 验收标准 |
|-------|---------|
| EmotionCore 独立模块 | 可以在无渲染器的纯 Node 环境中实例化、读写状态、触发衰减 |
| 持久化层 | 写入-读取往返测试通过；异常退出后状态不丢失 |
| 事件总线 | 可以模拟发送 TypingEvent，EmotionCore 状态正确响应 |
| 双出口分发器 | 两个 mock adapter 同时订阅，收到一致且及时的状态更新 |
| 衰减引擎 | blush 从 1.0 衰减到 0.05 以下耗时符合设计（半衰期参数可调） |

---

### Phase 1 · 迷你形态 MVP（3 周）

#### 1-1 迷你窗口技术实现（方案 B · 系统托盘悬浮窗）

**窗口创建**（Electron 方案）：

```typescript
// 迷你形态窗口配置
const miniWindow = new BrowserWindow({
  width: 64,
  height: 64,
  frame: false,           // 无标题栏
  transparent: true,      // 透明背景
  alwaysOnTop: true,      // 始终置顶
  skipTaskbar: true,      // 不在任务栏显示
  resizable: false,
  focusable: false,       // 关键：不抢焦点，不影响用户打字
  // Windows 特有
  type: 'toolbar',        // 不显示在 Alt+Tab 切换列表
  webPreferences: {
    preload: path.join(__dirname, 'mini-preload.js'),
    // 关键性能优化
    backgroundThrottling: false, // 即使不可见也不降频
  }
});

// 定位：锚定在系统托盘图标上方
const trayBounds = tray.getBounds();
miniWindow.setPosition(
  trayBounds.x + trayBounds.width / 2 - 32,
  trayBounds.y - 72 // 托盘上方 8px 间距
);
```

**关键难点：focusable: false 的限制**

当 `focusable: false` 时，窗口无法接收鼠标点击事件——但迷你形态需要支持点击互动。

```
解决方案：
1. 默认 focusable: false（用户打字时不干扰）
2. 鼠标进入窗口区域时，通过 mouseenter 事件
   临时设置 focusable: true
3. 鼠标离开或 500ms 无操作后恢复 focusable: false
4. 使用 setIgnoreMouseEvents(true, { forward: true })
   实现透明区域穿透点击

// 伪代码
miniWindow.setIgnoreMouseEvents(true, { forward: true });

// 渲染进程中
document.addEventListener('mouseenter', () => {
  ipcRenderer.send('mini-focus-enable');
});
document.addEventListener('mouseleave', () => {
  ipcRenderer.send('mini-focus-disable');
});
```

#### 1-2 迷你头像渲染方案比较

| 方案 | 实现 | 优势 | 劣势 |
|------|------|------|------|
| Sprite Sheet | 预渲染所有表情帧为 PNG，JS 切换 `backgroundPosition` | 性能极好，0 CPU 绘制 | 组合爆炸（eye×mouth×blush = 5×5×3 = 75 帧），增加新表情需重新出图 |
| Canvas 实时绘制 | 分层绘制 face/eye/mouth/blush | 灵活组合，无组合爆炸 | 48px 下 Canvas 渲染精度差 |
| SVG 分层 | 面部各部件为独立 SVG 元素，CSS 控制状态 | 完美缩放，CSS transition 驱动动画 | SVG DOM 操作比 Canvas 慢 |
| Lottie | 导出 After Effects 动画为 JSON | 设计师友好，动画流畅 | 依赖 lottie-web（+60KB），48px 下细节损失 |

**推荐方案：SVG 分层 + CSS transition**

```
理由：
1. 48-64px 下只有 3 个视觉通道（眼睛/嘴巴/腮红），
   不需要复杂动画引擎
2. CSS transition 的 GPU 加速足够驱动淡入淡出、位移
3. SVG 各部件用 <use> 引用，切换表情只改 href
4. 无额外依赖，渲染层代码量 < 200 行
```

SVG 分层结构示意：

```svg
<svg viewBox="0 0 64 64" width="64" height="64">
  <!-- 面部底色（固定） -->
  <circle cx="32" cy="32" r="28" fill="#FFF5E6"/>

  <!-- 腮红层（opacity 由 blushCheek 驱动） -->
  <g id="blush" opacity="0" transition="opacity 0.5s">
    <circle cx="18" cy="38" r="5" fill="#FFB6C1" opacity="0.6"/>
    <circle cx="46" cy="38" r="5" fill="#FFB6C1" opacity="0.6"/>
  </g>

  <!-- 眼睛层（通过切换 <use> href 改变形状） -->
  <use id="left-eye"  href="#eye-normal" x="20" y="26"/>
  <use id="right-eye" href="#eye-normal" x="38" y="26"/>

  <!-- 嘴巴层 -->
  <use id="mouth" href="#mouth-neutral" x="28" y="42"/>

  <!-- 预定义的眼睛形状 -->
  <defs>
    <circle id="eye-normal" r="3" fill="#333"/>
    <rect id="eye-half" width="6" height="2" rx="1" fill="#333"/>
    <circle id="eye-wide" r="4" fill="#333"/>
    <g id="eye-sparkle">
      <circle r="3" fill="#333"/>
      <circle r="1" cx="1" cy="-1" fill="#FFF"/>
    </g>
  </defs>
</svg>
```

#### 1-3 输入行为感知层 · 工程细节

原方案给出了 `TypingBehaviorSensor` 的骨架，以下补充工程关键点：

**打字速度分档算法**：

```typescript
// 滑动窗口计算打字速度
function classifySpeed(timestamps: number[]): 'slow' | 'normal' | 'fast' {
  if (timestamps.length < 10) return 'normal';

  // 取最近 20 次按键的平均间隔
  const recent = timestamps.slice(-20);
  const intervals: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    intervals.push(recent[i] - recent[i - 1]);
  }
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  // 分档阈值（基于中文输入法场景）
  // 中文拼音输入：平均间隔 200-400ms 为正常
  // 英文直接输入：平均间隔 100-200ms 为正常
  if (avgInterval > 500) return 'slow';   // 思考型输入
  if (avgInterval < 150) return 'fast';   // 急促输入
  return 'normal';
}
```

**退格检测问题**：

原方案提到「连续删除（退格频率高）」作为一种打字模式，但如果我们严格不记录按键码（隐私要求），就无法区分退格和普通按键。

```
解决方案：
放宽隐私策略，只额外记录「是否为退格键」这一布尔值。
退格键不包含任何输入内容信息，只表示「删除动作」。
这在隐私合规上是安全的（不暴露输入内容），
但需要在隐私说明中明确告知用户。

// 修改后的接口
interface KeyEventCallback {
  onKeyEvent(timestamp: number, isBackspace: boolean): void;
}
```

**系统级 Hook 的 N-API 封装**（Electron 环境）：

```
需要创建一个原生 Node 插件（N-API），分平台编译：
  ├─ src/
  │   ├─ keyboard_hook_win.cpp   // SetWindowsHookEx
  │   ├─ keyboard_hook_mac.mm    // CGEventTap
  │   ├─ keyboard_hook_linux.cpp // XRecord
  │   └─ keyboard_hook.h         // 公共接口
  ├─ binding.gyp                  // node-gyp 构建配置
  └─ index.js                    // JS 封装层

构建工具链：
- node-gyp + prebuild（预编译二进制分发）
- 或 napi-rs（Rust 编写 N-API，安全性更好）

推荐 napi-rs：Rust 的内存安全特性天然适合
处理系统级 Hook 这种敏感操作。
```

#### Phase 1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| macOS 辅助功能权限拒绝率高 | 高 | 功能降级 | 提供无键盘监听的「纯托盘」降级模式，只响应时间/日历事件 |
| Electron 透明窗口在 Linux Wayland 下不支持 | 中 | Linux 形态异常 | Wayland 下 fallback 为不透明圆角窗口 |
| 键盘 Hook 被杀毒软件拦截 | 中 | Windows 下功能失效 | 签名可执行文件；提供白名单引导 |
| 48px 下表情不可辨识 | 低 | 设计返工 | 提前做用户测试，备选方案放大到 80px |

---

### Phase 2 · 双形态联动（2 周）

#### 2-1 注意力分配协议 · 技术实现

原方案提出了「回声模式」与「代言人模式」的概念，以下是状态机实现：

```typescript
// 注意力状态机
type AttentionMode = 'echo' | 'spokesperson';

class AttentionProtocol {
  private mode: AttentionMode = 'spokesperson';
  private desktopVisible = false;

  // 桌面窗口可见性变化
  onDesktopVisibilityChange(visible: boolean) {
    this.desktopVisible = visible;
    this.mode = visible ? 'echo' : 'spokesperson';
    this.applyMode();
  }

  private applyMode() {
    if (this.mode === 'echo') {
      // 回声模式配置
      miniRenderer.setConfig({
        maxBubbleFrequency: 0,        // 禁止气泡
        animationLevel: 'minimal',     // 只眨眼
        presenceDecayEnabled: false,   // 不衰减（保持当前状态）
      });
    } else {
      // 代言人模式配置
      miniRenderer.setConfig({
        maxBubbleFrequency: 2,         // 每小时最多 2 次气泡
        animationLevel: 'full',        // 完整表情系统
        presenceDecayEnabled: true,    // 启用存在感衰减
      });
    }
  }
}
```

**桌面可见性检测的边界情况**：

```
需要处理的复杂场景：
1. 桌面窗口被其他窗口部分遮挡 → 视为「不可见」
   检测方式：定时查询窗口遮挡比例（Electron 无原生 API，
   需 N-API 调用平台 API）
   - Windows: DwmGetWindowAttribute + DWMWA_CLOAKED
   - macOS: CGWindowListCopyWindowInfo 比对 Z-order

2. 多显示器场景 → 桌面在副屏可见但用户看着主屏
   简化处理：只要桌面窗口 focus 状态丢失就切 spokesperson

3. 全屏应用（游戏/PPT）→ 迷你形态也应该隐藏
   检测方式：监听系统全屏状态
   - macOS: NSApplication.presentationOptions
   - Windows: SHQueryUserNotificationState

实用主义建议：MVP 阶段只用 focus/blur 事件判断，
不做精确遮挡检测。够用且稳定。
```

#### 2-2 跨形态互动的延迟要求

用户在迷你形态点击角色后，如果立即切到桌面窗口，角色状态必须已经同步。

```
延迟预算分解：
  迷你形态点击事件 → IPC 到主进程      < 5ms（同进程方案）/ < 20ms（IPC方案）
  EmotionCore 状态更新                  < 1ms
  状态变更广播到桌面形态                 < 5ms / < 20ms
  桌面 Spine 动画开始播放               < 16ms（一帧）
  ────────────────────────────────────
  总延迟                                < 27ms / < 57ms

  用户从点击迷你头像到 Alt+Tab 切窗口
  的平均操作时间                         ~300-500ms

  结论：两种方案都能在用户切窗口前完成同步。
```

**「被戳过的余韵」实现**：

```typescript
// 当桌面形态从不可见变为可见时，检查最近的迷你形态互动
onDesktopBecomeVisible() {
  const lastMiniInteraction = emotionCore.getLastInteractionSource();
  if (lastMiniInteraction?.source === 'mini' &&
      Date.now() - lastMiniInteraction.timestamp < 30_000) {
    // 30秒内有迷你形态互动，播放「余韵」动画
    desktopRenderer.playAnimation('post_touch_reaction', {
      intensity: lastMiniInteraction.type === 'long_press' ? 'high' : 'low'
    });
  }
}
```

---

### Phase 3 · 存在感系统（2 周）

#### 3-1 存在感衰减的渲染优化

存在感衰减到 Ghost 状态时（opacity: 0.15），不应继续消耗渲染资源。

```typescript
// 渲染帧率与存在感等级联动
const RENDER_FPS_BY_PRESENCE: Record<PresenceLevel, number> = {
  'active': 10,   // 10fps，支持眼睛追踪微动画
  'idle':    2,   // 2fps，偶尔眨眼
  'dim':     0.2, // 每5秒一帧，检查是否需要状态转换
  'ghost':   0,   // 完全停止渲染循环，用静态图
};

// Ghost 状态优化
function enterGhostMode() {
  // 1. 停止 requestAnimationFrame 循环
  cancelAnimationFrame(rafId);
  // 2. 将 SVG 替换为预渲染的半透明 PNG（减少 DOM 节点）
  miniContainer.innerHTML = '<img src="ghost.png" style="opacity:0.15">';
  // 3. 只保留一个 click 事件监听器（用于「回神」）
}
```

#### 3-2 「回神」动画的情感设计转化为技术参数

原方案描述：「角色从半透明状态回神，眼睛微微睁大，0.3 秒的被你看到了的微表情」

```typescript
// 回神动画时间线（精确到帧）
const WAKE_UP_ANIMATION: AnimationTimeline = {
  duration: 800, // 总时长 0.8 秒
  keyframes: [
    // 0ms: Ghost 状态起始
    { time: 0,   opacity: 0.15, eye: 'half',    blush: 0,   scale: 0.95 },
    // 100ms: 快速恢复可见性（惊讶感的来源）
    { time: 100, opacity: 0.8,  eye: 'wide',    blush: 0,   scale: 1.02 },
    // 300ms: 「被看到」的微妙反应——微微害羞
    { time: 300, opacity: 1.0,  eye: 'wide',    blush: 0.3, scale: 1.0  },
    // 500ms: 回归正常但保留一点腮红
    { time: 500, opacity: 1.0,  eye: 'normal',  blush: 0.4, scale: 1.0  },
    // 800ms: 腮红开始自然衰减（交还给 DecayEngine）
    { time: 800, opacity: 1.0,  eye: 'normal',  blush: 0.35, scale: 1.0 },
  ]
};

// 关键：动画结束后将 blush 值写回 EmotionCore，
// 让衰减引擎自然接管后续的腮红消退
```

#### 3-3 打字节奏共鸣的节流策略

原方案要求「每分钟最多 2 次微反应」。实现：

```typescript
class TypingResonanceThrottle {
  private reactionCount = 0;
  private windowStart = Date.now();
  private readonly MAX_PER_MINUTE = 2;
  private readonly REACTION_DELAY_RANGE = [500, 1500]; // 延迟范围

  canReact(): boolean {
    const now = Date.now();
    if (now - this.windowStart > 60_000) {
      this.reactionCount = 0;
      this.windowStart = now;
    }
    return this.reactionCount < this.MAX_PER_MINUTE;
  }

  // 随机延迟，避免机械感
  getReactionDelay(): number {
    const [min, max] = this.REACTION_DELAY_RANGE;
    return min + Math.random() * (max - min);
  }

  recordReaction() {
    this.reactionCount++;
  }
}
```

---

### Phase 4 · 内容层（3 周）

#### 4-1 台词系统的数据架构

台词不是硬编码，需要一个可扩展、可热更新的数据系统。

```typescript
// 台词数据模型
interface DialogueLine {
  id: string;                          // 唯一标识
  text: string;                        // 台词文本
  context: DialogueContext;            // 触发情境
  levelRange: [number, number];        // 好感度等级范围 [min, max]
  weight: number;                      // 基础权重（1-10）
  lastUsedTime?: number;              // 上次使用时间
  cooldownHours: number;              // 冷却时间（小时）
  tags: string[];                     // 标签（用于情感分类）
}

interface DialogueContext {
  eventType: string;                   // 事件类型
  timeRange?: [number, number];       // 时间范围 [startHour, endHour]
  requiredPresenceLevel?: PresenceLevel;
  seasonalTag?: 'spring' | 'summer' | 'autumn' | 'winter';
}

// 加权随机选择器（避免重复）
function selectDialogue(
  pool: DialogueLine[],
  currentLevel: number,
  eventType: string
): DialogueLine | null {
  const now = Date.now();

  // 过滤：等级匹配 + 冷却结束 + 情境匹配
  const candidates = pool.filter(line =>
    currentLevel >= line.levelRange[0] &&
    currentLevel <= line.levelRange[1] &&
    line.context.eventType === eventType &&
    (!line.lastUsedTime ||
     now - line.lastUsedTime > line.cooldownHours * 3600_000)
  );

  if (candidates.length === 0) return null;

  // 加权随机：最近使用过的权重衰减
  const weights = candidates.map(line => {
    let w = line.weight;
    if (line.lastUsedTime) {
      const hoursSinceUse = (now - line.lastUsedTime) / 3600_000;
      // 72 小时内逐渐恢复权重
      w *= Math.min(1, hoursSinceUse / 72);
    }
    return w;
  });

  return weightedRandomSelect(candidates, weights);
}
```

**台词数据存储**：

```
推荐方案：JSON 文件 + 文件监听热更新
  dialogues/
  ├─ work_companion.json    // 工作陪伴类
  ├─ time_aware.json        // 时间感知类
  ├─ achievement.json       // 成就类
  └─ seasonal.json          // 季节限定

优势：
- 策划/文案可以直接编辑 JSON，无需开发介入
- 文件监听实现热更新，不需要重启应用
- 未来可以扩展为从服务器拉取新台词包（DLC 模式）
```

#### 4-2 自动换装的资源管理

```
换装涉及的资源组织：

assets/mini/
  ├─ base/                  // 基础面部（常驻内存）
  │   ├─ face.svg
  │   ├─ eyes/              // 各种眼睛状态
  │   └─ mouth/             // 各种嘴巴状态
  ├─ seasonal/              // 季节装扮（按需加载）
  │   ├─ winter_scarf.svg
  │   ├─ summer_sunglasses.svg
  │   └─ rain_wet_hair.svg
  ├─ level_unlock/          // 好感度解锁（按需加载）
  │   ├─ l2_smile_default.svg
  │   ├─ l3_push_glasses.svg
  │   └─ l5_sleepy_companion.svg
  └─ manifest.json          // 资源清单 + 加载规则

manifest.json 结构：
{
  "seasonal": {
    "winter_scarf": {
      "condition": { "month": [12, 1, 2] },
      "layer": "accessory",
      "zIndex": 10,
      "file": "seasonal/winter_scarf.svg"
    }
  },
  "level_unlock": {
    "l5_sleepy": {
      "condition": { "level": 5, "hour": [23, 24, 0, 1, 2, 3, 4] },
      "replaces": ["eyes", "mouth"],
      "file": "level_unlock/l5_sleepy_companion.svg"
    }
  }
}
```

---

### Phase 5 · 平台适配与性能（2 周）

#### 5-1 性能监控埋点

```typescript
// 内建性能监控（不依赖外部服务）
class PerformanceMonitor {
  private samples: PerformanceSample[] = [];

  collectSample() {
    const sample: PerformanceSample = {
      timestamp: Date.now(),
      memoryMB: process.memoryUsage().heapUsed / 1024 / 1024,
      cpuPercent: this.getCpuUsage(),
      presenceLevel: miniRenderer.getPresenceLevel(),
      renderFps: miniRenderer.getCurrentFps(),
    };
    this.samples.push(sample);

    // 超标告警
    if (sample.memoryMB > 15) {
      logger.warn('Mini mode memory exceeds budget', sample);
      this.triggerGC();
    }
    if (sample.cpuPercent > 0.5 && sample.presenceLevel !== 'active') {
      logger.warn('CPU usage too high for non-active state', sample);
    }
  }

  // 每日生成性能报告（本地存储，可选上报）
  generateDailyReport(): PerformanceReport { /* ... */ }
}
```

#### 5-2 Wayland 兼容性应对

```
Wayland 是 Phase 5 最大的技术挑战：

1. 全局键盘监听：Wayland 安全模型禁止全局键盘 Hook
   解决方案：
   a. 检测桌面环境，Wayland 下提示用户安装
      xdg-desktop-portal 并使用 Input Capture 协议
   b. Fallback：放弃键盘监听，只使用时间/日历事件驱动
   c. 长期方案：提供 Flatpak 包，利用 Portal 机制

2. 透明窗口：部分 Wayland compositor 不支持
   解决方案：检测支持情况，不支持时使用圆角不透明窗口

3. 窗口置顶：wl_shell 不保证 alwaysOnTop
   解决方案：使用 layer-shell 协议（wlr-layer-shell）
   将迷你窗口放在 overlay 层
```

---

## 三、跨阶段依赖关系图

```
Phase 0 ─────────────────────────────────────────────────────────►
  │ EmotionCore                                                    
  │ EventBus                                                       
  │ Dispatcher                                                     
  │                                                                
  ├──► Phase 1 ──────────────────────────────────────────────────►  
  │     │ MiniWindow                                                
  │     │ SVG Renderer                                              
  │     │ TypingBehaviorSensor                                      
  │     │                                                           
  │     ├──► Phase 2 ──────────────────────────────────────────►    
  │     │     │ AttentionProtocol                                   
  │     │     │ CrossFormInteraction                                
  │     │     │                                                     
  │     │     ├──► Phase 3 ────────────────────────────────────►    
  │     │     │     │ PresenceSystem                                
  │     │     │     │ TypingResonance                               
  │     │     │     │                                               
  │     │     │     └──► Phase 4 ──────────────────────────────►    
  │     │     │           │ DialogueEngine                          
  │     │     │           │ CostumeSystem                           
  │     │     │           │ AchievementTracker                      
  │     │     │           │                                         
  │     │     │           └──► Phase 5 ────────────────────────►    
  │     │     │                 │ Platform Adapters                  
  │     │     │                 │ Performance Monitor                
  │     │     │                 │ Resource Cache                     
  │     │     │                 │                                    
  │     │     │                 └──► Phase 6（持续）               
  │     │     │                                                     
  │     │     │  ※ Phase 2 + Phase 3 可以部分并行                   
  │     │     │     前提：PresenceSystem 不依赖 AttentionProtocol    
  │     │     │     实际上存在依赖——Presence 在 echo 模式下应暂停    
  │     │     │     → 结论：Phase 2 先完成，Phase 3 紧随             
```

**可并行的工作流**：

| 并行流 | 内容 | 前提 |
|--------|------|------|
| Phase 1 期间 | 美术组开始制作 Phase 4 的换装素材 | 确定 SVG 分层规范 |
| Phase 2 期间 | 文案组编写 Phase 4 的台词数据库 | 确定 JSON schema |
| Phase 3 期间 | 测试组开始跨平台兼容性预研 | Phase 5 技术方案初稿 |

---

## 四、技术债务与长期演进

### 4.1 MVP 阶段主动承担的技术债

| 技术债 | 接受理由 | 还债时机 |
|--------|---------|---------|
| 方案 B 托盘窗口而非真正嵌入输入法 | 快速验证核心假设 | Phase 6+ 有数据证明 ROI 后 |
| Electron 方案的内存偏高 | 与现有桌面端共享代码库 | DAU > 10万后考虑 Tauri 迁移 |
| 台词硬编码在 JSON 文件 | 避免过早引入数据库 | 台词量 > 500 条后迁移 SQLite |
| 单一语言（中文） | 聚焦核心市场 | 国际化需求明确后 |

### 4.2 架构演进路线

```
当前（MVP）            中期（用户量增长）         远期（平台化）
                        
单进程 Electron    →    Tauri 迷你形态独立     →    多角色支持
本地 JSON 台词     →    SQLite + OTA 更新      →    UGC 台词平台
固定 SVG 表情      →    Lottie 丰富动画        →    Live2D 迷你版
无数据上报        →    匿名行为数据上报        →    A/B 测试平台
仅桌面端          →    移动端 widget 形态      →    跨设备状态同步
```

---

*本文档为 DeskBuddy 输入法桌宠的工程级技术路线分析，应与产品规划文档配合阅读。*
