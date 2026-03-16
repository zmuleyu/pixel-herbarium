import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════
// SIMULATED STATE MACHINE (XState concept demo)
// ═══════════════════════════════════════════
const STATES = {
  IDLE: "idle",
  ALERT: "alert",
  WAITING: "waiting",
  URGENT: "urgent",
  CELEBRATING: "celebrating",
  SLEEPING: "sleeping",
};

const SPEECH_STATES = { SILENT: "silent", SPEAKING: "speaking", FADING: "fading" };

const ANIMS = {
  idle: ["😺 坐着发呆", "🐱 伸懒腰", "😸 打哈欠", "🐈 四处张望"],
  alert: ["😾 竖起耳朵!", "🙀 跳起来!", "😼 举牌子!"],
  waiting: ["😿 看着你...", "🐱 踮脚等待", "😺 歪头"],
  urgent: ["🙀 急急急!", "😿 冒汗中!", "😾 敲屏幕!"],
  celebrating: ["😸 跳舞!", "😺 竖大拇指!", "😻 撒花!"],
  sleeping: ["😴 Zzz...", "💤 安静睡觉"],
};

const PRIORITY_COLORS = {
  low: "#10b981",
  normal: "#3b82f6",
  high: "#f59e0b",
  critical: "#ef4444",
};

const DATA_SOURCES = [
  { id: "claude", name: "Claude Code", icon: "🤖", cat: "AI Agent", connected: true },
  { id: "email", name: "邮箱 (IMAP)", icon: "📧", cat: "邮件", connected: true },
  { id: "gmail", name: "Gmail API", icon: "✉️", cat: "邮件", connected: false },
  { id: "slack", name: "Slack", icon: "💬", cat: "即时通信", connected: true },
  { id: "discord", name: "Discord", icon: "🎮", cat: "即时通信", connected: false },
  { id: "telegram", name: "Telegram", icon: "📱", cat: "即时通信", connected: true },
  { id: "dingtalk", name: "钉钉", icon: "💼", cat: "即时通信", connected: false },
  { id: "feishu", name: "飞书", icon: "🪶", cat: "即时通信", connected: false },
  { id: "wecom", name: "企业微信", icon: "💚", cat: "微信生态", connected: false },
  { id: "wechat", name: "个人微信", icon: "🟢", cat: "微信生态", connected: false, experimental: true },
  { id: "gcal", name: "Google Calendar", icon: "📅", cat: "日历", connected: true },
  { id: "fitbit", name: "Fitbit", icon: "⌚", cat: "运动健康", connected: false },
  { id: "strava", name: "Strava", icon: "🏃", cat: "运动健康", connected: false },
];

const MOCK_EVENTS = [
  { platform: "claude", type: "task_complete", priority: "normal", title: "✅ 任务完成", message: "代码重构已完成，等待你的review", delay: 0 },
  { platform: "email", type: "email_new", priority: "normal", title: "📧 新邮件", message: "来自 张明: Q2 季度报告初稿", delay: 3000 },
  { platform: "slack", type: "im_message", priority: "low", title: "💬 Slack", message: "#dev-team: 今天下午3点站会", delay: 5000 },
  { platform: "gcal", type: "calendar_reminder", priority: "high", title: "📅 会议提醒", message: "产品评审会 15分钟后开始", delay: 8000 },
  { platform: "telegram", type: "im_message", priority: "low", title: "📱 Telegram", message: "小王: 晚上一起吃饭吗？", delay: 10000 },
  { platform: "claude", type: "permission_required", priority: "critical", title: "🔐 权限请求", message: "Claude Code 需要执行 rm -rf node_modules", delay: 14000 },
  { platform: "fitbit", type: "health_goal", priority: "low", title: "🏃 步数达标!", message: "今日已走 10,234 步，目标达成!", delay: 18000 },
];

// ═══════════════════════════════════════════
// CHARACTER COMPONENT
// ═══════════════════════════════════════════
function Character({ state, mood, subAnim }) {
  const SIZE_MAP = {
    idle: 80, alert: 100, waiting: 90, urgent: 110, celebrating: 100, sleeping: 70,
  };
  const size = SIZE_MAP[state] || 80;

  const getCharStyle = () => {
    const base = {
      fontSize: size,
      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      filter: `saturate(${0.5 + mood / 200})`,
      cursor: "pointer",
      userSelect: "none",
      lineHeight: 1,
    };
    if (state === "alert" || state === "urgent") {
      return { ...base, animation: "bounce 0.5s ease infinite" };
    }
    if (state === "celebrating") {
      return { ...base, animation: "spin 1s ease" };
    }
    if (state === "sleeping") {
      return { ...base, opacity: 0.7, animation: "breathe 3s ease-in-out infinite" };
    }
    return { ...base, animation: "sway 3s ease-in-out infinite" };
  };

  return (
    <div style={{ textAlign: "center", position: "relative", minHeight: 140 }}>
      <div style={getCharStyle()}>🐱</div>
      <div style={{
        marginTop: 4, fontSize: 12, color: "#94a3b8",
        fontFamily: "'JetBrains Mono', monospace",
        background: "rgba(15,23,42,0.6)", borderRadius: 6, padding: "2px 8px",
        display: "inline-block",
      }}>
        {subAnim}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// DIALOG BUBBLE
// ═══════════════════════════════════════════
function DialogBubble({ notification, speechState, onAck, onSnooze }) {
  const [displayText, setDisplayText] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    if (!notification || speechState === "silent") {
      setDisplayText("");
      indexRef.current = 0;
      return;
    }
    indexRef.current = 0;
    setDisplayText("");
    const text = notification.message;
    const timer = setInterval(() => {
      indexRef.current++;
      setDisplayText(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(timer);
    }, 40);
    return () => clearInterval(timer);
  }, [notification, speechState]);

  if (!notification || speechState === "silent") return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.95)", borderRadius: 12,
      padding: "12px 16px", maxWidth: 280, boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      border: `2px solid ${PRIORITY_COLORS[notification.priority]}`,
      opacity: speechState === "fading" ? 0.3 : 1,
      transition: "opacity 0.5s ease",
      position: "relative",
    }}>
      <div style={{
        position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
        width: 0, height: 0, borderLeft: "8px solid transparent",
        borderRight: "8px solid transparent",
        borderTop: `8px solid ${PRIORITY_COLORS[notification.priority]}`,
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{
          background: PRIORITY_COLORS[notification.priority], color: "#fff",
          fontSize: 10, padding: "1px 6px", borderRadius: 4, fontWeight: 700,
          textTransform: "uppercase",
        }}>{notification.priority}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{notification.title}</span>
      </div>
      <div style={{ fontSize: 13, color: "#475569", minHeight: 20, fontFamily: "'Noto Sans SC', sans-serif" }}>
        {displayText}
        {indexRef.current < (notification?.message?.length || 0) && (
          <span style={{ animation: "blink 0.8s step-end infinite" }}>▌</span>
        )}
      </div>
      {speechState === "speaking" && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <button onClick={onAck} style={{
            background: "#10b981", color: "#fff", border: "none", borderRadius: 6,
            padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600,
          }}>✓ 已读</button>
          <button onClick={onSnooze} style={{
            background: "#6366f1", color: "#fff", border: "none", borderRadius: 6,
            padding: "4px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600,
          }}>⏰ 稍后</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function DeskBuddyPrototype() {
  const [tab, setTab] = useState("demo");
  const [bodyState, setBodyState] = useState(STATES.IDLE);
  const [speechState, setSpeechState] = useState(SPEECH_STATES.SILENT);
  const [notification, setNotification] = useState(null);
  const [mood, setMood] = useState(80);
  const [subAnim, setSubAnim] = useState(ANIMS.idle[0]);
  const [eventLog, setEventLog] = useState([]);
  const [sources, setSources] = useState(DATA_SOURCES);
  const [isRunning, setIsRunning] = useState(false);
  const [dnd, setDnd] = useState(false);
  const timerRef = useRef([]);

  // Idle sub-animation cycle
  useEffect(() => {
    if (bodyState !== STATES.IDLE) return;
    const timer = setInterval(() => {
      const pool = ANIMS[bodyState] || ANIMS.idle;
      setSubAnim(pool[Math.floor(Math.random() * pool.length)]);
    }, 2500);
    return () => clearInterval(timer);
  }, [bodyState]);

  const processEvent = useCallback((evt) => {
    if (dnd && evt.priority !== "critical") return;

    setEventLog((prev) => [{ ...evt, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
    setNotification(evt);

    // Body state transition
    if (evt.priority === "critical") {
      setBodyState(STATES.URGENT);
      setSubAnim(ANIMS.urgent[0]);
    } else if (evt.priority === "high") {
      setBodyState(STATES.ALERT);
      setSubAnim(ANIMS.alert[0]);
      setTimeout(() => {
        setBodyState(STATES.WAITING);
        setSubAnim(ANIMS.waiting[0]);
      }, 3000);
    } else {
      setBodyState(STATES.ALERT);
      setSubAnim(ANIMS.alert[0]);
      setTimeout(() => {
        setBodyState(STATES.WAITING);
        setSubAnim(ANIMS.waiting[0]);
      }, 2000);
    }

    // Speech state
    setSpeechState(SPEECH_STATES.SPEAKING);
  }, [dnd]);

  const handleAck = () => {
    setBodyState(STATES.CELEBRATING);
    setSubAnim(ANIMS.celebrating[Math.floor(Math.random() * ANIMS.celebrating.length)]);
    setSpeechState(SPEECH_STATES.SILENT);
    setMood((m) => Math.min(100, m + 5));
    setTimeout(() => {
      setBodyState(STATES.IDLE);
      setSubAnim(ANIMS.idle[0]);
      setNotification(null);
    }, 2000);
  };

  const handleSnooze = () => {
    setSpeechState(SPEECH_STATES.FADING);
    setTimeout(() => {
      setSpeechState(SPEECH_STATES.SILENT);
      setBodyState(STATES.IDLE);
      setSubAnim(ANIMS.idle[0]);
      setNotification(null);
    }, 1000);
  };

  const startDemo = () => {
    setIsRunning(true);
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setEventLog([]);
    setBodyState(STATES.IDLE);
    setSpeechState(SPEECH_STATES.SILENT);
    setNotification(null);

    MOCK_EVENTS.forEach((evt) => {
      const t = setTimeout(() => processEvent(evt), evt.delay);
      timerRef.current.push(t);
    });
  };

  const stopDemo = () => {
    setIsRunning(false);
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
    setBodyState(STATES.IDLE);
    setSpeechState(SPEECH_STATES.SILENT);
    setNotification(null);
  };

  const toggleSource = (id) => {
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, connected: !s.connected } : s));
  };

  const sendManual = (priority) => {
    processEvent({
      platform: "manual",
      type: "custom",
      priority,
      title: `手动测试 (${priority})`,
      message: `这是一条 ${priority} 优先级的测试通知消息`,
    });
  };

  const categories = [...new Set(sources.map((s) => s.cat))];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      color: "#e2e8f0",
      fontFamily: "'Noto Sans SC', 'Inter', system-ui, sans-serif",
      padding: 0,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Noto+Sans+SC:wght@400;600;700&display=swap');
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
        @keyframes spin { 0% { transform: rotate(0); } 25% { transform: rotate(10deg); } 75% { transform: rotate(-10deg); } 100% { transform: rotate(0); } }
        @keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes sway { 0%,100% { transform: translateX(0) rotate(0); } 25% { transform: translateX(4px) rotate(2deg); } 75% { transform: translateX(-4px) rotate(-2deg); } }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 0 8px rgba(99,102,241,0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
      `}</style>

      {/* HEADER */}
      <div style={{
        padding: "20px 24px", borderBottom: "1px solid rgba(148,163,184,0.1)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        backdropFilter: "blur(20px)", background: "rgba(15,23,42,0.8)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🐱</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>DeskBuddy</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>交互原型 · 三模块联合演示</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["demo", "sources", "mapping"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? "#6366f1" : "rgba(100,116,139,0.15)",
              color: tab === t ? "#fff" : "#94a3b8",
              border: "none", borderRadius: 8, padding: "8px 16px",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s",
            }}>
              {t === "demo" ? "🎮 角色演示" : t === "sources" ? "🔌 数据源" : "🗺️ 映射表"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

        {/* ═══ TAB: DEMO ═══ */}
        {tab === "demo" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Character Panel */}
            <div style={{
              background: "rgba(30,41,59,0.6)", borderRadius: 16,
              border: "1px solid rgba(148,163,184,0.1)", padding: 24,
              backdropFilter: "blur(10px)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>角色状态</h3>
                <div style={{
                  background: bodyState === "urgent" ? "#ef4444" : bodyState === "alert" ? "#f59e0b" : bodyState === "celebrating" ? "#10b981" : "#6366f1",
                  color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase",
                  animation: bodyState === "urgent" ? "pulse 1s infinite" : "none",
                }}>
                  {bodyState}
                </div>
              </div>

              {/* Character + Bubble */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <DialogBubble notification={notification} speechState={speechState} onAck={handleAck} onSnooze={handleSnooze} />
                <Character state={bodyState} mood={mood} subAnim={subAnim} />
              </div>

              {/* Mood Bar */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
                  <span>心情值</span><span>{mood}/100</span>
                </div>
                <div style={{ background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{
                    width: `${mood}%`, height: "100%", borderRadius: 4,
                    background: mood > 60 ? "#10b981" : mood > 30 ? "#f59e0b" : "#ef4444",
                    transition: "all 0.5s ease",
                  }} />
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                {!isRunning ? (
                  <button onClick={startDemo} style={{
                    flex: 1, background: "#6366f1", color: "#fff", border: "none",
                    borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 700,
                    cursor: "pointer",
                  }}>▶ 启动演示</button>
                ) : (
                  <button onClick={stopDemo} style={{
                    flex: 1, background: "#ef4444", color: "#fff", border: "none",
                    borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 700,
                    cursor: "pointer",
                  }}>■ 停止</button>
                )}
                <button onClick={() => setDnd(!dnd)} style={{
                  background: dnd ? "#f59e0b" : "rgba(100,116,139,0.2)",
                  color: dnd ? "#fff" : "#94a3b8", border: "none", borderRadius: 8,
                  padding: "10px 14px", fontSize: 13, cursor: "pointer",
                }}>
                  {dnd ? "🔕 勿扰中" : "🔔 勿扰"}
                </button>
              </div>

              {/* Manual Send */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>手动发送测试通知：</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["low", "normal", "high", "critical"].map((p) => (
                    <button key={p} onClick={() => sendManual(p)} style={{
                      flex: 1, background: PRIORITY_COLORS[p], color: "#fff", border: "none",
                      borderRadius: 6, padding: "6px 0", fontSize: 11, fontWeight: 700,
                      cursor: "pointer", textTransform: "uppercase",
                    }}>{p}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Event Log */}
            <div style={{
              background: "rgba(30,41,59,0.6)", borderRadius: 16,
              border: "1px solid rgba(148,163,184,0.1)", padding: 24,
              backdropFilter: "blur(10px)", maxHeight: 600, display: "flex", flexDirection: "column",
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>事件流 · Event Log</h3>
              <div style={{ flex: 1, overflow: "auto" }}>
                {eventLog.length === 0 && (
                  <div style={{ textAlign: "center", color: "#475569", padding: "40px 0", fontSize: 13 }}>
                    点击「启动演示」或手动发送通知...
                  </div>
                )}
                {eventLog.map((evt, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 10, padding: "8px 12px", marginBottom: 6,
                    background: "rgba(15,23,42,0.5)", borderRadius: 8,
                    borderLeft: `3px solid ${PRIORITY_COLORS[evt.priority]}`,
                    animation: "slideIn 0.3s ease",
                    fontSize: 12,
                  }}>
                    <div style={{ color: "#64748b", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", fontSize: 10, paddingTop: 2 }}>
                      {evt.time}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{evt.title}</div>
                      <div style={{ color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{evt.message}</div>
                    </div>
                    <div style={{
                      fontSize: 9, background: PRIORITY_COLORS[evt.priority], color: "#fff",
                      padding: "2px 6px", borderRadius: 3, fontWeight: 700, height: "fit-content",
                      textTransform: "uppercase",
                    }}>{evt.priority}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ TAB: SOURCES ═══ */}
        {tab === "sources" && (
          <div>
            <div style={{ marginBottom: 20, padding: "16px 20px", background: "rgba(99,102,241,0.1)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: 13, color: "#a5b4fc" }}>
                以下展示 DeskBuddy 支持的所有数据源。每个数据源实现统一的 <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>DataSource trait</code>，通过 Rust 插件注册表管理，点击开关模拟启用/禁用。
              </div>
            </div>
            {categories.map((cat) => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, color: "#94a3b8", marginBottom: 10, fontWeight: 600 }}>{cat}</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {sources.filter((s) => s.cat === cat).map((s) => (
                    <div key={s.id} onClick={() => toggleSource(s.id)} style={{
                      background: s.connected ? "rgba(16,185,129,0.08)" : "rgba(30,41,59,0.6)",
                      border: `1px solid ${s.connected ? "rgba(16,185,129,0.3)" : "rgba(148,163,184,0.1)"}`,
                      borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                      transition: "all 0.2s", display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <span style={{ fontSize: 24 }}>{s.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                          {s.name}
                          {s.experimental && <span style={{ fontSize: 9, background: "#ef4444", color: "#fff", padding: "1px 5px", borderRadius: 3 }}>实验性</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {s.connected ? "● 已连接" : "○ 未连接"}
                        </div>
                      </div>
                      <div style={{
                        width: 40, height: 22, borderRadius: 11,
                        background: s.connected ? "#10b981" : "#334155",
                        position: "relative", transition: "background 0.2s",
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 9,
                          background: "#fff", position: "absolute", top: 2,
                          left: s.connected ? 20 : 2, transition: "left 0.2s",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ TAB: MAPPING ═══ */}
        {tab === "mapping" && (
          <div>
            <div style={{ marginBottom: 20, padding: "16px 20px", background: "rgba(99,102,241,0.1)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: 13, color: "#a5b4fc" }}>
                XState v5 并行状态机将每个事件映射为 Body（肢体动画）+ Speech（文字/语音）两个维度的独立响应。以下为完整映射关系。
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["事件类型", "优先级", "Body 状态", "Body 动画", "气泡内容", "音效", "TTS"].map((h) => (
                      <th key={h} style={{
                        background: "rgba(99,102,241,0.15)", padding: "10px 12px",
                        textAlign: "left", fontWeight: 700, color: "#a5b4fc",
                        borderBottom: "2px solid rgba(99,102,241,0.3)",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["task_complete", "normal", "alert→waiting", "alert_jump → waiting_look", "✅ 任务完成", "ding", "否"],
                    ["permission_required", "critical", "→ urgent", "urgent_panic", "🔐 需要授权", "urgent", "是"],
                    ["email_new", "normal", "alert→waiting", "alert_perk_up → waiting", "📧 新邮件: {sender}", "chime", "否"],
                    ["calendar_reminder", "high", "alert→waiting", "alert_jump → waiting", "📅 {event} 即将开始", "bell", "是"],
                    ["im_message", "low", "alert(短)", "alert_perk_up", "💬 {sender}: {text}", "pop", "否"],
                    ["timer_done", "high", "alert→waiting", "alert_wave_sign", "⏰ 番茄钟结束", "ring", "是"],
                    ["health_goal", "low", "celebrating", "celeb_dance", "🏃 步数达标!", "fanfare", "否"],
                    ["webhook_custom", "可配置", "alert→waiting", "alert_perk_up", "自定义内容", "ding", "可配置"],
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
                      {row.map((cell, j) => (
                        <td key={j} style={{
                          padding: "10px 12px", color: j === 1 ? PRIORITY_COLORS[cell] || "#e2e8f0" : "#cbd5e1",
                          fontWeight: j <= 1 ? 600 : 400,
                          fontFamily: j === 3 || j === 5 ? "'JetBrains Mono', monospace" : "inherit",
                          fontSize: j === 3 || j === 5 ? 11 : 12,
                          whiteSpace: "nowrap",
                        }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* State transition diagram */}
            <div style={{
              marginTop: 24, background: "rgba(30,41,59,0.6)", borderRadius: 16,
              border: "1px solid rgba(148,163,184,0.1)", padding: 24,
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>状态转换图 · Body Region</h3>
              <div style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                gap: 8, flexWrap: "wrap", fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              }}>
                {[
                  { from: "idle", arrow: "→", to: "alert", label: "NEW_EVENT", color: "#f59e0b" },
                  { from: "alert", arrow: "→", to: "waiting", label: "3秒后", color: "#3b82f6" },
                  { from: "waiting", arrow: "→", to: "urgent", label: "30秒超时", color: "#ef4444" },
                  { from: "waiting", arrow: "→", to: "celebrating", label: "USER_ACK", color: "#10b981" },
                  { from: "celebrating", arrow: "→", to: "idle", label: "2秒后", color: "#6366f1" },
                  { from: "*any", arrow: "→", to: "sleeping", label: "DND_ON", color: "#94a3b8" },
                ].map((t, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "rgba(15,23,42,0.5)", padding: "6px 10px", borderRadius: 6,
                  }}>
                    <span style={{ color: "#94a3b8" }}>{t.from}</span>
                    <span style={{ color: t.color }}>→</span>
                    <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{t.to}</span>
                    <span style={{ color: "#475569", fontSize: 10 }}>({t.label})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
